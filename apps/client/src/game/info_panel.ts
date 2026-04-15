// InfoPanel — floating panel layer 3.5 (levý okraj).
// Hotkey [I] toggle. Status report základny — live data z World.
// Zrcadlový layout k EventLogPanel (pravý okraj).

import Phaser from "phaser";
import type { World } from "./model";
import { MODULE_DEFS, STATUS_LABELS, statusRating } from "./model";
import { VERB_CATALOG } from "./events";
import type { TooltipManager } from "./tooltip";
import {
  COL_HULL_DARK,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  FONT_FAMILY,
  FONT_SIZE_HINT,
  FONT_SIZE_LABEL,
  HEX_ALERT_RED,
  HEX_WARN_AMBER,
  HEX_OK_GREEN,
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

const LS_KEY = "voidspan.infopanel.open";

function loadVisiblePref(): boolean {
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
}

function saveVisiblePref(v: boolean): void {
  try { localStorage.setItem(LS_KEY, v ? "1" : "0"); } catch { /* incognito */ }
}

import type { StatusRating } from "./model";
import { HEX_COOLANT_CYAN, HEX_WARN_ORANGE } from "./palette";

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
  private bodyText!: Phaser.GameObjects.Text;
  private visible = false;

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
    bg.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
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

    // Rating — "Stav základny: " (neutral) + hodnocení (barvené).
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

    // Body — zbytek reportu pod ratingem.
    this.bodyText = this.scene.add
      .text(PADDING, HEADER_H + 28, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_HINT,
        color: UI_TEXT_PRIMARY,
        lineSpacing: 6,
        wordWrap: { width: PANEL_W - 2 * PADDING },
      })
      .setOrigin(0, 0);
    this.container.add(this.bodyText);
  }

  attachTooltips(tooltips: TooltipManager): void {
    const provider = () => {
      const s = this.getWorld().status;
      return [
        `I.   Aktuální stav (×8):  ${Math.round(s.tier1.pct)}%`,
        `II.  Udržitelnost (×4):   ${Math.round(s.tier2.pct)}%`,
        `III. Rozvoj (×2):         100% [P2+]`,
        `IV.  Spol. kapitál (×1):  100% [P2+]`,
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
    if (this.visible) {
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
    // Alive spotřeba: per-capita food/air drain. Při 0 alive = ∞.
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

    const lines = [
      `Posádka:  ${cryo} cryo / ${alive} alive / ${dead} dead`,
      `Energie:  ${w.resources.energy.toFixed(1)} / ${ENERGY_MAX} Wh`,
      `          +${production.toFixed(0)} prod / ${consumption.toFixed(0)} spotř = ${netSign}${net.toFixed(0)}`,
      `Zásoby:   ${w.resources.slab.food.toFixed(0)} food / ${w.resources.flux.air.toFixed(0)} air`,
      `          runway: ${runway}`,
      `Základna: ${online} online / ${offline} offline / ${destroyed} destroyed`,
      `          HP avg ${hpAvg}% / nejhorší: ${worstName} ${Math.round(worstPct)}%`,
      `Úkoly:    ${active} active / ${queued} queued`,
      ``,
      `Události:`,
      ...evLines,
    ];

    this.bodyText.setText(lines.join("\n"));
  }
}
