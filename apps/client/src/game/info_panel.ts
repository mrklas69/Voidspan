// InfoPanel — floating panel layer 3.5 (levý okraj).
// Hotkey [I] toggle. Status report základny — live data z World.
// Zrcadlový layout k EventLogPanel (pravý okraj).
// Scroll: automatický scrollbar pokud obsah přesahuje panel (vzor Welcome dialog S22).
// Unicode ikony, 18px body text (S22 rozhodnutí).

import Phaser from "phaser";
import type { World } from "./model";
import { STATUS_LABELS, statusRating } from "./model";
import type { TooltipManager } from "./tooltip";

import {
  COL_HULL_DARK,
  COL_HULL_MID,
  COL_TEXT_WHITE,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  UI_MASK_WHITE,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
  RATING_COLOR,
} from "./palette";
import { HUD_H } from "./ui/layout";
import {
  PANEL_DEPTH as DEPTH,
  PANEL_MARGIN as MARGIN,
  PANEL_PADDING as PADDING,
  PANEL_BG_ALPHA,
  PANEL_HEADER_H as HEADER_H,
  SCROLLBAR_W,
  SCROLLBAR_GAP,
  SCROLL_STEP,
  loadPanelOpenPref,
  savePanelOpenPref,
} from "./ui/panel_helpers";
import { dockManager } from "./ui/dock_manager";

const PANEL_W = 420;

// S24 KISS: pevná velikost panelu (baseline 720 - 60 - 60 - 24 = 576).
const PANEL_H = 576;

// Scroll area — starts below rating row, ends at panel bottom.
const SCROLL_TOP = HEADER_H + 28;
const SCROLL_H = PANEL_H - SCROLL_TOP - 4;

const LS_KEY = "voidspan.infopanel.open";

const loadVisiblePref = () => loadPanelOpenPref(LS_KEY);
const saveVisiblePref = (v: boolean) => savePanelOpenPref(LS_KEY, v);

export class InfoPanel {
  private scene: Phaser.Scene;
  private getWorld: () => World;

  private container!: Phaser.GameObjects.Container;
  private ratingLabel!: Phaser.GameObjects.Text;
  private ratingValue!: Phaser.GameObjects.Text;
  private iconText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private visible = false;

  // Scroll state.
  private scrollContent!: Phaser.GameObjects.Container;
  private scrollOffset = 0;
  private maxScroll = 0;
  private scrollTrack!: Phaser.GameObjects.Rectangle;
  private scrollThumb!: Phaser.GameObjects.Rectangle;

  // Touch drag scroll.
  private dragY: number | null = null;
  private dragOffset = 0;

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    this.scene = scene;
    this.getWorld = getWorld;
    this.build();
    this.visible = loadVisiblePref();
    this.container.setVisible(this.visible);
    if (this.visible) this.renderBody();
    dockManager.register("info", "left", PANEL_W, () => this.visible);
  }

  private build(): void {
    const x = MARGIN;
    const y = HUD_H + MARGIN;

    this.container = this.scene.add.container(x, y).setDepth(DEPTH);

    // BG.
    const bg = this.scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, COL_HULL_DARK, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setStrokeStyle(1, UI_BORDER_DIM)
      .setInteractive();
    bg.on("pointerdown", (p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.dragY = p.y;
      this.dragOffset = this.scrollOffset;
    });
    this.container.add(bg);

    // Header — title.
    const titleText = this.scene.add
      .text(PADDING, PADDING, "Info", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0);
    this.container.add(titleText);

    // Close button X.
    const closeBtn = this.scene.add
      .text(PANEL_W - PADDING, PADDING, "X", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.toggle();
    });
    this.container.add(closeBtn);

    // Underline.
    const underline = this.scene.add
      .rectangle(PADDING, HEADER_H - 2, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0);
    this.container.add(underline);

    // Rating — fixed above scroll area.
    this.ratingLabel = this.scene.add
      .text(PADDING, HEADER_H + 4, "Stav základny: ", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_PRIMARY,
      })
      .setOrigin(0, 0)
      .setInteractive();
    this.container.add(this.ratingLabel);

    this.ratingValue = this.scene.add
      .text(0, HEADER_H + 4, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
      })
      .setOrigin(0, 0)
      .setInteractive();
    this.container.add(this.ratingValue);

    // --- Scrollable content area ---
    const contentW = PANEL_W - 2 * PADDING - SCROLLBAR_W - SCROLLBAR_GAP;
    this.scrollContent = this.scene.add.container(PADDING, SCROLL_TOP);
    this.container.add(this.scrollContent);

    // Dvousloupcový layout: ikony (X=0) + labely+hodnoty (X=16).
    // Oba texty mají shodný font/size/lineSpacing → řádky se zarovnají vertikálně.
    const COL_OFFSET = 16;
    this.iconText = this.scene.add
      .text(0, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_PRIMARY,
        lineSpacing: 6,
      })
      .setOrigin(0, 0);
    this.scrollContent.add(this.iconText);

    this.bodyText = this.scene.add
      .text(COL_OFFSET, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_PRIMARY,
        lineSpacing: 6,
        wordWrap: { width: contentW - COL_OFFSET },
      })
      .setOrigin(0, 0);
    this.scrollContent.add(this.bodyText);

    // Geometry mask — clips scrollContent to visible scroll area (world coords).
    const maskGraphics = this.scene.make.graphics({});
    maskGraphics.fillStyle(UI_MASK_WHITE);
    maskGraphics.fillRect(x + PADDING, y + SCROLL_TOP, contentW, SCROLL_H);
    this.scrollContent.setMask(maskGraphics.createGeometryMask());

    // Scrollbar track + thumb (in main container, not scrollContent).
    const sbX = PANEL_W - SCROLLBAR_W - 4;
    this.scrollTrack = this.scene.add
      .rectangle(sbX, SCROLL_TOP, SCROLLBAR_W, SCROLL_H, COL_HULL_MID, 0.3)
      .setOrigin(0, 0)
      .setVisible(false);
    this.container.add(this.scrollTrack);

    this.scrollThumb = this.scene.add
      .rectangle(sbX, SCROLL_TOP, SCROLLBAR_W, 30, COL_TEXT_WHITE, 0.5)
      .setOrigin(0, 0)
      .setVisible(false)
      .setInteractive({ useHandCursor: true, draggable: true });
    this.scene.input.setDraggable(this.scrollThumb);
    this.scrollThumb.on("drag", (_p: Phaser.Input.Pointer, _dragX: number, dragY: number) => {
      if (this.maxScroll <= 0) return;
      const thumbH = this.scrollThumb.height;
      const travel = SCROLL_H - thumbH;
      const clampedY = Math.max(SCROLL_TOP, Math.min(SCROLL_TOP + travel, dragY));
      const ratio = travel > 0 ? (clampedY - SCROLL_TOP) / travel : 0;
      this.setScroll(ratio * this.maxScroll);
    });
    this.container.add(this.scrollThumb);

    // Klik na track = skok na pozici.
    this.scrollTrack.setInteractive({ useHandCursor: true });
    this.scrollTrack.on("pointerdown", (_p: Phaser.Input.Pointer, _lx: number, ly: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      if (this.maxScroll <= 0) return;
      const thumbH = this.scrollThumb.height;
      const travel = SCROLL_H - thumbH;
      const ratio = Math.max(0, Math.min(1, (ly - thumbH / 2) / travel));
      this.setScroll(ratio * this.maxScroll);
    });

    // Wheel scroll — scene-level (vzor Welcome dialog), bounds check na panel.
    this.scene.input.on("wheel", (pointer: Phaser.Input.Pointer, _objs: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (!this.visible || this.maxScroll <= 0) return;
      if (pointer.x >= x && pointer.x <= x + PANEL_W && pointer.y >= y && pointer.y <= y + PANEL_H) {
        this.setScroll(this.scrollOffset + (dy > 0 ? SCROLL_STEP : -SCROLL_STEP));
      }
    });

    // Touch drag scroll — scene-level move/up.
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.dragY === null || !this.visible) return;
      const dy = this.dragY - pointer.y;
      this.setScroll(this.dragOffset + dy);
    });

    this.scene.input.on("pointerup", () => {
      this.dragY = null;
    });
  }

  private setScroll(next: number): void {
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, next));
    this.scrollContent.y = SCROLL_TOP - this.scrollOffset;
    this.updateScrollbar();
  }

  // S24 KISS: InfoPanel je v levém horním rohu — x = MARGIN, y = HUD_H + MARGIN
  // jsou fix hodnoty, nemění se při resize. Žádný relayout není potřeba.

  private updateScrollbar(): void {
    if (this.maxScroll <= 0) {
      this.scrollTrack.setVisible(false);
      this.scrollThumb.setVisible(false);
      return;
    }
    this.scrollTrack.setVisible(true);
    this.scrollThumb.setVisible(true);
    const ratio = SCROLL_H / (SCROLL_H + this.maxScroll);
    const thumbH = Math.max(20, Math.floor(SCROLL_H * ratio));
    const travel = SCROLL_H - thumbH;
    const pos = this.maxScroll > 0 ? (this.scrollOffset / this.maxScroll) * travel : 0;
    this.scrollThumb.setSize(SCROLLBAR_W, thumbH);
    this.scrollThumb.setY(SCROLL_TOP + pos);
  }

  attachTooltips(tooltips: TooltipManager): void {
    const provider = () => {
      const s = this.getWorld().status;
      return [
        `I.   Aktuální stav (×8):  ${Math.round(s.tier1.pct)}%`,
        `II.  Udržitelnost (×4):   ${Math.round(s.tier2.pct)}%`,
        `III. Rozvoj (×2):         100% [P2+]`,
        `IV.  Společnost (×1):     100% [P2+]`,
        ``,
        `(${Math.round(s.tier1.pct)}×8 + ${Math.round(s.tier2.pct)}×4 + 100×2 + 100×1) / 15 = ${Math.round(s.overall.pct)}%`,
      ].join("\n");
    };
    tooltips.attach(this.ratingLabel, provider);
    tooltips.attach(this.ratingValue, provider);
  }

  private onToggleOpenCb?: () => void;

  setOnToggleOpen(cb: () => void): void {
    this.onToggleOpenCb = cb;
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    saveVisiblePref(this.visible);
    this.dragY = null;
    if (this.visible) {
      this.scrollOffset = 0;
      this.renderBody();
      this.onToggleOpenCb?.();
    }
    dockManager.notifyChange();
  }

  isOpen(): boolean {
    return this.visible;
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.container.setVisible(false);
    saveVisiblePref(false);
    this.dragY = null;
    dockManager.notifyChange();
  }

  // Axiom: otevřené infoPanely musejí být refreshované každý frame.
  render(): void {
    if (!this.visible) return;
    this.renderBody();
  }

  private renderBody(): void {
    const w = this.getWorld();

    // Posádka.
    const cryo = w.actors.filter((a) => a.state === "cryo").length;
    const alive = w.actors.filter((a) => a.state === "idle" || a.state === "working").length;
    const dead = w.actors.filter((a) => a.state === "dead").length;

    // Základna — online/offline/destroyed.
    // S26: Zásoby + Energie + HP avg řádky odstraněny — detail v Top Bar infotipech.
    const mods = Object.values(w.modules);
    let online = 0;
    let offline = 0;
    let destroyed = 0;
    for (const mod of mods) {
      if (mod.hp <= 0) { destroyed++; continue; }
      if (mod.status === "online") online++;
      else offline++;
    }

    // Rating — label neutral, hodnota barvená.
    const rating = statusRating(w.status.overall.pct);
    const label = STATUS_LABELS[rating];
    this.ratingValue.setText(`${label.cs} (${label.en}) — ${Math.round(w.status.overall.pct)}%`);
    this.ratingValue.setColor(RATING_COLOR[rating]);
    this.ratingValue.setX(PADDING + this.ratingLabel.width);

    // Dvousloupcový layout: ikony (levý sloupec) + labely (pravý sloupec).
    const icons: string[] = [];
    const lines: string[] = [];

    // I. Aktuální stav (Zásoby + Energie — viz Top Bar infotipy)
    // S27 font fix: ☻⌂ ikony dropnuté (VT323 latin-subset je nemá → fallback rozbíjel
    // baseline). Labely "Posádka:" / "Základna:" nesou význam samy o sobě.
    icons.push(""); lines.push(`Posádka:  ${cryo} cryo / ${alive} alive / ${dead} dead`);
    icons.push(""); lines.push(`Základna: ${online} online / ${offline} offline / ${destroyed} destroyed`);

    this.iconText.setText(icons.join("\n"));
    this.bodyText.setText(lines.join("\n"));

    // Scroll — compute total content height, update maxScroll.
    const totalH = this.bodyText.height;
    this.maxScroll = Math.max(0, totalH - SCROLL_H);
    this.scrollOffset = Math.min(this.scrollOffset, this.maxScroll);
    this.scrollContent.y = SCROLL_TOP - this.scrollOffset;
    this.updateScrollbar();
  }
}
