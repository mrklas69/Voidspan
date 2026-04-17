// SegmentPanel — střední plocha, 8×2 bay grid.
// Render dispatch podle bay.kind: void = nic, module_root = modul sprite
// (multi-bay span), module_ref = skryto (root pokryl span).
// Po S28 layered bay retire (skeleton/covered → P2+).
//
// Damage overlay (S18 orange trajectory axiom):
//   - alpha = (1 - hp/hp_max) × ALPHA_MAX (missing HP = síla barvy)
//   - barva závisí na trajektorii:
//       rising  (repair/build task běží)  → oranžová pulsuje → zelená
//       falling (demolish task běží)       → oranžová pulsuje → červená
//       static  (žádný task)               → čistá oranžová
//
// Klik na poškozený outer layer = enqueue repair (idempotent).

import Phaser from "phaser";
import type { World } from "../model";
import { MODULE_DEFS } from "../model";
import { getOuterHP, getBayTrajectory } from "../world";
import { TooltipManager } from "../tooltip";
import {
  SEGMENT_X,
  SEGMENT_Y,
  BAY_PX,
  BAY_SCALE,
  COL_BAY_SELECTED,
  setSegmentX,
} from "./layout";
import {
  UI_OVERLAY_BLACK,
  UI_TRAJ_STATIC,
  UI_TRAJ_RISING,
  UI_TRAJ_FALLING,
} from "../palette";
import { dockManager } from "./dock_manager";

// Oranžová overlay axiom (S18). Barvy vychází z palette — STATIC/RISING/FALLING.
const OVERLAY_ALPHA_MAX = 0.6;
// Pulse frekvence — sin vlna, perioda ≈ 5 s.
const PULSE_RAD_PER_MS = 0.00125;

// Phaser Color objekty pro interpolaci (ColorWithColor vrací {r,g,b}).
const COLOR_ORANGE = Phaser.Display.Color.ValueToColor(UI_TRAJ_STATIC);
const COLOR_GREEN = Phaser.Display.Color.ValueToColor(UI_TRAJ_RISING);
const COLOR_RED = Phaser.Display.Color.ValueToColor(UI_TRAJ_FALLING);

export class SegmentPanel {
  private bayRects: Phaser.GameObjects.Rectangle[] = [];
  private baySprites: (Phaser.GameObjects.Image | undefined)[] = [];
  private damageOverlays: Phaser.GameObjects.Rectangle[] = [];
  private selectionOverlay: Phaser.GameObjects.Rectangle;
  private selectedBayIdx: number | null = 0;

  constructor(
    private scene: Phaser.Scene,
    private getWorld: () => World,
  ) {
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col;
        const x = SEGMENT_X + col * BAY_PX;
        const y = SEGMENT_Y + row * BAY_PX;

        // Hit-area rect (invisible, alpha=0) — barva nerenderuje, ale paletu držíme čistou.
        const rect = scene.add
          .rectangle(x, y, BAY_PX, BAY_PX, UI_OVERLAY_BLACK, 0)
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        rect.on("pointerdown", () => this.selectBay(idx));
        this.bayRects[idx] = rect;

        const overlay = scene.add
          .rectangle(x, y, BAY_PX, BAY_PX, UI_TRAJ_STATIC, 0)
          .setOrigin(0, 0)
          .setDepth(10);
        this.damageOverlays[idx] = overlay;
      }
    }

    this.selectionOverlay = scene.add
      .rectangle(0, 0, BAY_PX, BAY_PX, UI_OVERLAY_BLACK, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COL_BAY_SELECTED)
      .setDepth(20)
      .setVisible(false);

    // BELT axiom (S28): panel ustupuje, ne BELT. Při dock change se segment
    // re-centruje do volné zóny mezi otevřenými panely.
    dockManager.onChange(() => {
      setSegmentX(dockManager.getSegmentX());
      this.relayout();
    });
  }

  // S24 KISS: BAY_PX je fix, velikost rects/overlays se nemění.
  // Při resize jen re-centrujeme BELT (SEGMENT_X/Y se mění).
  relayout(): void {
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col;
        const x = SEGMENT_X + col * BAY_PX;
        const y = SEGMENT_Y + row * BAY_PX;
        this.bayRects[idx]?.setPosition(x, y);
        this.damageOverlays[idx]?.setPosition(x, y);
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
    // Observer mode (P1): klik jen vybere bay pro hover/inspekci. Žádné
    // hráčské akce — repair / build / demolish jsou Player mode (P2+).
    // Observer sleduje postupný zánik, nemůže intervenovat.
    this.selectedBayIdx = idx;
  }

  // S24: vrátí lidský stav repair tasku na dané modulu (Observer mode — bez klik akce).
  // Příklady: „Probíhá oprava (30%)", „Oprava pozastavena", „Oprava ve frontě", null = nic.
  private repairStateText(moduleId: string): string | null {
    const w = this.getWorld();
    const task = w.tasks.find(
      (t) => t.kind === "repair" && t.target.moduleId === moduleId,
    );
    if (!task) return null;
    const pct = task.wd_total > 0 ? Math.round((task.wd_done / task.wd_total) * 100) : 0;
    switch (task.status) {
      case "active":    return `Probíhá oprava (${pct}%)`;
      case "paused":    return `Oprava pozastavena (${pct}%)`;
      case "pending":   return `Oprava ve frontě`;
      case "completed": return `Oprava dokončena`;
      case "failed":    return `Oprava selhala`;
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
    // module_root / module_ref
    const mod = w.modules[bay.moduleId];
    const modName = mod?.kind ?? "?";
    const hp = mod ? `${mod.hp.toFixed(0)} / ${mod.hp_max}` : "?";
    const missing = mod ? mod.hp_max - mod.hp : 0;
    const state = missing > 0 ? (this.repairStateText(bay.moduleId) ?? "Poškozeno") : "";
    return `${pos}\n\nModule: ${modName}\nStatus: ${mod?.status ?? "?"}\nHP: ${hp}${state ? `\n${state}` : ""}`;
  }

  render(): void {
    const w = this.getWorld();
    const now = this.scene.time.now;
    // Pulse koeficient 0..1 — stejný pro všechny bays v téhle snímku.
    const pulse01 = (Math.sin(now * PULSE_RAD_PER_MS) + 1) / 2;

    for (let i = 0; i < 16; i++) {
      const bay = w.segment[i];
      const rect = this.bayRects[i];
      const overlay = this.damageOverlays[i];
      if (!rect || !bay) continue;

      // Sprite dispatch podle kind.
      rect.setFillStyle(UI_OVERLAY_BLACK, 0);
      switch (bay.kind) {
        case "void":
          this.removeSprite(i);
          break;
        case "module_root": {
          const mod = w.modules[bay.moduleId];
          const def = mod ? MODULE_DEFS[mod.kind] : undefined;
          this.drawBaySprite(i, mod?.kind ?? "", def?.w ?? 1, def?.h ?? 1);
          break;
        }
        case "module_ref":
          this.removeSprite(i);
          break;
      }

      // Overlay — damage + trajectory.
      if (overlay) {
        // S29 Asteroid flash: při aktivním flashUntilTick přepiš overlay na
        // ostře červenou s vysokou alpha (bez pulse, jen solid hit signal).
        // Aplikuje na všechny bays modulu (root + ref) skrz moduleId resolving.
        const flashingModuleId =
          bay.kind === "module_root" ? bay.moduleId :
          bay.kind === "module_ref" ? bay.moduleId : undefined;
        if (flashingModuleId) {
          const flashMod = w.modules[flashingModuleId];
          if (flashMod && flashMod.flashUntilTick !== undefined && w.tick < flashMod.flashUntilTick) {
            overlay.setFillStyle(UI_TRAJ_FALLING, 0.85);
            continue;
          }
        }

        const outer = getOuterHP(w, i);
        if (!outer) {
          overlay.setFillStyle(UI_TRAJ_STATIC, 0);
          continue;
        }
        const missingPct = 1 - outer.hp / outer.hp_max;
        if (missingPct <= 0) {
          overlay.setFillStyle(UI_TRAJ_STATIC, 0);
          continue;
        }
        const traj = getBayTrajectory(w, i);
        let colorHex = UI_TRAJ_STATIC;
        if (traj === "rising") {
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(
            COLOR_ORANGE,
            COLOR_GREEN,
            100,
            Math.floor(pulse01 * 100),
          );
          colorHex = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
        } else if (traj === "falling") {
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(
            COLOR_ORANGE,
            COLOR_RED,
            100,
            Math.floor(pulse01 * 100),
          );
          colorHex = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
        }
        overlay.setFillStyle(colorHex, missingPct * OVERLAY_ALPHA_MAX);
      }
    }

    const idx = this.selectedBayIdx;
    if (idx === null) {
      this.selectionOverlay.setVisible(false);
    } else {
      const row = Math.floor(idx / 8);
      const col = idx % 8;
      this.selectionOverlay
        .setPosition(SEGMENT_X + col * BAY_PX, SEGMENT_Y + row * BAY_PX)
        .setVisible(true);
    }
  }

  // Vykreslí sprite na bay pozici. Fallback `bay_construction` pro chybějící
  // textury. spanW/spanH = velikost v bay jednotkách (multi-bay moduly).
  private drawBaySprite(bayIdx: number, textureKey: string, spanW: number, spanH: number): void {
    let key = textureKey;
    if (!key || !this.scene.textures.exists(key)) {
      key = "bay_construction";
    }
    if (!this.scene.textures.exists(key)) {
      this.removeSprite(bayIdx);
      return;
    }

    const row = Math.floor(bayIdx / 8);
    const col = bayIdx % 8;
    const x = SEGMENT_X + col * BAY_PX + (spanW * BAY_PX) / 2;
    const y = SEGMENT_Y + row * BAY_PX + (spanH * BAY_PX) / 2;

    let sprite = this.baySprites[bayIdx];
    if (!sprite) {
      sprite = this.scene.add.image(x, y, key).setScale(BAY_SCALE).setDepth(5);
      this.baySprites[bayIdx] = sprite;
    } else {
      sprite.setTexture(key).setPosition(x, y).setVisible(true);
    }
  }

  private removeSprite(bayIdx: number): void {
    const sprite = this.baySprites[bayIdx];
    if (sprite) sprite.setVisible(false);
  }
}
