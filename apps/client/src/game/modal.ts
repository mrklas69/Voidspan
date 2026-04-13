// Modal helper — centrovaný dialog s overlay.
// Draft verze: title + body text + Close button. Otevření/zavření přes open()/close().
// Zavírá se klikem mimo panel, klikem na Close, nebo klávesou ESC.
//
// Použití:
//   const modal = new ModalManager(this);
//   modal.open({ title: "Help", body: "...", onClose: () => {...} });

import Phaser from "phaser";
import {
  UI_PANEL_BG,
  UI_BORDER_DIM,
  UI_TEXT_PRIMARY,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
  FONT_FAMILY,
  FONT_SIZE_H2,
  FONT_SIZE_BODY,
  FONT_SIZE_HUD,
  FONT_SIZE_PANEL_HEADER,
} from "./palette";

const DEPTH = 2000; // nad tooltipy (1000)
const PANEL_W = 520;
const PANEL_MIN_H = 240;
const PADDING = 24;
const OVERLAY_ALPHA = 0.6;

export interface ModalOptions {
  title: string;
  body: string;
  onClose?: () => void;
}

export class ModalManager {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private open_ = false;
  private escHandler?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.close());
  }

  isOpen(): boolean {
    return this.open_;
  }

  open(opts: ModalOptions): void {
    if (this.open_) return;
    this.open_ = true;

    const cw = this.scene.scale.width;
    const ch = this.scene.scale.height;

    // Overlay — semi-transparent black přes celé plátno, blokuje kliky do hry.
    const overlay = this.scene.add
      .rectangle(0, 0, cw, ch, 0x000000, OVERLAY_ALPHA)
      .setOrigin(0, 0)
      .setDepth(DEPTH)
      .setInteractive();
    overlay.on("pointerdown", () => this.close(opts.onClose));
    this.layer.push(overlay);

    // Nejdřív změř body text (bez přidání), ať určíme výšku panelu.
    const bodyStyle = {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_BODY,
      color: UI_TEXT_PRIMARY,
      wordWrap: { width: PANEL_W - 2 * PADDING },
      lineSpacing: 4,
    };
    const probeBody = this.scene.add.text(0, 0, opts.body, bodyStyle).setVisible(false);
    const bodyH = probeBody.height;
    probeBody.destroy();

    const titleH = 36;
    const closeH = 40;
    const panelH = Math.max(PANEL_MIN_H, PADDING + titleH + 16 + bodyH + 16 + closeH + PADDING);
    const panelX = Math.floor((cw - PANEL_W) / 2);
    const panelY = Math.floor((ch - panelH) / 2);

    // Border rect (outer) + bg rect (inner, 1px inset) — stejný trik jako tooltip.
    const border = this.scene.add
      .rectangle(panelX - 1, panelY - 1, PANEL_W + 2, panelH + 2, UI_BORDER_DIM)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 1);
    const bg = this.scene.add
      .rectangle(panelX, panelY, PANEL_W, panelH, UI_PANEL_BG)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2)
      .setInteractive(); // ať se proklikem nezavřel overlay
    bg.on("pointerdown", (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      void pointer;
    });
    this.layer.push(border, bg);

    // Title + underline (stejný axiom jako boční panely).
    const title = this.scene.add
      .text(panelX + PADDING, panelY + PADDING, opts.title, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_H2,
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
    const btnW = 100;
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
        fontSize: FONT_SIZE_HUD,
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

    // ESC zavře modal.
    this.escHandler = () => this.close(opts.onClose);
    this.scene.input.keyboard?.once("keydown-ESC", this.escHandler);

    // Quiet unused — reserve pro potenciální future multi-tone.
    void FONT_SIZE_PANEL_HEADER;
  }

  close(onClose?: () => void): void {
    if (!this.open_) return;
    this.open_ = false;
    for (const obj of this.layer) obj.destroy();
    this.layer = [];
    if (this.escHandler) {
      this.scene.input.keyboard?.off("keydown-ESC", this.escHandler);
      this.escHandler = undefined;
    }
    onClose?.();
  }
}
