// GameScene — hlavní herní scéna P1 POC.
// Orchestrator: vytváří panely (Header / Segment / Actors / SideRight / Log),
// drží World model a tick loop. Veškerá prezentace je v `ui/*.ts`.
// Model-first: world = jediný zdroj pravdy, panely čtou přes closures.

import Phaser from "phaser";
import { TooltipManager } from "./tooltip";
import { ModalManager } from "./modal";
import { BackgroundSystem } from "./background";
import { createAsteroidOrbit, launchRandomAsteroid } from "./orbit";
import {
  createInitialWorld,
  stepWorld,
  startGame,
  repairDone,
  dockComplete,
  endDay,
  TICK_MS,
} from "./world";
import type { World } from "./model";
import { MODULE_DEFS } from "./model";
import { FONT_FAMILY, FONT_SIZE_HINT } from "./palette";
import {
  CANVAS_W,
  CANVAS_H,
  MID_H,
  LOG_H,
  COL_TEXT_DIM,
} from "./ui/layout";
import { HeaderPanel } from "./ui/header";
import { ActorsPanel } from "./ui/actors";
import { SegmentPanel } from "./ui/segment";
import { SideRightPanel } from "./ui/side_right";

export class GameScene extends Phaser.Scene {
  private world!: World;
  private accumulator = 0;

  private tooltips!: TooltipManager;
  private modal!: ModalManager;
  private background!: BackgroundSystem;
  private cameraY = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private header!: HeaderPanel;
  private actors!: ActorsPanel;
  private segment!: SegmentPanel;
  private sideRight!: SideRightPanel;

  constructor() {
    super({ key: "game" });
  }

  // === Preload: načti sprity modulů z MODULE_DEFS ============================

  preload(): void {
    for (const kind of Object.keys(MODULE_DEFS) as Array<keyof typeof MODULE_DEFS>) {
      const def = MODULE_DEFS[kind];
      // Zatím máme jen solar_array.png — ostatní load selže tiše a SegmentPanel
      // si to ohlídá přes textures.exists(). Až přijdou další assety, jen je doplníš.
      this.load.image(kind, `assets/modules/${def.asset}`);
    }
    // Tile assety (ne-moduly).
    this.load.image("tile_floor", "assets/tiles/floor.png");
    this.load.image("tile_floor_damaged", "assets/tiles/floor_damaged.png");

    // Orbitální dekor.
    this.load.image("asteroid2", "assets/sprites/asteroid2.png");

    // Potlač chyby při chybějícím souboru.
    this.load.on("loaderror", () => {
      // Silent skip — textures.exists() to odfiltruje.
    });
  }

  create(): void {
    this.world = createInitialWorld();

    this.tooltips = new TooltipManager(this);
    this.modal = new ModalManager(this);

    // Hvězdné pozadí — samostatný Container, scroll po ose Y nezávisle na UI.
    this.background = new BackgroundSystem(this, CANVAS_W, MID_H);
    this.background.update(this.cameraY);

    // Asteroid v orbitě — střed horizontálně, dlouhý oběh.
    createAsteroidOrbit(this, CANVAS_W / 2, CANVAS_H);

    // --- Panely ---
    const getWorld = () => this.world;
    this.header = new HeaderPanel(this, getWorld);
    this.actors = new ActorsPanel(this, getWorld);
    this.segment = new SegmentPanel(this, getWorld);
    this.sideRight = new SideRightPanel(this, getWorld, () => this.segment.getSelectedTileIdx());

    this.createLog();
    this.bindDebugKeys();

    // Tooltips — každý panel si attach sám po vytvoření všech elementů.
    this.header.attachTooltips(this.tooltips);
    this.actors.attachTooltips(this.tooltips);
    this.segment.attachTooltips(this.tooltips);
    this.sideRight.attachTooltips(this.tooltips);
  }

  // === Help modal trigger (Top Bar) ========================================

  private openHelpModal(): void {
    this.modal.open({
      title: "Help",
      body:
        "Shortcuts\n" +
        "\n" +
        "[SPACE]  start simulation\n" +
        "[H]      open / close this Help\n" +
        "[L]      launch asteroid (random orbit)\n" +
        "[↑ ↓]    scroll background (test camera)\n" +
        "[R]      debug: repair done\n" +
        "[E]      debug: dock complete\n" +
        "[W]      debug: end day\n" +
        "[F5]     nový svět\n" +
        "[ESC]    zavřít tento dialog\n" +
        "\n" +
        "Klik na damaged tile = enqueue repair task.\n" +
        "Hover kdekoli = tooltip s detailem.",
    });
  }

  // === Log (Bottom Bar) ====================================================

  private createLog(): void {
    const logY = CANVAS_H - LOG_H;
    // Hint ticker — jediný vycentrovaný text se všemi zkratkami včetně [H] Help.
    // Celý řádek je klikatelný (otevře Help modal) — [H] je zároveň hotkey.
    const hint = this.add
      .text(
        CANVAS_W / 2,
        logY + LOG_H / 2,
        "[SPACE] start  [H] help  [L] asteroid  [↑↓] scroll bg (test)  [R/E/W] skip phase  [F5] new",
        {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_HINT,
          color: COL_TEXT_DIM,
        },
      )
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });
    hint.on("pointerdown", () => this.openHelpModal());
  }

  // === Debug klávesy (case-insensitive — axiom) =============================

  private bindDebugKeys(): void {
    const kb = this.input.keyboard;
    // Unified handler — klávesy fungují bez ohledu na Shift/CapsLock.
    kb?.on("keydown", (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      switch (key) {
        case " ":
          startGame(this.world);
          break;
        case "r":
          repairDone(this.world);
          break;
        case "e":
          dockComplete(this.world);
          break;
        case "w":
          endDay(this.world);
          break;
        case "l":
          launchRandomAsteroid(this, CANVAS_W / 2);
          break;
        case "h":
          this.openHelpModal();
          break;
      }
    });
    // Šipky ↑ ↓ — scroll pozadí (test).
    this.cursors = kb?.createCursorKeys();
  }

  // === Tick loop + render ==================================================

  override update(_time: number, delta: number): void {
    this.accumulator += delta;
    while (this.accumulator >= TICK_MS) {
      stepWorld(this.world);
      this.accumulator -= TICK_MS;
    }

    // Background scroll — šipky ↑ ↓.
    if (this.cursors) {
      const speed = 400; // px/s
      let dy = 0;
      if (this.cursors.up?.isDown) dy -= speed * (delta / 1000);
      if (this.cursors.down?.isDown) dy += speed * (delta / 1000);
      if (dy !== 0) {
        this.cameraY += dy;
        this.background.update(this.cameraY);
      }
    }

    this.header.render();
    this.segment.render();
    this.actors.render();
    this.sideRight.render();
  }
}
