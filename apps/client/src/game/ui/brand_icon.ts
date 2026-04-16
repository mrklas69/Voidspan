// Brand ikona ⊙ — Phaser Graphics, nezávislá na fontu.
// Kreslí kroužek + středovou tečku (Voidspan logo). Vrací ⊙ vizuál
// po S27 ASCII fix bez rizika font fallbacku — VT323 latin-subset
// znak ⊙ (U+2299) nemá, browser fallback rozbíjel baseline.

import Phaser from "phaser";

const BRAND_W = 26;
const BRAND_H = 26;
const RING_RADIUS = 9;
const RING_STROKE = 2;
const DOT_RADIUS = 2.5;

export class BrandIcon extends Phaser.GameObjects.Container {
  static readonly WIDTH = BRAND_W;
  static readonly HEIGHT = BRAND_H;

  private gfx: Phaser.GameObjects.Graphics;
  private currentColor: number;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number) {
    super(scene, x, y);
    this.currentColor = color;
    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.setSize(BRAND_W, BRAND_H);
    this.draw(color);
    scene.add.existing(this);
  }

  setBrandColor(color: number): void {
    if (color === this.currentColor) return;
    this.currentColor = color;
    this.draw(color);
  }

  private draw(color: number): void {
    const cx = BRAND_W / 2;
    const cy = BRAND_H / 2;
    this.gfx.clear();
    this.gfx.lineStyle(RING_STROKE, color, 1);
    this.gfx.strokeCircle(cx, cy, RING_RADIUS);
    this.gfx.fillStyle(color, 1);
    this.gfx.fillCircle(cx, cy, DOT_RADIUS);
  }
}
