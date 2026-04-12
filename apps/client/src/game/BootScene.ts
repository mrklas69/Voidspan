// BootScene — v S8 přepsáno na 2×8 reference grid pro Art sezení (img2img structure ref).
// Cíl: exportovat čistou mřížku 1200×300 (4:1) jako PNG, kterou uživatel použije
// v arena.ai jako strukturní referenci — modely ji nedokážou popsat textem, musí ji vidět.

import Phaser from "phaser";

// Konstanty mřížky — 8 sloupců × 2 řady, tile 150×150 px.
// Poměr výsledku 1200×300 = 4:1 přesně, jak chce prompt.
const TILE = 150;
const COLS = 8;
const ROWS = 2;
const GRID_W = TILE * COLS; // 1200
const GRID_H = TILE * ROWS; // 300

// Umístění v canvasu 1280×720 (centrováno)
const ORIGIN_X = (1280 - GRID_W) / 2; // 40
const ORIGIN_Y = (720 - GRID_H) / 2; // 210

export class BootScene extends Phaser.Scene {
  // Kontejner s labely — toggle klávesou L, ať je lze schovat před exportem/screenshotem
  private labels?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "boot" });
  }

  create(): void {
    // Pozadí plochy mřížky — plná černá kvůli čistému img2img referenci (bez šumu).
    this.add
      .rectangle(ORIGIN_X, ORIGIN_Y, GRID_W, GRID_H, 0x000000)
      .setOrigin(0, 0);

    // Vykreslení seamů mřížky. Graphics API = primitive kreslení, žádný sprite.
    const g = this.add.graphics();
    g.lineStyle(3, 0x888888, 1);

    // Proletíme všechny buňky. Výjimka: dock T4+T5 (row 0, col 3 a 4) = jeden
    // sloučený obdélník 2×1 (bez seamu uprostřed), jak požaduje POC_P1 §3.
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = ORIGIN_X + col * TILE;
        const y = ORIGIN_Y + row * TILE;

        if (row === 0 && col === 3) {
          // T4 + T5 jako jeden tile (dock 2×1) — šířka 2× TILE, bez vnitřního seamu
          g.strokeRect(x, y, TILE * 2, TILE);
        } else if (row === 0 && col === 4) {
          // T5 přeskakujeme — už nakreslen jako součást docku
          continue;
        } else {
          g.strokeRect(x, y, TILE, TILE);
        }
      }
    }

    // Labely T1..T8 nad mřížkou, B1..B8 pod mřížkou. Mimo plochu gridu —
    // takže je snapshot neexportuje, ale uživatel je vidí na obrazovce.
    this.labels = this.add.container();
    const labelStyle = {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#888888",
    };
    for (let col = 0; col < COLS; col++) {
      const cx = ORIGIN_X + col * TILE + TILE / 2;
      const tLabel = this.add
        .text(cx, ORIGIN_Y - 20, `T${col + 1}`, labelStyle)
        .setOrigin(0.5);
      const bLabel = this.add
        .text(cx, ORIGIN_Y + GRID_H + 8, `B${col + 1}`, labelStyle)
        .setOrigin(0.5);
      this.labels.add([tLabel, bLabel]);
    }

    // Horní info text — mimo grid, mimo export. Suchý military tón (POC_P1 §17).
    this.add
      .text(
        640,
        60,
        "VOIDSPAN // GRID REFERENCE 2x8",
        { fontFamily: "monospace", fontSize: "20px", color: "#aaaaaa" }
      )
      .setOrigin(0.5);
    this.add
      .text(
        640,
        90,
        "[P] export PNG    [L] toggle labels",
        { fontFamily: "monospace", fontSize: "13px", color: "#666666" }
      )
      .setOrigin(0.5);

    // Klávesové zkratky. `?.` = optional chaining, keyboard plugin může být undefined
    // v některých konfiguracích (defenzivní zápis).
    this.input.keyboard?.on("keydown-P", () => this.exportGrid());
    this.input.keyboard?.on("keydown-L", () => {
      if (this.labels) this.labels.visible = !this.labels.visible;
    });
  }

  // Export plochy mřížky jako PNG. `snapshotArea` vezme jen zadaný region
  // renderer canvasu — labely mimo grid tak do obrázku nezasáhnou, ani kdyby
  // byly viditelné.
  private exportGrid(): void {
    this.game.renderer.snapshotArea(
      ORIGIN_X,
      ORIGIN_Y,
      GRID_W,
      GRID_H,
      (image) => {
        // `snapshotArea` vrací HTMLImageElement (úspěch) nebo Phaser.Display.Color
        // (když se žádá jeden pixel). `instanceof` filtruje success-case.
        if (!(image instanceof HTMLImageElement)) return;

        // Stažení skrze virtuální <a download="..."> — browser-only API,
        // ale POC_P1 je čistě klient, takže v pohodě.
        const link = document.createElement("a");
        link.href = image.src;
        link.download = "voidspan-grid-2x8.png";
        link.click();
      }
    );
  }
}
