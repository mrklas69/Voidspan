// SegmentPanel — střední plocha, 8×2 bay grid (S18 layered axiom).
// Render dispatch podle bay.kind: void = nic, skeleton = skeleton.png,
// covered = coverN.png, module_root = modul sprite (multi-bay span),
// module_ref = skryto (root pokryl span).
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
} from "./layout";

// Oranžová overlay axiom (S18).
const OVERLAY_ORANGE = 0xff8800;
const OVERLAY_GREEN = 0x00ff00;
const OVERLAY_RED = 0xff0000;
const OVERLAY_ALPHA_MAX = 0.6;
// Pulse frekvence — sin vlna, perioda ≈ 5 s.
const PULSE_RAD_PER_MS = 0.00125;

// Phaser Color objekty pro interpolaci (ColorWithColor vrací {r,g,b}).
const COLOR_ORANGE = Phaser.Display.Color.ValueToColor(OVERLAY_ORANGE);
const COLOR_GREEN = Phaser.Display.Color.ValueToColor(OVERLAY_GREEN);
const COLOR_RED = Phaser.Display.Color.ValueToColor(OVERLAY_RED);

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

        const rect = scene.add
          .rectangle(x, y, BAY_PX, BAY_PX, 0x000000, 0)
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        rect.on("pointerdown", () => this.selectBay(idx));
        this.bayRects[idx] = rect;

        const overlay = scene.add
          .rectangle(x, y, BAY_PX, BAY_PX, OVERLAY_ORANGE, 0)
          .setOrigin(0, 0)
          .setDepth(10);
        this.damageOverlays[idx] = overlay;
      }
    }

    this.selectionOverlay = scene.add
      .rectangle(0, 0, BAY_PX, BAY_PX, 0x000000, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COL_BAY_SELECTED)
      .setDepth(20)
      .setVisible(false);
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

  private bayTooltipText(idx: number): string | null {
    const w = this.getWorld();
    const bay = w.segment[idx];
    if (!bay) return null;
    const row = Math.floor(idx / 8);
    const col = idx % 8;
    const pos = `Bay [${row},${col}] idx ${idx}`;

    if (bay.kind === "void") {
      return `${pos}\n\nVoid — otevřený prostor.`;
    }
    if (bay.kind === "skeleton") {
      const missing = bay.hp_max - bay.hp;
      return (
        `${pos}\n\nSkeleton (kostra)\n` +
        `HP: ${bay.hp.toFixed(0)} / ${bay.hp_max}\n` +
        (missing > 0 ? `Klik = enqueue repair task` : `(bez poškození)`)
      );
    }
    if (bay.kind === "covered") {
      const missing = bay.hp_max - bay.hp;
      return (
        `${pos}\n\nCovered v${bay.variant} (plášť)\n` +
        `HP: ${bay.hp.toFixed(0)} / ${bay.hp_max}\n` +
        (missing > 0 ? `Klik = enqueue repair task` : `(vzduchotěsné, bez poškození)`)
      );
    }
    // module_root / module_ref
    const mod = w.modules[bay.moduleId];
    const modName = mod?.kind ?? "?";
    const hp = mod ? `${mod.hp.toFixed(0)} / ${mod.hp_max}` : "?";
    return `${pos}\n\nModule: ${modName}\nStatus: ${mod?.status ?? "?"}\nHP: ${hp}`;
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
      rect.setFillStyle(0x000000, 0);
      switch (bay.kind) {
        case "void":
          this.removeSprite(i);
          break;
        case "skeleton":
          this.drawBaySprite(i, "bay_skeleton", 1, 1);
          break;
        case "covered":
          this.drawBaySprite(i, `bay_cover${bay.variant}`, 1, 1);
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
        const outer = getOuterHP(w, i);
        if (!outer) {
          overlay.setFillStyle(OVERLAY_ORANGE, 0);
          continue;
        }
        const missingPct = 1 - outer.hp / outer.hp_max;
        if (missingPct <= 0) {
          overlay.setFillStyle(OVERLAY_ORANGE, 0);
          continue;
        }
        const traj = getBayTrajectory(w, i);
        let colorHex = OVERLAY_ORANGE;
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
