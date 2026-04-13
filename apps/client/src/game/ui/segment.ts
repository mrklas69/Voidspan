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

export class SegmentPanel {
  private tileRects: Phaser.GameObjects.Rectangle[] = [];
  private tileSprites: (Phaser.GameObjects.Image | undefined)[] = [];
  private selectionOverlay: Phaser.GameObjects.Rectangle;
  private selectedTileIdx: number | null = null;

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
      return `${pos}\n\nDamaged hull\nWD to repair: ${tile.wd_to_repair}\nClick = enqueue repair task`;
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
      if (!rect || !tile) continue;

      if (tile.kind === "damaged") {
        // Damaged tile = floor_damaged asset (textura trhliny) + tenký červený stroke.
        rect.setFillStyle(0x000000, 0);
        this.drawTileSprite(i, "tile_floor_damaged");
      } else if (tile.kind === "empty") {
        rect.setFillStyle(0x000000, 0);
        this.drawTileSprite(i, "tile_floor");
      } else if (tile.kind === "module_ref") {
        rect.setFillStyle(0x000000, 0);
        this.drawTileSprite(i, w.modules[tile.moduleId]?.kind ?? "");
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
  // nebo je key prázdný, skryje existující sprite.
  private drawTileSprite(tileIdx: number, textureKey: string): void {
    if (!textureKey || !this.scene.textures.exists(textureKey)) {
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
      sprite = this.scene.add.image(x, y, textureKey).setScale(TILE_SCALE).setDepth(5);
      this.tileSprites[tileIdx] = sprite;
    } else {
      sprite.setTexture(textureKey).setVisible(true);
    }
  }

  private removeSprite(tileIdx: number): void {
    const sprite = this.tileSprites[tileIdx];
    if (sprite) sprite.setVisible(false);
  }
}
