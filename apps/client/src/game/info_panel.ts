// InfoPanel — floating panel layer 3.5 (levý okraj).
// Hotkey [I] toggle. Status report základny — live data z World.
// Zrcadlový layout k EventLogPanel (pravý okraj).
// Scroll: automatický scrollbar pokud obsah přesahuje panel (vzor Welcome dialog S22).
// Unicode ikony, 18px body text (S22 rozhodnutí).

import Phaser from "phaser";
import type { World } from "./model";
import { MODULE_DEFS, STATUS_LABELS, statusRating } from "./model";
import { VERB_CATALOG } from "./events";
import type { TooltipManager } from "./tooltip";
import type { StatusRating } from "./model";
import {
  COL_HULL_DARK,
  COL_HULL_MID,
  COL_TEXT_WHITE,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  FONT_FAMILY,
  FONT_SIZE_LABEL,
  HEX_ALERT_RED,
  HEX_WARN_AMBER,
  HEX_OK_GREEN,
  HEX_COOLANT_CYAN,
  HEX_WARN_ORANGE,
} from "./palette";
import { CANVAS_H, HUD_H, LOG_H } from "./ui/layout";
import { ENERGY_MAX } from "./tuning";

const DEPTH = 1500;
const PANEL_W = 420;
const MARGIN = 12;
const PADDING = 12;
const PANEL_BG_ALPHA = 0.9;
const HEADER_H = 40;

const PANEL_H = CANVAS_H - HUD_H - LOG_H - 2 * MARGIN;

// Scroll area — starts below rating row, ends at panel bottom.
const SCROLL_TOP = HEADER_H + 28;
const SCROLL_H = PANEL_H - SCROLL_TOP - 4;
const SCROLLBAR_W = 8;
const SCROLLBAR_GAP = 4;
const SCROLL_STEP = 24;

const LS_KEY = "voidspan.infopanel.open";

function loadVisiblePref(): boolean {
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
}

function saveVisiblePref(v: boolean): void {
  try { localStorage.setItem(LS_KEY, v ? "1" : "0"); } catch { /* incognito */ }
}

const RATING_COLOR: Record<StatusRating, string> = {
  5: HEX_OK_GREEN,       // Excellent — zelená
  4: HEX_COOLANT_CYAN,   // Good — cyan
  3: HEX_WARN_AMBER,     // Fair — amber
  2: HEX_WARN_ORANGE,    // Poor — oranžová
  1: HEX_ALERT_RED,      // Failure — červená
};

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
        fontSize: FONT_SIZE_LABEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0);
    this.container.add(titleText);

    // Close button ✕.
    const closeBtn = this.scene.add
      .text(PANEL_W - PADDING, PADDING, "✕", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_LABEL,
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
        fontSize: FONT_SIZE_LABEL,
        color: UI_TEXT_PRIMARY,
      })
      .setOrigin(0, 0)
      .setInteractive();
    this.container.add(this.ratingLabel);

    this.ratingValue = this.scene.add
      .text(0, HEADER_H + 4, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_LABEL,
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
        fontSize: "18px",
        color: UI_TEXT_PRIMARY,
        lineSpacing: 6,
      })
      .setOrigin(0, 0);
    this.scrollContent.add(this.iconText);

    this.bodyText = this.scene.add
      .text(COL_OFFSET, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        color: UI_TEXT_PRIMARY,
        lineSpacing: 6,
        wordWrap: { width: contentW - COL_OFFSET },
      })
      .setOrigin(0, 0);
    this.scrollContent.add(this.bodyText);

    // Geometry mask — clips scrollContent to visible scroll area (world coords).
    const maskGraphics = this.scene.make.graphics({});
    maskGraphics.fillStyle(0xffffff);
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

  toggle(): void {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    saveVisiblePref(this.visible);
    this.dragY = null;
    if (this.visible) {
      this.scrollOffset = 0;
      this.renderBody();
    }
  }

  isOpen(): boolean {
    return this.visible;
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

    // Energie — bilance.
    const mods = Object.values(w.modules);
    let production = 0;
    let consumption = 0;
    for (const mod of mods) {
      if (mod.status !== "online") continue;
      const hpRatio = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
      const pw = MODULE_DEFS[mod.kind].power_w * hpRatio;
      if (pw > 0) production += pw;
      else consumption += pw;
    }
    const net = production + consumption;
    const netSign = net >= 0 ? "+" : "";

    // Zásoby — runway.
    let runway = "∞";
    if (alive > 0) {
      const foodDays = w.resources.slab.food > 0 ? Math.floor(w.resources.slab.food / alive) : 0;
      runway = `~${foodDays} dní food`;
    }

    // Základna.
    let online = 0;
    let offline = 0;
    let destroyed = 0;
    let hpSum = 0;
    let hpCount = 0;
    let worstName = "";
    let worstPct = 100;
    for (const mod of mods) {
      if (mod.hp <= 0) { destroyed++; continue; }
      if (mod.status === "online") online++;
      else offline++;
      const pct = mod.hp_max > 0 ? (mod.hp / mod.hp_max) * 100 : 0;
      hpSum += pct;
      hpCount++;
      if (pct < worstPct) {
        worstPct = pct;
        worstName = mod.kind;
      }
    }
    const hpAvg = hpCount > 0 ? Math.round(hpSum / hpCount) : 0;

    // Úkoly.
    const active = w.tasks.filter((t) => t.assigned.length > 0).length;
    const queued = w.tasks.length - active;

    // Události — posledních 5.
    const recentEvents = w.events.slice(-5);
    const evLines = recentEvents.map((ev) => {
      const entry = VERB_CATALOG[ev.verb];
      const csq = ev.csq ? `:${ev.csq}` : "";
      return `  ${entry.icon} ${ev.verb}${csq} ${ev.actor ?? ev.loc ?? ""} ${ev.item ?? ""}`.trimEnd();
    });

    // Rating — label neutral, hodnota barvená.
    const rating = statusRating(w.status.overall.pct);
    const label = STATUS_LABELS[rating];
    this.ratingValue.setText(`${label.cs} (${label.en}) — ${Math.round(w.status.overall.pct)}%`);
    this.ratingValue.setColor(RATING_COLOR[rating]);
    this.ratingValue.setX(PADDING + this.ratingLabel.width);

    // Dvousloupcový layout: ikony (levý sloupec) + labely (pravý sloupec).
    // Řazení dle pyramidy vitality: I → II → zbytek. Unicode ikony (S22).
    const icons: string[] = [];
    const lines: string[] = [];

    // I. Aktuální stav
    icons.push("☻"); lines.push(`Posádka:  ${cryo} cryo / ${alive} alive / ${dead} dead`);
    icons.push("⌂"); lines.push(`Základna: ${online} online / ${offline} offline / ${destroyed} destroyed`);
    icons.push(" "); lines.push(`          HP avg ${hpAvg}% / nejhorší: ${worstName} ${Math.round(worstPct)}%`);
    // II. Udržitelnost
    icons.push("≡"); lines.push(`Zásoby:   ${w.resources.slab.food.toFixed(0)} food / ${w.resources.flux.air.toFixed(0)} air`);
    icons.push(" "); lines.push(`          runway: ${runway}`);
    icons.push("↯"); lines.push(`Energie:  ${w.resources.energy.toFixed(1)} / ${ENERGY_MAX} Wh`);
    icons.push(" "); lines.push(`          +${production.toFixed(0)} prod / ${consumption.toFixed(0)} spotř = ${netSign}${net.toFixed(0)}`);
    icons.push(" "); lines.push(``);
    // Ostatní
    icons.push("▲"); lines.push(`Úkoly:    ${active} active / ${queued} queued`);
    icons.push(" "); lines.push(``);
    icons.push("◆"); lines.push(`Události:`);
    for (const evLine of evLines) {
      icons.push(" "); lines.push(evLine);
    }

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
