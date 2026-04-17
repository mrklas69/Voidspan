// Modal helper — centrovaný dialog s overlay.
// Draft verze: title + body text + Close button. Otevření/zavření přes open()/close().
// Zavírá se klikem mimo panel, klikem na Close, nebo klávesou ESC.
//
// Použití:
//   const modal = new ModalManager(this);
//   modal.open({ title: "Help", body: "...", onClose: () => {...} });

import Phaser from "phaser";
import {
  UI_BORDER_DIM,
  UI_OVERLAY_BLACK,
  COL_HULL_DARK,
  UI_TEXT_PRIMARY,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
  FONT_FAMILY,
  FONT_SIZE_PANEL,
  FONT_SIZE_TIP,
} from "./palette";

const DEPTH = 2000; // nad tooltipy (1000)
const PANEL_W = 520;
const PANEL_MIN_H = 240;
const PADDING = 24;
// Overlay jen lehce zatmí svět — hvězdy pod panelem mají prosvítat
// (axiom: pozadí UI boxů = transparentní, viz memory feedback_dialog_bg_transparent).
const OVERLAY_ALPHA = 0.25;
const PANEL_BG_ALPHA = 0.9;

export interface ModalOptions {
  title: string;
  body: string;
  onClose?: () => void;
  // Volitelné druhé tlačítko vedle Close (vlevo). Jeho onClick se volá PŘED
  // zavřením modalu, pokud chce caller modal zavřít sám, zavolá si close()
  // nebo nechá default (tlačítko zavírá modal po onClick).
  action?: { label: string; onClick: () => void };
}

export class ModalManager {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private open_ = false;
  private onCloseCb?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.close());
  }

  isOpen(): boolean {
    return this.open_;
  }

  // Bezargumentová varianta pro ESC stack — uvnitř drží uloženou onClose callback.
  closeFromEsc(): void {
    this.close(this.onCloseCb);
  }

  open(opts: ModalOptions): void {
    if (this.open_) return;
    this.open_ = true;
    this.onCloseCb = opts.onClose;

    const cw = this.scene.scale.width;
    const ch = this.scene.scale.height;

    // Overlay — semi-transparent black přes celé plátno, blokuje kliky do hry.
    const overlay = this.scene.add
      .rectangle(0, 0, cw, ch, UI_OVERLAY_BLACK, OVERLAY_ALPHA)
      .setOrigin(0, 0)
      .setDepth(DEPTH)
      .setInteractive();
    overlay.on("pointerdown", () => this.close(opts.onClose));
    this.layer.push(overlay);

    // Nejdřív změř body text (bez přidání), ať určíme výšku panelu.
    const bodyStyle = {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_PANEL,
      color: UI_TEXT_PRIMARY,
      wordWrap: { width: PANEL_W - 2 * PADDING },
      lineSpacing: 4,
    };
    const probeBody = this.scene.add.text(0, 0, opts.body, bodyStyle).setVisible(false);
    const bodyH = probeBody.height;
    probeBody.destroy();

    const titleH = 36;
    const closeH = 30; // tlačítko −25 %
    const panelH = Math.max(PANEL_MIN_H, PADDING + titleH + 16 + bodyH + 16 + closeH + PADDING);
    const panelX = Math.floor((cw - PANEL_W) / 2);
    const panelY = Math.floor((ch - panelH) / 2);

    // Panel: transparentní bg + 1px stroke obrys. Samostatný solid border rect
    // pod bg by zakryl hvězdy (learned bug — bg alpha pak neprosvítá).
    const bg = this.scene.add
      .rectangle(panelX, panelY, PANEL_W, panelH, COL_HULL_DARK, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setStrokeStyle(1, UI_BORDER_DIM)
      .setDepth(DEPTH + 2)
      .setInteractive();
    bg.on("pointerdown", (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      void pointer;
    });
    this.layer.push(bg);

    // Title + underline (stejný axiom jako boční panely).
    const title = this.scene.add
      .text(panelX + PADDING, panelY + PADDING, opts.title, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_PANEL,
        color: UI_TEXT_ACCENT,
      })
      .setDepth(DEPTH + 3);
    const underlineY = panelY + PADDING + 34;
    const underline = this.scene.add
      .rectangle(panelX + PADDING, underlineY, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 3);
    this.layer.push(title, underline);

    // Body text.
    const body = this.scene.add
      .text(panelX + PADDING, underlineY + 16, opts.body, bodyStyle)
      .setDepth(DEPTH + 3);
    this.layer.push(body);

    // Close button — bottom-right v panelu. Bg rect + label, hover highlight.
    const btnW = 75; // tlačítko −25 %
    const btnX = panelX + PANEL_W - PADDING - btnW;
    const btnY = panelY + panelH - PADDING - closeH;
    const btnBg = this.scene.add
      .rectangle(btnX, btnY, btnW, closeH, UI_BORDER_DIM)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 3)
      .setInteractive({ useHandCursor: true });
    const btnLabel = this.scene.add
      .text(btnX + btnW / 2, btnY + closeH / 2, "Close", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH + 4);
    btnBg.on("pointerover", () => btnBg.setFillStyle(UI_SELECT_STROKE));
    btnBg.on("pointerout", () => btnBg.setFillStyle(UI_BORDER_DIM));
    btnBg.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.close(opts.onClose);
    });
    this.layer.push(btnBg, btnLabel);

    // Volitelné action tlačítko vlevo od Close (šířka dle textu + padding 16).
    // Klik: onClick() → close modal. Action jsou akce „udělej a odejdi".
    if (opts.action) {
      const GAP = 8;
      // Širší podle délky labelu — měříme přes skrytý probe text.
      const probe = this.scene.add.text(0, 0, opts.action.label, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
      }).setVisible(false);
      const actionW = Math.max(btnW, Math.ceil(probe.width) + 24);
      probe.destroy();
      const actionX = btnX - GAP - actionW;

      const actionBg = this.scene.add
        .rectangle(actionX, btnY, actionW, closeH, UI_BORDER_DIM)
        .setOrigin(0, 0)
        .setDepth(DEPTH + 3)
        .setInteractive({ useHandCursor: true });
      const actionLabel = this.scene.add
        .text(actionX + actionW / 2, btnY + closeH / 2, opts.action.label, {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_TIP,
          color: UI_TEXT_ACCENT,
        })
        .setOrigin(0.5, 0.5)
        .setDepth(DEPTH + 4);
      actionBg.on("pointerover", () => actionBg.setFillStyle(UI_SELECT_STROKE));
      actionBg.on("pointerout", () => actionBg.setFillStyle(UI_BORDER_DIM));
      const actionFn = opts.action.onClick;
      actionBg.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.close(opts.onClose);
        actionFn();
      });
      this.layer.push(actionBg, actionLabel);
    }

    // ESC řeší globální handler v GameScene (F5).
  }

  close(onClose?: () => void): void {
    if (!this.open_) return;
    this.open_ = false;
    for (const obj of this.layer) obj.destroy();
    this.layer = [];
    this.onCloseCb = undefined;
    onClose?.();
  }
}
