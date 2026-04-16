// Welcome dialog pro Observer — první obrazovka prvního návštěvníka.
// Layer 5.1 modal (info + Close), náborový tón (Kandidát, ne neutrální Pozorovatel).
// Dialog nezastavuje čas — hra uvnitř běží i během čtení (axiom S19).
//
// Perzistence: checkbox "Již nezobrazovat" → localStorage (ne cookies — čistě
// client-side app, žádný server, robustnější API, žádný GDPR issue pro UI pref).
//
// BG axiom: panel má poloprůhledné pozadí, hvězdy z layer 0+1 prosvítají.
// Viz memory feedback_dialog_bg_transparent.md — ladíme alpha per-box typ.

import Phaser from "phaser";
import {
  UI_PANEL_BG,
  UI_BORDER_DIM,
  UI_OVERLAY_BLACK,
  UI_MASK_WHITE,
  COL_HULL_DARK,
  UI_TEXT_PRIMARY,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
  COL_TEXT_WHITE,
  COL_HULL_MID,
  FONT_FAMILY,
  FONT_SIZE_PANEL,
  FONT_SIZE_TIP,
} from "./palette";

const DISMISS_KEY = "voidspan.welcome.dismissed";

// Observer session ID — sdílený identifier mezi Welcome headerem a Top Bar
// identity tooltipem. Statický pro FVP (všichni hráči sdílí stejný OBS-··-042);
// P2+ bude per-session unikátní. S27 font fix: ∷ (U+2237) → ·· (Latin-1 dvě middle dots).
export const OBSERVER_ID = "OBS-··-042";

// Header — title + metadata zobrazené nahoře mimo scrollable area (vždy vidět).
const HEADER_TITLE = "TEEGARDEN.BELT1 — OBSERVER ACCESS";
const HEADER_META = `ID: ${OBSERVER_ID}  ·  ISSUED: 2387-04-16  ·  read-only`;

// Tělo dialogu — plain text, žádné box-drawing znaky (Jersey 25 není monospace,
// ASCII rámečky se rozpadají). Scrolluje se uvnitř rámečku panelu.
const WELCOME_BODY =
  "Pozorovateli,\n" +
  "\n" +
  "32 kolonistů už několik pozemských let spí.\n" +
  "Mateřská loď úspěšně dorazila na cílovou orbitu\n" +
  "v soustavě Teegarden's Star.\n" +
  "\n" +
  "Palubní systémy běží.\n" +
  "Konstrukční drony zahájily výstavbu podle programu.\n" +
  "QuarterMaster v2.3 orchestruje opravy a zásoby.\n" +
  "\n" +
  "Palubní systém brzy probudí první vlnu kolonistů.\n" +
  "\n" +
  "Tohle je vstupní kanál pozorovatele.\n" +
  "Vidíš shora, neřídíš.\n" +
  "Zdraví nikoho neprodlužuješ, ani nekrátíš.\n" +
  "\n" +
  "Sleduj pět os kolektivních zdrojů:\n" +
  "Energii, Práci, Pevné, Tekutiny, Kredit.\n" +
  "Šestnáct políček trupu. 32 spících aktérů.\n" +
  "\n" +
  "Kolonie běží v reálném čase. Nezastaví se,\n" +
  "až kanál zavřeš. Vrátíš se do následků.\n" +
  "\n" +
  "Až Palubní systém probouzení spustí, nabídne ti kapsli.\n" +
  "V tomto vydání ještě ne. Dnes hleď 10–20 minut,\n" +
  "rozmysli se a vrať se se zpětnou vazbou —\n" +
  "o čem to pro tebe bylo.\n" +
  "\n" +
  "Voidspan — FVP Observer Edition · v0.7";

export function shouldShowWelcome(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Storage nedostupné — dialog se příště zase ukáže.
  }
}

const DEPTH = 3000;
const PANEL_W = 600;
const PANEL_H = 420; // bez hero image — header + body + bottom row
const PADDING = 24;
// Overlay jen lehce zatmí svět kolem panelu — hvězdy pod panelem mají prosvítat,
// takže overlay musí být tenčí, než kolik ubere panelu průhlednost. 0.25 = lehký dim.
const OVERLAY_ALPHA = 0.25;
const PANEL_BG_ALPHA = 0.9; // 10% průhlednost
const SCROLL_STEP = 24;      // px per wheel tick
const SCROLLBAR_W = 12; // ×3 původní 4 px
const SCROLLBAR_GAP = 6;     // mezera od pravého okraje scroll area

export class WelcomeDialog {
  private layer: Phaser.GameObjects.GameObject[] = [];
  private open_ = false;
  private dismissChecked = false;
  private checkMark!: Phaser.GameObjects.Rectangle;

  private bodyText?: Phaser.GameObjects.Text;
  private bodyTopY = 0;       // startovní Y textu (když scrollOffset = 0)
  private scrollOffset = 0;   // kladné = text posunut nahoru
  private maxScroll = 0;
  private scrollAreaY = 0;
  private scrollAreaH = 0;
  private scrollbarThumb?: Phaser.GameObjects.Rectangle;

  private enterHandler?: () => void;
  private wheelHandler?: (p: Phaser.Input.Pointer, objs: unknown, dx: number, dy: number) => void;

  constructor(private scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.close());
  }

  isOpen(): boolean {
    return this.open_;
  }

  open(): void {
    if (this.open_) return;
    this.open_ = true;

    const cw = this.scene.scale.width;
    const ch = this.scene.scale.height;
    const panelX = Math.floor((cw - PANEL_W) / 2);
    const panelY = Math.floor((ch - PANEL_H) / 2);

    // --- Overlay (zatmění pozadí, blokuje kliky do hry pod ním) ---
    const overlay = this.scene.add
      .rectangle(0, 0, cw, ch, UI_OVERLAY_BLACK, OVERLAY_ALPHA)
      .setOrigin(0, 0)
      .setDepth(DEPTH)
      .setInteractive();
    this.layer.push(overlay);

    // --- Panel: transparentní bg + stroke obrys (ne samostatný solid rect pod bg,
    // ten by zakryl hvězdy). setStrokeStyle kreslí jen 1px okraj, uvnitř drží alpha. ---
    const bg = this.scene.add
      .rectangle(panelX, panelY, PANEL_W, PANEL_H, COL_HULL_DARK, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setStrokeStyle(1, UI_BORDER_DIM)
      .setDepth(DEPTH + 2)
      .setInteractive();
    bg.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
    });
    this.layer.push(bg);

    // --- Header: title + meta + underline (centrované) ---
    const titleY = panelY + PADDING;
    const centerX = panelX + PANEL_W / 2;
    const title = this.scene.add
      .text(centerX, titleY, HEADER_TITLE, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_PANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH + 3);
    const meta = this.scene.add
      .text(centerX, titleY + 34, HEADER_META, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
        color: UI_TEXT_PRIMARY,
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH + 3);
    const underlineY = titleY + 34 + 22;
    const underline = this.scene.add
      .rectangle(panelX + PADDING, underlineY, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 3);
    this.layer.push(title, meta, underline);

    // --- Body (scrollable) ---
    // Scroll area = obdélník mezi underline a bottom row. Text uvnitř jde posouvat
    // vertikálně přes GeometryMask (clip na viditelnou oblast).
    const bottomRowY = panelY + PANEL_H - PADDING - 40;
    const scrollAreaX = panelX + PADDING;
    const scrollAreaY = underlineY + 12;
    const scrollAreaW = PANEL_W - 2 * PADDING - SCROLLBAR_W - SCROLLBAR_GAP;
    const scrollAreaH = bottomRowY - scrollAreaY - 16;
    this.scrollAreaY = scrollAreaY;
    this.scrollAreaH = scrollAreaH;

    this.bodyTopY = scrollAreaY;
    this.bodyText = this.scene.add
      .text(scrollAreaX, scrollAreaY, WELCOME_BODY, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_PANEL,
        color: UI_TEXT_PRIMARY,
        wordWrap: { width: scrollAreaW },
        lineSpacing: 2,
      })
      .setDepth(DEPTH + 3);

    // Mask = neviditelný rect přes viditelnou scroll area. Text mimo se ořízne.
    const maskShape = this.scene.make.graphics({});
    maskShape.fillStyle(UI_MASK_WHITE);
    maskShape.fillRect(scrollAreaX, scrollAreaY, scrollAreaW, scrollAreaH);
    this.bodyText.setMask(maskShape.createGeometryMask());
    this.layer.push(this.bodyText);
    // maskShape není na display list (make.graphics), ale drží se v mask handle;
    // po close ho uklidíme přes destroy mask při destruction textu (mask.destroy
    // v closeMask callback by bylo čistší, ale Phaser destroy textu mask neuvolní
    // automaticky — ukládáme do layer přes přidání graphic object pro cleanup).
    this.layer.push(maskShape);

    // Max scroll — o kolik lze text posunout nahoru, aby poslední řádek byl vidět.
    this.maxScroll = Math.max(0, this.bodyText.height - scrollAreaH);

    // --- Scrollbar (vpravo od scroll area) ---
    // Track = tenká linie po celé výšce scroll area.
    // Thumb = krátký rect, výška úměrná viewport/content ratio, posouvá se se scrollem.
    const sbX = scrollAreaX + scrollAreaW + SCROLLBAR_GAP;
    const sbTrack = this.scene.add
      .rectangle(sbX, scrollAreaY, SCROLLBAR_W, scrollAreaH, COL_HULL_MID, 0.5)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 3);
    this.layer.push(sbTrack);

    if (this.maxScroll > 0) {
      const ratio = scrollAreaH / this.bodyText.height;
      const thumbH = Math.max(20, Math.floor(scrollAreaH * ratio));
      this.scrollbarThumb = this.scene.add
        .rectangle(sbX, scrollAreaY, SCROLLBAR_W, thumbH, COL_TEXT_WHITE, 0.7)
        .setOrigin(0, 0)
        .setDepth(DEPTH + 4)
        .setInteractive({ useHandCursor: true, draggable: true });

      // Drag thumb myší — travel = výška tracku minus thumbH. Poměr
      // (thumb.y - scrollAreaY) / travel odpovídá scrollOffset / maxScroll.
      const travel = scrollAreaH - thumbH;
      this.scene.input.setDraggable(this.scrollbarThumb);
      this.scrollbarThumb.on("drag", (_p: Phaser.Input.Pointer, _dragX: number, dragY: number) => {
        // Y draggu je absolute scene coord, clamp na track.
        const clampedY = Math.max(scrollAreaY, Math.min(scrollAreaY + travel, dragY));
        const ratioNow = (clampedY - scrollAreaY) / travel;
        this.setScroll(ratioNow * this.maxScroll);
      });
      // Klik na track (mimo thumb) = skok na kliknutou pozici.
      sbTrack.setInteractive({ useHandCursor: true });
      sbTrack.on("pointerdown", (p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        const localY = p.y - scrollAreaY;
        const ratioClick = Math.max(0, Math.min(1, (localY - thumbH / 2) / travel));
        this.setScroll(ratioClick * this.maxScroll);
      });

      this.layer.push(this.scrollbarThumb);
    }

    // Wheel listener — scroll jen když maxScroll > 0.
    this.wheelHandler = (_p, _objs, _dx, dy) => {
      if (this.maxScroll <= 0) return;
      this.setScroll(this.scrollOffset + (dy > 0 ? SCROLL_STEP : -SCROLL_STEP));
    };
    this.scene.input.on("wheel", this.wheelHandler);

    // --- Bottom row: [checkbox] + [Pokračovat] button ---
    const cbSize = 18;
    const cbX = panelX + PADDING;
    const cbY = bottomRowY + 11;
    const cbOuter = this.scene.add
      .rectangle(cbX, cbY, cbSize, cbSize, UI_BORDER_DIM, 0.9)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 3)
      .setInteractive({ useHandCursor: true });
    const cbInner = this.scene.add
      .rectangle(cbX + 2, cbY + 2, cbSize - 4, cbSize - 4, UI_PANEL_BG, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 4);
    this.checkMark = this.scene.add
      .rectangle(cbX + 5, cbY + 5, cbSize - 10, cbSize - 10, COL_TEXT_WHITE)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 5)
      .setVisible(false);
    const cbLabel = this.scene.add
      .text(cbX + cbSize + 10, cbY + cbSize / 2, "Již nezobrazovat", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
        color: UI_TEXT_PRIMARY,
      })
      .setOrigin(0, 0.5)
      .setDepth(DEPTH + 4)
      .setInteractive({ useHandCursor: true });

    const toggle = (ev: Phaser.Types.Input.EventData): void => {
      ev.stopPropagation();
      this.dismissChecked = !this.dismissChecked;
      this.checkMark.setVisible(this.dismissChecked);
    };
    cbOuter.on("pointerdown", (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => toggle(ev));
    cbLabel.on("pointerdown", (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => toggle(ev));
    this.layer.push(cbOuter, cbInner, this.checkMark, cbLabel);

    // Button "Pokračovat" — vpravo dole.
    // Tlačítko −25 % (160→120 × 40→30, font HUD 22→HINT 16).
    const btnW = 120;
    const btnH = 30;
    const btnX = panelX + PANEL_W - PADDING - btnW;
    const btnBg = this.scene.add
      .rectangle(btnX, bottomRowY, btnW, btnH, UI_BORDER_DIM, 0.92)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 3)
      .setInteractive({ useHandCursor: true });
    const btnLabel = this.scene.add
      .text(btnX + btnW / 2, bottomRowY + btnH / 2, "Pokračovat", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH + 4);
    btnBg.on("pointerover", () => btnBg.setFillStyle(UI_SELECT_STROKE, 0.92));
    btnBg.on("pointerout", () => btnBg.setFillStyle(UI_BORDER_DIM, 0.92));
    btnBg.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.close();
    });
    this.layer.push(btnBg, btnLabel);

    // Klávesa ENTER zavře (ESC řeší globální handler v GameScene — F5).
    this.enterHandler = () => this.close();
    this.scene.input.keyboard?.once("keydown-ENTER", this.enterHandler);
  }

  private setScroll(next: number): void {
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, next));
    if (this.bodyText) this.bodyText.y = this.bodyTopY - this.scrollOffset;
    if (this.scrollbarThumb && this.maxScroll > 0) {
      const ratio = this.scrollAreaH / (this.bodyText?.height ?? 1);
      const thumbH = Math.max(20, Math.floor(this.scrollAreaH * ratio));
      const travel = this.scrollAreaH - thumbH;
      this.scrollbarThumb.y = this.scrollAreaY + travel * (this.scrollOffset / this.maxScroll);
    }
  }

  close(): void {
    if (!this.open_) return;
    this.open_ = false;
    if (this.dismissChecked) markDismissed();

    if (this.wheelHandler) {
      this.scene.input.off("wheel", this.wheelHandler);
      this.wheelHandler = undefined;
    }
    if (this.enterHandler) {
      this.scene.input.keyboard?.off("keydown-ENTER", this.enterHandler);
      this.enterHandler = undefined;
    }

    for (const o of this.layer) o.destroy();
    this.layer = [];
    this.bodyText = undefined;
    this.scrollbarThumb = undefined;
  }
}
