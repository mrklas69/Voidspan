// MilestoneBar — horizontální strip milestonů nad Bottom Barem.
// Jediný konzument `World.milestones` v UI vrstvě (sdíleno s QM Terminal).
//
// Layout: 7 chips centered cluster, každý = ikona + label_cs.
// Status → barva + ikona + chování:
//   done     ✓ green, solid alpha
//   current  ⧖ warn orange (rate-2 semafor), pulse yoyo alpha 0.5..1 perioda 2 s
//   planned  ○ dim amber, solid alpha
//
// Tooltip (hover) = label + datum + plný desc z Milestone.desc_cs.

import Phaser from "phaser";
import type { World, MilestoneStatus } from "@voidspan/shared";
import type { TooltipManager } from "../tooltip";
import {
  FONT_FAMILY,
  FONT_SIZE_TIP,
  HEX_OK_GREEN,
  HEX_WARN_ORANGE,
  HEX_AMBER_DIM,
  COL_HULL_MID,
} from "../palette";
import * as L from "./layout";
import { UI_PULSE_RAD_PER_MS, UI_PULSE_ALPHA_MIN } from "./layout";

// Layout konstanty — komponenta-specific (stejná konvence jako ROW_H v task_queue
// a MOD_ROW_H v modules_panel). Žádný jiný konzument → nepatří do tuning.ts.
const BAR_H = 40;                 // výška strip proužku
const CHIP_H = 28;                // výška klikatelného chip backgroundu
const CHIP_PAD_X = 10;            // vnitřní padding chipu
const CHIP_GAP = 20;              // mezera mezi chipy (prostor pro separator »)

// Depth layering — z-order uvnitř UI strip.
const DEPTH_STRIP_BG = 49;        // souvislé pozadí pod vším
const DEPTH_CHIP_HIT = 50;        // invisible hit area (alpha 0, drží tooltip target)
const DEPTH_CHIP_TEXT = 51;       // viditelný text chipu i separátorů

// Separator mezi chipy — double right guillemet (transit narrative).
// Latin-1 subset (U+00BB) — spolehlivý render v Atkinson Hyperlegible.
const SEPARATOR_CHAR = "»";

// Ikony pro status (Unicode — Atkinson Hyperlegible drží základní geometric shapes).
const ICON_CHAR: Record<MilestoneStatus, string> = {
  done:    "✓",
  current: "⧖",
  planned: "○",
};

// Barva textu per status (hex string pro Phaser Text color).
const STATUS_COLOR: Record<MilestoneStatus, string> = {
  done:    HEX_OK_GREEN,       // zelená — dokončeno
  current: HEX_WARN_ORANGE,    // semaforová oranžová (rate-2) — probíhá (+ pulse)
  planned: HEX_AMBER_DIM,      // dim amber — plánováno
};

interface Chip {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  milestoneId: string; // stabilní identifikátor — status čteme z World každý render
  lastStatus: MilestoneStatus | null; // cache pro re-apply styling jen při změně
}

export class MilestoneBar {
  private readonly chips: Chip[] = [];
  // Souvislý strip-background pod všemi chipy — jeden obdélník od prvního do
  // posledního chipu (včetně mezer). Per-chip bg drží jen klikatelnou hit area
  // s alpha 0 (invisible), vizuál dělá tenhle strip.
  private stripBg!: Phaser.GameObjects.Rectangle;
  // Oddělovače mezi chipy (N-1 kusů). Barva HEX_AMBER_DIM, centered v CHIP_GAP.
  private readonly separators: Phaser.GameObjects.Text[] = [];
  // Posledně aplikovaná alpha na current chip — guard proti no-op setAlpha 60×/s.
  private lastPulseAlpha = -1;

  constructor(
    private scene: Phaser.Scene,
    private getWorld: () => World,
  ) {
    this.buildChips();
    this.layout();
  }

  // Vytvoří chip per milestone — invisible hit area bg (klik + hover cíl) + text.
  // Chipy + separátory vytvořeny v jednom průchodu (SLAP — neodděluj loopy, je to
  // jedna činnost „vytvoř timeline strip"). Pool je fix (milestones jsou static).
  private buildChips(): void {
    this.stripBg = this.scene.add
      .rectangle(0, 0, 10, CHIP_H, COL_HULL_MID, 0.35)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH_STRIP_BG);

    const milestones = this.getWorld().milestones;
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i]!;

      // Per-chip bg — invisible hit area (alpha 0), drží interactive bounds.
      const bg = this.scene.add
        .rectangle(0, 0, 10, CHIP_H, COL_HULL_MID, 0)
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(DEPTH_CHIP_HIT);

      const label = `${ICON_CHAR[m.status]} ${m.label_cs}`;
      const text = this.scene.add
        .text(0, 0, label, {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_TIP,
          color: STATUS_COLOR[m.status],
        })
        .setOrigin(0, 0.5)
        .setDepth(DEPTH_CHIP_TEXT);

      this.chips.push({ bg, text, milestoneId: m.id, lastStatus: m.status });

      // Separator za tímto chipem (kromě posledního).
      if (i < milestones.length - 1) {
        const sep = this.scene.add
          .text(0, 0, SEPARATOR_CHAR, {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_TIP,
            color: HEX_AMBER_DIM,
          })
          .setOrigin(0.5, 0.5)
          .setDepth(DEPTH_CHIP_TEXT);
        this.separators.push(sep);
      }
    }
  }

  // Rozmísti chipy — cluster jako celek centrovaný v canvasu. Žádný shift
  // podle current (ten drží pulse + barevné označení jako highlight).
  // Volá se při init / resize / render po status change (label délka se
  // změnila → recompute positions).
  private layout(): void {
    const chipWidths = this.chips.map((c) => c.text.width + CHIP_PAD_X * 2);
    const totalW =
      chipWidths.reduce((sum, w) => sum + w, 0) +
      CHIP_GAP * (this.chips.length - 1);

    const startX = Math.round((L.CANVAS_W - totalW) / 2);
    const y = L.CANVAS_H - L.LOG_H - BAR_H / 2;

    this.stripBg.setPosition(startX, y).setSize(totalW, CHIP_H);

    let x = startX;
    for (let i = 0; i < this.chips.length; i++) {
      const chip = this.chips[i]!;
      const w = chipWidths[i]!;
      chip.bg.setPosition(x, y).setSize(w, CHIP_H);
      chip.text.setPosition(x + CHIP_PAD_X, y);
      const sep = this.separators[i];
      if (sep) sep.setPosition(x + w + CHIP_GAP / 2, y);
      x += w + CHIP_GAP;
    }
  }

  // Resize hook — pozice clusteru se re-centruje dle nové CANVAS_W.
  relayout(): void {
    this.layout();
  }

  // Tooltip: 2 řádky — 1. „label datum" (datum jen pokud je), 2. popis.
  attachTooltips(tooltips: TooltipManager): void {
    const milestones = this.getWorld().milestones;
    for (let i = 0; i < this.chips.length; i++) {
      const chip = this.chips[i]!;
      const m = milestones[i]!;
      tooltips.attach(chip.bg, () => {
        const datePart = m.date_cs ? ` ${m.date_cs}` : "";
        return `${m.label_cs}${datePart}\n${m.desc_cs}`;
      });
    }
  }

  // Per-frame render — re-apply status styling při změně (done advance) + pulse
  // alpha pro current. Status čteme z World aby se styling přepnul při advance
  // (static cache = drift risk: „milník nezezelenal" bug). Relayout při změně
  // (nová label délka → recompute positions).
  render(): void {
    const milestones = this.getWorld().milestones;
    let statusChanged = false;

    // 1) Re-apply styling pokud status chipu se změnil oproti cache.
    for (let i = 0; i < this.chips.length; i++) {
      const chip = this.chips[i]!;
      const m = milestones[i];
      if (!m) continue;
      if (chip.lastStatus === m.status) continue;
      chip.lastStatus = m.status;
      chip.text.setText(`${ICON_CHAR[m.status]} ${m.label_cs}`);
      chip.text.setColor(STATUS_COLOR[m.status]);
      chip.text.setAlpha(1); // reset alpha při přepnutí, pulse se nastaví níže
      statusChanged = true;
    }
    // Po status změně re-centruj cluster (label šířky se změnily).
    if (statusChanged) {
      this.layout();
      this.lastPulseAlpha = -1; // force pulse re-apply next frame
    }

    // 2) Pulse alpha pro current chip — pulse perioda sdílena s ship render activity.
    const phase = (Math.sin(this.scene.time.now * UI_PULSE_RAD_PER_MS) + 1) / 2;
    const pulseAlpha = UI_PULSE_ALPHA_MIN + (1 - UI_PULSE_ALPHA_MIN) * phase;
    if (pulseAlpha === this.lastPulseAlpha) return;
    this.lastPulseAlpha = pulseAlpha;

    for (let i = 0; i < this.chips.length; i++) {
      if (milestones[i]?.status === "current") {
        this.chips[i]!.text.setAlpha(pulseAlpha);
      }
    }
  }
}
