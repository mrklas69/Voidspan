// ShipRender — procedural náhrada SegmentPanel (S35).
// Phaser.Graphics outline + Tabler SVG glyph + status modulace. Bez PNG.
// Vizuální reference: `apps/client/public/palette-preview.html` (§2, §3).
//
// Render vrstvy (depth):
//   4  bayGraphics   — kind hue outline + status fill + void „+" (base)
//   5  glyphImages   — Tabler SVG ikona per kind (setTint = kind hue)
//   10 flashOverlays — asteroid hit red flash (solid, 3 ticky)
//   20 selectionGfx  — amber outline nad selected bay
//
// Status → vzhled (izomorfismus z palette-preview §3):
//   online   → solid outline v kind hue
//   damaged  → dashed outline v rate-2 (orange) + HP fill zleva v rate-2 alpha
//   offline  → grey solid outline + checker pattern (glyph tint grey)
//   building → dotted outline v kind hue + progress fill zleva v kind hue
//
// Void bay → dashed grey + „+" glyph (procedural lineBetween, no texture).
// Icon fallback: pokud `icon:<Kind>` textura neexistuje, použít `icon:fallback` (cube).

import Phaser from "phaser";
import type { World, Module } from "../model";
import { MODULE_DEFS } from "../model";
import { findActiveTaskForModule, isConstructionTask } from "../world";
import { TooltipManager } from "../tooltip";
import {
  SEGMENT_X,
  SEGMENT_Y,
  BAY_PX,
  COL_BAY_SELECTED,
  setSegmentX,
} from "./layout";
import {
  UI_OVERLAY_BLACK,
  UI_TRAJ_FALLING,
  ratingColorNum,
  COL_HULL_MID,
  COL_HULL_LIGHT,
  COL_METAL_GRAY,
} from "../palette";
import { dockManager } from "./dock_manager";

// Layout konstanty — vše v bay px jednotkách.
// Axiom: barva modulu (outline, glyph, HP fill) = ratingColorNum(hpPct).
// Izomorfní s ModulesPanelem — řádek a bay sdílí stejnou metriku (HP%) i barvu.
// Status „offline" je jediná výjimka (grey) — znamená „nelze použít", ne health.
const INSET = 4;           // mezi bay edge a outline
const BORDER_W = 2;        // tloušťka outline
const CORNER_R = 6;        // zaoblené rohy
const VOID_PLUS_R = 7;     // poloviční délka „+" ramene ve void slotu
const DASH_ON = 6;         // délka segmentu dashed border
const DASH_OFF = 4;        // mezera dashed border
const CHECKER_STEP = 8;    // velikost checker čtverečku (offline pattern)
const FILL_ALPHA = 0.22;   // HP fill alpha (celobuňkový gradient)
const DAMAGED_THRESHOLD = 0.99; // pod 99 % HP kreslit dashed místo solid outline
const VOID_BORDER = COL_HULL_LIGHT;  // dashed border void slotu
const VOID_GLYPH  = COL_METAL_GRAY;  // „+" glyph void slotu

// Activity pulse (S35) — moduly s aktivním taskem (repair/build/demolish)
// pulsují outline alpha. HP fill zůstává statický = skutečné HP%.
// Yoyo sin wave perioda 2 s, alpha 0.5..1. Rozdíl repair vs. demolish se dnes
// v ship_renderu vizuálně neřeší (UX detail v TaskQueue/ModulesPanelu).
const PULSE_RAD_PER_MS = (2 * Math.PI) / 2000;
const PULSE_OUTLINE_MIN = 0.5;

const FALLBACK_ICON_KEY = "icon:fallback";

export class ShipRender {
  private bayRects: Phaser.GameObjects.Rectangle[] = [];     // hit-area (click)
  private bayGraphics: Phaser.GameObjects.Graphics[] = [];   // outline + fill + void „+"
  private glyphImages: Phaser.GameObjects.Image[] = [];      // Tabler SVG ikony
  private flashOverlays: Phaser.GameObjects.Rectangle[] = []; // asteroid flash
  private selectionGfx: Phaser.GameObjects.Graphics;
  private selectedBayIdx: number | null = 0;

  // Per-frame cache — computed on render() start, consumed by drawModule.
  // Drops O(tasks) scan per bay → O(tasks) once + O(1) lookup.
  private activeTaskModuleIds = new Set<string>();
  private pulseAlpha = 1;

  constructor(
    private scene: Phaser.Scene,
    private getWorld: () => World,
  ) {
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col;
        const x = SEGMENT_X + col * BAY_PX;
        const y = SEGMENT_Y + row * BAY_PX;

        // Hit-area (invisible, click → select).
        const rect = scene.add
          .rectangle(x, y, BAY_PX, BAY_PX, UI_OVERLAY_BLACK, 0)
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        rect.on("pointerdown", () => this.selectBay(idx));
        this.bayRects[idx] = rect;

        // Base graphics — kind outline + status fill + void „+".
        this.bayGraphics[idx] = scene.add.graphics().setDepth(4);

        // Glyph image — Tabler SVG, invisible start. Texture key se přepisuje
        // v render() podle module kind, tint = kindHue nebo grey (offline).
        // Default texture = fallback (aby se Image neboural při prvním renderu).
        this.glyphImages[idx] = scene.add
          .image(x + BAY_PX / 2, y + BAY_PX / 2, FALLBACK_ICON_KEY)
          .setDepth(5)
          .setVisible(false);

        // Flash overlay — asteroid hit red solid, 3 ticky.
        this.flashOverlays[idx] = scene.add
          .rectangle(x, y, BAY_PX, BAY_PX, UI_TRAJ_FALLING, 0)
          .setOrigin(0, 0)
          .setDepth(10);
      }
    }

    // Selection overlay — amber rámeček + lehký glow (budoucí Phaser.FX.Glow).
    this.selectionGfx = scene.add.graphics().setDepth(20).setVisible(false);

    // BELT axiom — panel ustupuje, ne BELT.
    dockManager.onChange(() => {
      setSegmentX(dockManager.getSegmentX());
      this.relayout();
    });
  }

  relayout(): void {
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col;
        const x = SEGMENT_X + col * BAY_PX;
        const y = SEGMENT_Y + row * BAY_PX;
        this.bayRects[idx]?.setPosition(x, y);
        this.flashOverlays[idx]?.setPosition(x, y);
        // Glyph repozice — render() si to přepočítá podle module.w/h, stačí base.
        this.glyphImages[idx]?.setPosition(x + BAY_PX / 2, y + BAY_PX / 2);
      }
    }
  }

  attachTooltips(tooltips: TooltipManager): void {
    for (let i = 0; i < this.bayRects.length; i++) {
      const rect = this.bayRects[i];
      if (!rect) continue;
      tooltips.attach(rect, () => this.bayTooltipText(i));
    }
  }

  getSelectedBayIdx(): number | null {
    return this.selectedBayIdx;
  }

  moveSelection(dx: number, dy: number): void {
    if (this.selectedBayIdx === null) {
      this.selectedBayIdx = 0;
      return;
    }
    const row = Math.floor(this.selectedBayIdx / 8);
    const col = this.selectedBayIdx % 8;
    const newRow = Math.max(0, Math.min(1, row + dy));
    const newCol = Math.max(0, Math.min(7, col + dx));
    this.selectedBayIdx = newRow * 8 + newCol;
  }

  private selectBay(idx: number): void {
    this.selectedBayIdx = idx;
  }

  render(): void {
    const w = this.getWorld();

    // Per-frame preflight — jedna iterace přes tasks, sdílená pulse phase.
    this.activeTaskModuleIds.clear();
    for (const t of w.tasks) {
      if (t.status !== "active") continue;
      if (!isConstructionTask(t)) continue;
      if (t.target.moduleId) this.activeTaskModuleIds.add(t.target.moduleId);
    }
    const phase = (Math.sin(this.scene.time.now * PULSE_RAD_PER_MS) + 1) / 2;
    this.pulseAlpha = PULSE_OUTLINE_MIN + (1 - PULSE_OUTLINE_MIN) * phase;

    for (let i = 0; i < 16; i++) {
      const bay = w.segment[i];
      const gfx = this.bayGraphics[i];
      const glyph = this.glyphImages[i];
      const flash = this.flashOverlays[i];
      if (!bay || !gfx || !glyph || !flash) continue;

      gfx.clear();

      const row = Math.floor(i / 8);
      const col = i % 8;
      const x = SEGMENT_X + col * BAY_PX;
      const y = SEGMENT_Y + row * BAY_PX;

      if (bay.kind === "void") {
        this.drawVoid(gfx, x, y, 1, 1);
        glyph.setVisible(false);
      } else if (bay.kind === "module_root") {
        const mod = w.modules[bay.moduleId];
        const def = mod ? MODULE_DEFS[mod.kind] : undefined;
        if (mod && def) {
          this.drawModule(gfx, x, y, def.w, def.h, mod);
          this.placeGlyph(glyph, x, y, def.w, def.h, mod);
        } else {
          glyph.setVisible(false);
        }
      } else {
        // module_ref — root už vykreslil celý span, glyph skryj.
        glyph.setVisible(false);
      }

      // Asteroid flash — solid red overlay přes ref i root bays modulu.
      flash.setFillStyle(UI_TRAJ_FALLING, 0);
      const flashModId =
        bay.kind === "module_root" ? bay.moduleId :
        bay.kind === "module_ref"  ? bay.moduleId : undefined;
      if (flashModId) {
        const m = w.modules[flashModId];
        if (m?.flashUntilTick !== undefined && w.tick < m.flashUntilTick) {
          flash.setFillStyle(UI_TRAJ_FALLING, 0.85);
        }
      }
    }

    this.drawSelection();
  }

  // Umístí + nastyluje Tabler SVG glyph nad modulem. Fallback cube pokud texture chybí.
  // Tint = rating barva dle HP% (semafor, izomorfní s ModulesPanelem) nebo grey pro offline.
  private placeGlyph(
    img: Phaser.GameObjects.Image,
    x: number, y: number,
    spanW: number, spanH: number,
    mod: Module,
  ): void {
    const key = `icon:${mod.kind}`;
    const useKey = this.scene.textures.exists(key) ? key : FALLBACK_ICON_KEY;
    const cx = x + (spanW * BAY_PX) / 2;
    const cy = y + (spanH * BAY_PX) / 2;
    const isOffline = mod.status === "offline";
    const pct = mod.hp_max > 0 ? (mod.hp / mod.hp_max) * 100 : 0;
    const tint = isOffline ? COL_METAL_GRAY : ratingColorNum(pct);
    img.setTexture(useKey).setPosition(cx, cy).setTint(tint).setVisible(true);
  }

  // Void slot — dashed grey border + „+" glyph v středu (procedural, bez textury).
  private drawVoid(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number,
    spanW: number, spanH: number,
  ): void {
    const w = spanW * BAY_PX - 2 * INSET;
    const h = spanH * BAY_PX - 2 * INSET;
    const rx = x + INSET;
    const ry = y + INSET;

    this.strokeDashedRect(gfx, rx, ry, w, h, VOID_BORDER, BORDER_W, 1, DASH_ON, DASH_OFF);

    // „+" glyph — 2 čáry křížem, centered.
    const cx = x + (spanW * BAY_PX) / 2;
    const cy = y + (spanH * BAY_PX) / 2;
    gfx.lineStyle(BORDER_W, VOID_GLYPH, 0.8);
    gfx.lineBetween(cx - VOID_PLUS_R, cy, cx + VOID_PLUS_R, cy);
    gfx.lineBetween(cx, cy - VOID_PLUS_R, cx, cy + VOID_PLUS_R);
  }

  // Module — rating outline + HP fill. Barva = semafor dle HP%.
  // Offline je jediný speciální stav: grey + checker (znamená „nelze použít",
  // ne health metrika). Building/damaged/online sdílí vzor — outline + fill
  // v rating barvě, dashed pokud HP < 99 %, solid pokud plný.
  // Aktivní repair/build/demolish task → pulse fill + outline (S35 animace).
  private drawModule(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number,
    spanW: number, spanH: number,
    mod: Module,
  ): void {
    const w = spanW * BAY_PX - 2 * INSET;
    const h = spanH * BAY_PX - 2 * INSET;
    const rx = x + INSET;
    const ry = y + INSET;
    const pct = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
    const pctScaled = pct * 100; // ratingColorNum bere 0-100

    // Base fill — transparentní hull na pozadí, aby outline neplaval na hvězdách.
    gfx.fillStyle(COL_HULL_MID, 0.35);
    gfx.fillRoundedRect(rx, ry, w, h, CORNER_R);

    if (mod.status === "offline") {
      // Offline: grey + checker. HP% nerelevantní.
      this.strokeCheckerFill(gfx, rx, ry, w, h, COL_HULL_MID, 0.35);
      gfx.lineStyle(BORDER_W, COL_METAL_GRAY, 1);
      gfx.strokeRoundedRect(rx, ry, w, h, CORNER_R);
      return;
    }

    // Online / building / damaged — semafor barva dle HP%.
    const color = ratingColorNum(pctScaled);

    // Activity pulse — aktivní task pulsuje outline alpha yoyo sin (0.5..1).
    // HP fill zůstává statický = skutečné HP% (žádné animace na progressbaru).
    // Pulse phase + activeTaskModuleIds Set předpočítáno v render() preflight.
    const outlineAlpha = this.activeTaskModuleIds.has(mod.id) ? this.pulseAlpha : 1;

    // HP fill zleva — alpha 0.22, šířka úměrná skutečnému HP%.
    const fillW = w * pct;
    if (fillW > 0) {
      gfx.fillStyle(color, FILL_ALPHA);
      gfx.fillRect(rx, ry, fillW, h);
    }

    // Outline — dashed pokud HP < 99 % (damage cue), solid pokud full.
    if (pct < DAMAGED_THRESHOLD) {
      this.strokeDashedRect(gfx, rx, ry, w, h, color, BORDER_W, outlineAlpha, DASH_ON, DASH_OFF);
    } else {
      gfx.lineStyle(BORDER_W, color, outlineAlpha);
      gfx.strokeRoundedRect(rx, ry, w, h, CORNER_R);
    }
  }

  // Selection outline — amber rámeček nad selected bay.
  private drawSelection(): void {
    const idx = this.selectedBayIdx;
    this.selectionGfx.clear();
    if (idx === null) {
      this.selectionGfx.setVisible(false);
      return;
    }
    this.selectionGfx.setVisible(true);
    const row = Math.floor(idx / 8);
    const col = idx % 8;
    const x = SEGMENT_X + col * BAY_PX + 1;
    const y = SEGMENT_Y + row * BAY_PX + 1;
    this.selectionGfx.lineStyle(2, COL_BAY_SELECTED, 1);
    this.selectionGfx.strokeRect(x, y, BAY_PX - 2, BAY_PX - 2);
  }

  // ==========================================================================
  // Stroke helpers — dashed / dotted / checker
  // ==========================================================================

  // Dashed rectangle outline — 4× dashed line per bay side.
  // Volá se v hot renderu (16 bays × 60 fps → 64 volání/s pokud většina
  // modulů damaged), tak closures pryč + axis-aligned len shortcut.
  private strokeDashedRect(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    color: number, width: number, alpha: number, on: number, off: number,
  ): void {
    gfx.lineStyle(width, color, alpha);
    this.drawDashedLine(gfx, x,     y,     x + w, y,     on, off);
    this.drawDashedLine(gfx, x + w, y,     x + w, y + h, on, off);
    this.drawDashedLine(gfx, x + w, y + h, x,     y + h, on, off);
    this.drawDashedLine(gfx, x,     y + h, x,     y,     on, off);
  }

  // Axis-aligned dashed line — `len` je pro vodorovnou/svislou úsečku prostý
  // `|dx| + |dy|` (jeden term vždy 0). Math.hypot vynechán jako zbytečný sqrt.
  private drawDashedLine(
    gfx: Phaser.GameObjects.Graphics,
    x1: number, y1: number, x2: number, y2: number,
    on: number, off: number,
  ): void {
    const len = Math.abs(x2 - x1) + Math.abs(y2 - y1);
    if (len <= 0) return;
    const dx = (x2 - x1) / len;
    const dy = (y2 - y1) / len;
    let pos = 0;
    while (pos < len) {
      const segEnd = Math.min(pos + on, len);
      gfx.lineBetween(x1 + dx * pos, y1 + dy * pos, x1 + dx * segEnd, y1 + dy * segEnd);
      pos = segEnd + off;
    }
  }

  // Checker pattern pro OFFLINE stav — malé čtverce ve 2 krocích.
  private strokeCheckerFill(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    color: number, alpha: number,
  ): void {
    gfx.fillStyle(color, alpha);
    for (let iy = 0; iy < h; iy += CHECKER_STEP) {
      for (let ix = 0; ix < w; ix += CHECKER_STEP) {
        const cellW = Math.min(CHECKER_STEP / 2, w - ix);
        const cellH = Math.min(CHECKER_STEP / 2, h - iy);
        if ((Math.floor(ix / (CHECKER_STEP / 2)) + Math.floor(iy / (CHECKER_STEP / 2))) % 2 === 0) {
          gfx.fillRect(x + ix, y + iy, cellW, cellH);
        }
      }
    }
  }

  // ==========================================================================
  // Tooltip
  // ==========================================================================

  private repairStateText(moduleId: string): string | null {
    const task = findActiveTaskForModule(this.getWorld().tasks, moduleId);
    if (!task || task.kind !== "repair") return null;
    const pct = task.wd_total > 0 ? Math.round((task.wd_done / task.wd_total) * 100) : 0;
    switch (task.status) {
      case "active":  return `Probíhá oprava (${pct}%)`;
      case "paused":  return `Oprava pozastavena (${pct}%)`;
      case "pending": return `Oprava ve frontě`;
      default: return null;
    }
  }

  private bayTooltipText(idx: number): string | null {
    const w = this.getWorld();
    const bay = w.segment[idx];
    if (!bay) return null;
    const row = Math.floor(idx / 8);
    const col = idx % 8;
    const pos = `Bay [${row},${col}] idx ${idx}`;

    if (bay.kind === "void") {
      return `${pos}\n\nVoid — prázdný slot, lze stavět (P2+).`;
    }
    const mod = w.modules[bay.moduleId];
    const modName = mod?.kind ?? "?";
    const hp = mod ? `${mod.hp.toFixed(0)} / ${mod.hp_max}` : "?";
    const missing = mod ? mod.hp_max - mod.hp : 0;
    const state = missing > 0 ? (this.repairStateText(bay.moduleId) ?? "Poškozeno") : "";
    return `${pos}\n\nModule: ${modName}\nStatus: ${mod?.status ?? "?"}\nHP: ${hp}${state ? `\n${state}` : ""}`;
  }
}
