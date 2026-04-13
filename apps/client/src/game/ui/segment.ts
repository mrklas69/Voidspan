// SegmentPanel — střední plocha, 8×2 tile grid.
// Rect per tile (hit-area), sprite per tile (floor / floor_damaged / modul), selection overlay.
// Owns `selectedTileIdx` — InspectorPanel ho čte přes getter.
// Klik na damaged tile = enqueue repair (idempotent).

import Phaser from "phaser";
import type { World } from "../model";
import { enqueueRepairTask } from "../world";
import { TooltipManager } from "../tooltip";
import {
  SEGMENT_X,
  SEGMENT_Y,
  TILE_PX,
  TILE_SCALE,
  COL_TILE_SELECTED,
} from "./layout";

// HP-unified damage axiom (S16): každý tile s hp<hp_max dostane červený fill
// overlay (alpha 0.6). 0xcc3333 = tmavě červená, dobře viditelná na šedém floor.
const DAMAGE_OVERLAY_COLOR = 0xcc3333;
const DAMAGE_OVERLAY_ALPHA_MAX = 0.6;

export class SegmentPanel {
  private tileRects: Phaser.GameObjects.Rectangle[] = [];
  private tileSprites: (Phaser.GameObjects.Image | undefined)[] = [];
  private damageOverlays: Phaser.GameObjects.Rectangle[] = [];
  private selectionOverlay: Phaser.GameObjects.Rectangle;
  // Startovní fokus na tile [0,0] (S16) — kurzor je vždy viditelný, žádný nullable
  // „nic nevybráno" stav. Zjednodušuje INSPECTOR (vždy má co zobrazit).
  private selectedTileIdx: number | null = 0;

  constructor(
    private scene: Phaser.Scene,
    private getWorld: () => World,
  ) {
    // Žádný rámeček kolem segmentu ani kolem tile — ať je vidět jen obsah (sprity).
    // Tile rect je plně průhledný, slouží už jen jako hit-area pro klik.
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col;
        const x = SEGMENT_X + col * TILE_PX;
        const y = SEGMENT_Y + row * TILE_PX;

        const rect = scene.add
          .rectangle(x, y, TILE_PX, TILE_PX, 0x000000, 0)
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        rect.on("pointerdown", () => this.selectTile(idx));
        this.tileRects[idx] = rect;

        // Damage overlay — per-tile červený fill, default skrytý, depth 10
        // (nad spritem=5, pod selection=20). Pointer events off — klikání jde přes rect.
        const overlay = scene.add
          .rectangle(x, y, TILE_PX, TILE_PX, DAMAGE_OVERLAY_COLOR, 0)
          .setOrigin(0, 0)
          .setDepth(10);
        this.damageOverlays[idx] = overlay;
      }
    }

    // Selection overlay — zatím skrytý, pozicuje se v render().
    this.selectionOverlay = scene.add
      .rectangle(0, 0, TILE_PX, TILE_PX, 0x000000, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COL_TILE_SELECTED)
      .setDepth(20)
      .setVisible(false);
  }

  attachTooltips(tooltips: TooltipManager): void {
    for (let i = 0; i < this.tileRects.length; i++) {
      const rect = this.tileRects[i];
      if (!rect) continue;
      tooltips.attach(rect, () => this.tileTooltipText(i));
    }
  }

  getSelectedTileIdx(): number | null {
    return this.selectedTileIdx;
  }

  // WASD pohyb selection (S16). dx/dy v tile-jednotkách.
  // - Pokud není nic vybráno, prvním stiskem se selectne idx 0 (top-left).
  // - Na okraji clampuje (bez wrap). Segment = 8 sloupců × 2 řady.
  // - Nepouští repair task — to zůstává výhradně na klik (izomorfismus break-free).
  moveSelection(dx: number, dy: number): void {
    if (this.selectedTileIdx === null) {
      this.selectedTileIdx = 0;
      return;
    }
    const row = Math.floor(this.selectedTileIdx / 8);
    const col = this.selectedTileIdx % 8;
    const newRow = Math.max(0, Math.min(1, row + dy));
    const newCol = Math.max(0, Math.min(7, col + dx));
    this.selectedTileIdx = newRow * 8 + newCol;
  }

  private selectTile(idx: number): void {
    this.selectedTileIdx = idx;
    // Damaged tile = klik je zároveň enqueue repair task. Idempotent —
    // druhý klik na ten samý damaged nic nepřidá.
    const tile = this.getWorld().segment[idx];
    if (tile?.kind === "damaged") {
      enqueueRepairTask(this.getWorld(), idx);
    }
  }

  private tileTooltipText(idx: number): string | null {
    const w = this.getWorld();
    const tile = w.segment[idx];
    if (!tile) return null;
    const row = Math.floor(idx / 8);
    const col = idx % 8;
    const pos = `Tile [${row},${col}] idx ${idx}`;
    if (tile.kind === "empty") {
      return `${pos}\n\nEmpty hull\nBuild menu přijde v §15 rozšíření.`;
    }
    if (tile.kind === "damaged") {
      const missing = tile.hp_max - tile.hp;
      return (
        `${pos}\n\nDamaged hull\n` +
        `HP: ${tile.hp.toFixed(1)} / ${tile.hp_max}\n` +
        `WD to repair: ${missing.toFixed(1)}\n` +
        `Click = enqueue repair task`
      );
    }
    // module_ref
    const mod = w.modules[tile.moduleId];
    const modName = mod?.kind ?? "?";
    return `${pos}\n\nModule: ${modName}\nStatus: ${mod?.status ?? "?"}`;
  }

  render(): void {
    const w = this.getWorld();
    for (let i = 0; i < 16; i++) {
      const tile = w.segment[i];
      const rect = this.tileRects[i];
      const overlay = this.damageOverlays[i];
      if (!rect || !tile) continue;

      // Sprite: floor pro empty i damaged (damaged už nemá vlastní texturu —
      // červený overlay nese vizuální informaci o poškození).
      if (tile.kind === "damaged" || tile.kind === "empty") {
        rect.setFillStyle(0x000000, 0);
        this.drawTileSprite(i, "tile_floor");
      } else if (tile.kind === "module_ref") {
        rect.setFillStyle(0x000000, 0);
        this.drawTileSprite(i, w.modules[tile.moduleId]?.kind ?? "");
      }

      // Damage overlay — aktivní, pokud hp<hp_max. Intenzita úměrná missing HP
      // (lineárně): plně zdravý = alpha 0, fully damaged (hp=0) = alpha_max.
      if (overlay) {
        let missingPct = 0;
        if (tile.kind === "damaged" || tile.kind === "empty") {
          missingPct = 1 - tile.hp / tile.hp_max;
        } else if (tile.kind === "module_ref") {
          const mod = w.modules[tile.moduleId];
          if (mod) missingPct = 1 - mod.hp / mod.hp_max;
        }
        overlay.setFillStyle(DAMAGE_OVERLAY_COLOR, missingPct * DAMAGE_OVERLAY_ALPHA_MAX);
      }
    }

    // Selection overlay pozice nebo skrytí.
    const idx = this.selectedTileIdx;
    if (idx === null) {
      this.selectionOverlay.setVisible(false);
    } else {
      const row = Math.floor(idx / 8);
      const col = idx % 8;
      this.selectionOverlay
        .setPosition(SEGMENT_X + col * TILE_PX, SEGMENT_Y + row * TILE_PX)
        .setVisible(true);
    }
  }

  // Vykreslí nebo aktualizuje sprite na tile pozici. Pokud textura neexistuje
  // nebo je key prázdný, použije fallback `tile_construction` (černo-žluté pruhy).
  // Až teprve když chybí i fallback (čeho by se nemělo stát), sprite skryje.
  private drawTileSprite(tileIdx: number, textureKey: string): void {
    let key = textureKey;
    if (!key || !this.scene.textures.exists(key)) {
      key = "tile_construction";
    }
    if (!this.scene.textures.exists(key)) {
      this.removeSprite(tileIdx);
      return;
    }

    const row = Math.floor(tileIdx / 8);
    const col = tileIdx % 8;
    const x = SEGMENT_X + col * TILE_PX + TILE_PX / 2;
    const y = SEGMENT_Y + row * TILE_PX + TILE_PX / 2;

    let sprite = this.tileSprites[tileIdx];
    if (!sprite) {
      // Sprite vytvoříme jednou a recyklujeme. Nativní 40×40 × scale 2 = 80×80 px.
      sprite = this.scene.add.image(x, y, key).setScale(TILE_SCALE).setDepth(5);
      this.tileSprites[tileIdx] = sprite;
    } else {
      sprite.setTexture(key).setVisible(true);
    }
  }

  private removeSprite(tileIdx: number): void {
    const sprite = this.tileSprites[tileIdx];
    if (sprite) sprite.setVisible(false);
  }
}
