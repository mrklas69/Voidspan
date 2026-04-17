// Tooltip helper — hover → drobný panel s textem.
// Axiom (GLOSSARY → UI Layout → Tooltips): 400ms delay, bg #0a0a10 + amber border,
// position pod kurzorem s auto-flip, max šířka 280 px.
//
// Použití:
//   const tooltips = new TooltipManager(this);           // v GameScene.create()
//   tooltips.attach(gameObject, () => "text" | null);    // null = nezobrazit
//
// `provider` se volá při hover — lze vrátit dynamický text per pointer event.
// Více řádků: první řádek = primární, další řádky dim (metadata/hotkey).

import Phaser from "phaser";
import {
  UI_PANEL_BG,
  UI_BORDER_DIM,
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  FONT_FAMILY,
  FONT_SIZE_TIP,
} from "./palette";

export type TooltipContent = {
  header: string;
  headerColor?: string;
  body: string;
};

// Společný předek interaktivních Phaser objektů (Text, Image, Rectangle, Container, Graphics).
// Vyhneme se `as unknown as` castu při ensureInteractive — `input` je nullable
// dokud `setInteractive(...)` neběží.
type InteractiveGameObject = Phaser.GameObjects.GameObject & {
  input: Phaser.Types.Input.InteractiveObject | null;
  setInteractive: (config?: unknown) => Phaser.GameObjects.GameObject;
};

const DELAY_MS = 400;
const REFRESH_MS = 100; // interval pro re-volání provideru → živý text při držení myši
const PAD_X = 8;
const PAD_Y = 4;
const OFFSET = 12;
const DEPTH = 1800; // nad floating panely (1500), pod modaly (2000)

export class TooltipManager {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private headerText: Phaser.GameObjects.Text;
  private timer?: Phaser.Time.TimerEvent;
  private refreshTimer?: Phaser.Time.TimerEvent;
  private activeProvider?: () => string | TooltipContent | null;
  private lastPointer = { x: 0, y: 0 };
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Border = lehce větší rect pod bg; rozdíl = 1px "tah".
    this.border = scene.add
      .rectangle(0, 0, 10, 10, UI_BORDER_DIM)
      .setOrigin(0, 0)
      .setDepth(DEPTH)
      .setVisible(false);
    this.bg = scene.add
      .rectangle(0, 0, 10, 10, UI_PANEL_BG)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 1)
      .setVisible(false);
    // Responzivní šířka (S22) — wordWrap na canvas max, tooltip bg se přizpůsobí obsahu.
    const wrapMax = scene.scale.width - 4 * OFFSET;
    this.text = scene.add
      .text(0, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
        color: UI_TEXT_PRIMARY,
        wordWrap: { width: wrapMax },
        lineSpacing: 2,
      })
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2)
      .setVisible(false);
    this.headerText = scene.add
      .text(0, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
        color: UI_TEXT_PRIMARY,
        wordWrap: { width: wrapMax },
        lineSpacing: 2,
      })
      .setOrigin(0, 0)
      .setDepth(DEPTH + 3)
      .setVisible(false);

    // Cleanup při shutdown scény (F5 / restart) — ať timer nezůstane viset.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  // Přidá hover handler na cílový objekt. Provider se volá při show.
  // Target musí být interactive (jinak Phaser hover eventy neposílá).
  //
  // **Kurzor ruky (globální chování S32):** hand cursor se dynamicky nastavuje
  // jen když `provider()` vrací non-null — tj. řádek opravdu má tooltip obsah
  // (typicky: zkrácený řádek drží plnou verzi v tooltip). Když provider vrátí
  // null (řádek se celý vešel, prázdný pool slot), cursor je default.
  // Izomorfismus „kurzor signalizuje dostupnou akci/infotip".
  //
  // Klikatelné prvky (close/scrollbar/chips/Bottom Bar) si volají vlastní
  // `setInteractive({ useHandCursor: true })` — Phaser spravuje jejich cursor
  // interně přes pointerover/out, naše `setDefaultCursor` se s tím nekříží
  // (hover se vždy nachází buď nad interactivem s cursorem, nebo nad pozadím).
  attach(
    target: InteractiveGameObject,
    provider: () => string | TooltipContent | null,
  ): void {
    if (!target.input) {
      target.setInteractive();
    }

    let hovering = false;

    target.on("pointerover", (pointer: Phaser.Input.Pointer) => {
      hovering = true;
      this.activeProvider = provider;
      this.lastPointer = { x: pointer.x, y: pointer.y };
      const content = provider();
      this.updateCursor(content !== null);
      if (!content) return;
      this.schedule(pointer.x, pointer.y, content);
    });

    // HP-unified axiom (S16): tooltip musí reflektovat živá data (např. hp/hp_max
    // se mění spojitě během opravy). Na každý pointermove znovu zavoláme provider
    // a když je tooltip viditelný, přepíšeme text + přepozicujeme bg.
    // Cursor se aktualizuje i bez viditelného tooltipu — user ho vidí hned.
    target.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!hovering) return;
      this.lastPointer = { x: pointer.x, y: pointer.y };
      const fresh = provider();
      this.updateCursor(fresh !== null);
      if (this.visible) {
        if (fresh) this.show(pointer.x, pointer.y, fresh);
        else this.hide();
      }
    });

    target.on("pointerout", () => {
      hovering = false;
      this.updateCursor(false);
      this.hide();
    });
  }

  // Globální cursor update — Phaser setDefaultCursor mění CSS cursor na canvas.
  // Interaktivní prvky s vlastním useHandCursor (close button, chips, ...) si
  // cursor spravují samy přes Phaser internal pointerover/out handlery, naše
  // volání se neaplikuje, dokud je hover nad jejich objektem.
  private updateCursor(hasTooltip: boolean): void {
    this.scene.input.setDefaultCursor(hasTooltip ? "pointer" : "default");
  }

  private schedule(x: number, y: number, content: string | TooltipContent): void {
    this.cancelTimer();
    this.timer = this.scene.time.delayedCall(DELAY_MS, () => {
      this.show(x, y, content);
    });
  }

  private show(x: number, y: number, content: string | TooltipContent): void {
    let headerStr: string | undefined;
    let headerColor: string | undefined;
    let bodyStr: string;

    if (typeof content === "string") {
      bodyStr = content;
    } else {
      headerStr = content.header;
      headerColor = content.headerColor;
      bodyStr = content.body;
    }

    // Barevný header (S23) — volitelný první řádek se sémantickou barvou.
    if (headerStr) {
      this.headerText.setText(headerStr);
      this.headerText.setColor(headerColor ?? UI_TEXT_PRIMARY);
      this.headerText.setVisible(true);
    } else {
      this.headerText.setText("");
      this.headerText.setVisible(false);
    }

    this.text.setText(bodyStr);
    this.text.setColor(UI_TEXT_PRIMARY);

    const headerH = headerStr ? this.headerText.height : 0;
    const gap = headerStr ? 4 : 0;
    const tw = Math.max(headerStr ? this.headerText.width : 0, this.text.width);
    const th = headerH + gap + this.text.height;
    const w = tw + 2 * PAD_X;
    const h = th + 2 * PAD_Y;

    this.border.setSize(w + 2, h + 2);
    this.bg.setSize(w, h);

    this.position(x, y, w, h, headerH, gap);

    this.border.setVisible(true);
    this.bg.setVisible(true);
    this.text.setVisible(true);
    this.visible = true;

    this.startRefreshTimer();
    void UI_TEXT_DIM;
  }

  private position(px: number, py: number, w?: number, h?: number, headerH = 0, gap = 0): void {
    const tw = w ?? this.bg.width;
    const th = h ?? this.bg.height;
    const canvasW = this.scene.scale.width;
    const canvasH = this.scene.scale.height;

    // Default: pod + vpravo od kurzoru. Auto-flip pokud přečnívá.
    let x = px + OFFSET;
    let y = py + OFFSET;
    if (x + tw + 2 > canvasW) x = px - tw - OFFSET;
    if (y + th + 2 > canvasH) y = py - th - OFFSET;
    x = Math.max(0, x);
    y = Math.max(0, y);

    this.border.setPosition(x - 1, y - 1);
    this.bg.setPosition(x, y);
    if (headerH > 0) {
      this.headerText.setPosition(x + PAD_X, y + PAD_Y);
      this.text.setPosition(x + PAD_X, y + PAD_Y + headerH + gap);
    } else {
      this.text.setPosition(x + PAD_X, y + PAD_Y);
    }
  }

  private hide(): void {
    this.cancelTimer();
    this.stopRefreshTimer();
    this.activeProvider = undefined;
    if (!this.visible) return;
    this.border.setVisible(false);
    this.bg.setVisible(false);
    this.text.setVisible(false);
    this.headerText.setVisible(false);
    this.visible = false;
  }

  private startRefreshTimer(): void {
    this.stopRefreshTimer();
    // Phaser loop: true → volá se dokola každých REFRESH_MS.
    this.refreshTimer = this.scene.time.addEvent({
      delay: REFRESH_MS,
      loop: true,
      callback: () => {
        if (!this.visible || !this.activeProvider) return;
        const fresh = this.activeProvider();
        if (fresh === null) {
          this.hide();
          return;
        }
        // Re-render na stejné pozici — show() změří nový text a upraví bg/border.
        this.show(this.lastPointer.x, this.lastPointer.y, fresh);
      },
    });
  }

  private stopRefreshTimer(): void {
    if (this.refreshTimer) {
      this.refreshTimer.remove();
      this.refreshTimer = undefined;
    }
  }

  private cancelTimer(): void {
    if (this.timer) {
      this.timer.remove();
      this.timer = undefined;
    }
  }

  private destroy(): void {
    this.cancelTimer();
    this.stopRefreshTimer();
    this.border.destroy();
    this.bg.destroy();
    this.text.destroy();
    this.headerText.destroy();
  }
}
