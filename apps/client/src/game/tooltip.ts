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
  FONT_SIZE_HINT,
} from "./palette";

const DELAY_MS = 400;
const REFRESH_MS = 100; // interval pro re-volání provideru → živý text při držení myši
const MAX_WIDTH = 280;
const PAD_X = 8;
const PAD_Y = 4;
const OFFSET = 12;
const DEPTH = 1000;

export class TooltipManager {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private timer?: Phaser.Time.TimerEvent;
  private refreshTimer?: Phaser.Time.TimerEvent;
  private activeProvider?: () => string | null;
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
    this.text = scene.add
      .text(0, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_HINT,
        color: UI_TEXT_PRIMARY,
        wordWrap: { width: MAX_WIDTH - 2 * PAD_X },
        lineSpacing: 2,
      })
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2)
      .setVisible(false);

    // Cleanup při shutdown scény (F5 / restart) — ať timer nezůstane viset.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  // Přidá hover handler na cílový objekt. Provider se volá při show.
  // Target musí být interactive (jinak Phaser hover eventy neposílá).
  attach(
    target: Phaser.GameObjects.GameObject & { input?: unknown },
    provider: () => string | null,
  ): void {
    // Ensure interactive — pro Text/Image/Rectangle je to bezpečné.
    const anyTarget = target as unknown as {
      input: Phaser.Types.Input.InteractiveObject | null;
      setInteractive: (config?: unknown) => unknown;
    };
    if (!anyTarget.input) {
      anyTarget.setInteractive({ useHandCursor: true });
    }

    let hovering = false;

    target.on("pointerover", (pointer: Phaser.Input.Pointer) => {
      hovering = true;
      this.activeProvider = provider;
      this.lastPointer = { x: pointer.x, y: pointer.y };
      const text = provider();
      if (!text) return;
      this.schedule(pointer.x, pointer.y, text);
    });

    // HP-unified axiom (S16): tooltip musí reflektovat živá data (např. hp/hp_max
    // se mění spojitě během opravy). Na každý pointermove znovu zavoláme provider
    // a když je tooltip viditelný, přepíšeme text + přepozicujeme bg.
    target.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!hovering) return;
      this.lastPointer = { x: pointer.x, y: pointer.y };
      if (this.visible) {
        const fresh = provider();
        if (fresh) this.show(pointer.x, pointer.y, fresh);
        else this.hide();
      }
    });

    target.on("pointerout", () => {
      hovering = false;
      this.hide();
    });
  }

  private schedule(x: number, y: number, text: string): void {
    this.cancelTimer();
    this.timer = this.scene.time.delayedCall(DELAY_MS, () => {
      this.show(x, y, text);
    });
  }

  private show(x: number, y: number, text: string): void {
    // Obarvi řádky: první amber bright, další dim. Použijeme RichText přes styl —
    // Phaser Text nepodporuje per-line barvu bez BBCode pluginu, takže primární
    // barva + dim aplikujeme via text color tag workaround. Pro KISS: všechno
    // primární, druhé+ řádky prefixujeme mezerou a nižším kontrastem přes alpha.
    // Jednodušší řešení: dvě Text instance by bylo over-engineered. Pro P1 stačí
    // jediná barva — pokud bude potřeba multi-tone, přidáme později.
    this.text.setText(text);
    this.text.setColor(UI_TEXT_PRIMARY);

    const tw = Math.min(this.text.width, MAX_WIDTH - 2 * PAD_X);
    const th = this.text.height;
    const w = tw + 2 * PAD_X;
    const h = th + 2 * PAD_Y;

    // Border rect = outer, bg rect = inset 1px.
    this.border.setSize(w + 2, h + 2);
    this.bg.setSize(w, h);

    this.position(x, y, w, h);

    this.border.setVisible(true);
    this.bg.setVisible(true);
    this.text.setVisible(true);
    this.visible = true;

    // Refresh timer — periodicky přepisuje text z activeProvider, aby tooltip
    // reflektoval živá data (hp spojitě roste, task progress, resources…).
    this.startRefreshTimer();

    // Quiet the unused warning — kept for future multi-line tone.
    void UI_TEXT_DIM;
  }

  private position(px: number, py: number, w?: number, h?: number): void {
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
    this.text.setPosition(x + PAD_X, y + PAD_Y);
  }

  private hide(): void {
    this.cancelTimer();
    this.stopRefreshTimer();
    this.activeProvider = undefined;
    if (!this.visible) return;
    this.border.setVisible(false);
    this.bg.setVisible(false);
    this.text.setVisible(false);
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
  }
}
