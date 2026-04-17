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
  COL_AMBER_BRIGHT,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
  FONT_SIZE_TIP,
} from "./palette";

const DEPTH = 2000; // nad tooltipy (1000)
const PANEL_W_1COL = 520;
const PANEL_W_2COL = 720; // širší panel pro dvousloupcový obsah (např. Help)
const PANEL_MIN_H = 240;
const PADDING = 24;
// Overlay jen lehce zatmí svět — hvězdy pod panelem mají prosvítat
// (axiom: pozadí UI boxů = transparentní, viz memory feedback_dialog_bg_transparent).
const OVERLAY_ALPHA = 0.25;
const PANEL_BG_ALPHA = 0.9;

export interface ModalOptions {
  title: string;
  // Buď `body` (single-column), NEBO `bodyLeft` + `bodyRight` (2 sloupce).
  // Pokud jsou nastaveny oba 2-col stringy, body se ignoruje a panel je širší.
  body?: string;
  bodyLeft?: string;
  bodyRight?: string;
  onClose?: () => void;
  // Volitelné druhé tlačítko vedle Close (vlevo). Jeho onClick se volá PŘED
  // zavřením modalu, pokud chce caller modal zavřít sám, zavolá si close()
  // nebo nechá default (tlačítko zavírá modal po onClick).
  action?: { label: string; onClick: () => void };
  // Blikající kurzor za posledním znakem `body` (jen pro 1-col režim).
  // Kreslený jako Rectangle (nezávislý na fontu — Atkinson subset nemá U+2588),
  // tween yoyo alpha 1 → 0.2 @ 500 ms. Používá QM Terminal pro CRT vibe.
  cursor?: boolean;
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

    // 2-col mode: pokud caller dodal bodyLeft + bodyRight, panel se rozšíří
    // a text se vykreslí do dvou sloupců (gap = PADDING).
    const twoCol = opts.bodyLeft !== undefined && opts.bodyRight !== undefined;
    const PANEL_W = twoCol ? PANEL_W_2COL : PANEL_W_1COL;
    const bodyWrapW = twoCol ? (PANEL_W - 3 * PADDING) / 2 : PANEL_W - 2 * PADDING;

    const bodyStyle = {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_SIDEPANEL,
      color: UI_TEXT_PRIMARY,
      wordWrap: { width: bodyWrapW },
      lineSpacing: 4,
    };

    // Změř výšku (bez přidání do scéna layeru) — v 2-col max z obou sloupců.
    let bodyH: number;
    if (twoCol) {
      const probeL = this.scene.add.text(0, 0, opts.bodyLeft!, bodyStyle).setVisible(false);
      const probeR = this.scene.add.text(0, 0, opts.bodyRight!, bodyStyle).setVisible(false);
      bodyH = Math.max(probeL.height, probeR.height);
      probeL.destroy();
      probeR.destroy();
    } else {
      const probeBody = this.scene.add.text(0, 0, opts.body ?? "", bodyStyle).setVisible(false);
      bodyH = probeBody.height;
      probeBody.destroy();
    }

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
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setDepth(DEPTH + 3);
    const underlineY = panelY + PADDING + 34;
    const underline = this.scene.add
      .rectangle(panelX + PADDING, underlineY, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 3);
    this.layer.push(title, underline);

    // Body text — 1 sloupec nebo 2 sloupce (gap = PADDING mezi nimi).
    const bodyY = underlineY + 16;
    if (twoCol) {
      const leftText = this.scene.add
        .text(panelX + PADDING, bodyY, opts.bodyLeft!, bodyStyle)
        .setDepth(DEPTH + 3);
      const rightText = this.scene.add
        .text(panelX + PADDING + bodyWrapW + PADDING, bodyY, opts.bodyRight!, bodyStyle)
        .setDepth(DEPTH + 3);
      this.layer.push(leftText, rightText);
    } else {
      const body = this.scene.add
        .text(panelX + PADDING, bodyY, opts.body ?? "", bodyStyle)
        .setDepth(DEPTH + 3);
      this.layer.push(body);

      // Blikající kurzor — Rectangle za posledním řádkem body. Kreslený geometrií
      // (ne Text), protože `█` U+2588 není v Atkinson Hyperlegible latin subsetu.
      if (opts.cursor && opts.body) {
        const wrapped = body.getWrappedText(opts.body);
        const lastLine = wrapped.at(-1) ?? "";
        // Prázdný wrap (body = "") = nic k zarovnání za. Přeskočíme, jinak by
        // kurzor skočil na (x, y + height) = pod text area.
        if (lastLine.length > 0) {
          const probe = this.scene.add.text(0, 0, lastLine, bodyStyle).setVisible(false);
          const lastW = probe.width;
          const lineH = probe.height;
          probe.destroy();

          // Geometrie kurzoru: aspect 55 % = šířka průměrného sans-serif glyphu 'M'.
          // Vertical inset 4 px = sedí na x-height baseline, nečouhá nad majuskule.
          // Gap 2 px = vizuální dech mezi `>` a kurzorem.
          const CURSOR_ASPECT = 0.55;
          const CURSOR_V_INSET = 4;
          const CURSOR_GAP = 2;
          const cursorW = Math.max(6, Math.round(lineH * CURSOR_ASPECT));
          const cursorH = Math.max(10, lineH - CURSOR_V_INSET);
          const cursorX = body.x + lastW + CURSOR_GAP;
          const cursorY = body.y + body.height - cursorH - CURSOR_GAP;

          const cursor = this.scene.add
            .rectangle(cursorX, cursorY, cursorW, cursorH, COL_AMBER_BRIGHT, 1)
            .setOrigin(0, 0)
            .setDepth(DEPTH + 3);
          this.scene.tweens.add({
            targets: cursor,
            alpha: { from: 1, to: 0.2 },
            duration: 500,
            yoyo: true,
            repeat: -1,
          });
          this.layer.push(cursor);
        }
      }
    }

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
    // Kill tweens před destroy — Phaser neukončí tween automaticky při destroy
    // targetu, infinite `repeat: -1` (blikající kurzor) by se akumuloval napříč
    // open/close cykly. `killTweensOf` je no-op pro objekty bez tweenu.
    for (const obj of this.layer) {
      this.scene.tweens.killTweensOf(obj);
      obj.destroy();
    }
    this.layer = [];
    this.onCloseCb = undefined;
    onClose?.();
  }
}
