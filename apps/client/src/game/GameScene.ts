// GameScene — hlavní herní scéna P1 POC.
// Orchestrator: vytváří panely (Header / Segment / Actors / SideRight / Log),
// drží World model a tick loop. Veškerá prezentace je v `ui/*.ts`.
// Model-first: world = jediný zdroj pravdy, panely čtou přes closures.

import Phaser from "phaser";
import { TooltipManager } from "./tooltip";
import { ModalManager } from "./modal";
import { BackgroundSystem } from "./background";
import { createAsteroidOrbit, launchRandomAsteroid } from "./orbit";
const INITIAL_ASTEROID_COUNT = 10;
import {
  createInitialWorld,
  stepWorld,
  startGame,
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

  private header!: HeaderPanel;
  private actors!: ActorsPanel;
  private segment!: SegmentPanel;
  private sideRight!: SideRightPanel;

  constructor() {
    super({ key: "game" });
  }

  // === Preload: načti sprity modulů z MODULE_DEFS ============================

  preload(): void {
    // Module assety: loaduj jen ty, které reálně existují v public/assets/modules/.
    // Whitelist (S16) drží Phaser bez warningů — jakmile přidáš nový PNG, dopiš kind sem.
    // Texture key = ModuleKind (matchuje drawBaySprite v SegmentPanel).
    const AVAILABLE_MODULE_ASSETS: Array<keyof typeof MODULE_DEFS> = [
      "SolarArray", "Engine", "Dock",
      "Habitat", "Storage", "MedCore", "Assembler", "CommandPost",
    ];
    for (const kind of AVAILABLE_MODULE_ASSETS) {
      this.load.image(kind, `assets/modules/${MODULE_DEFS[kind].asset}`);
    }
    // Bay assety (ne-moduly) — layered bay axiom (S18).
    // Skeleton = vnější vrstva pro nepokrytý bay; cover1-5 = 5 variant pláště.
    this.load.image("bay_skeleton", "assets/bays/skeleton.png");
    for (let v = 1; v <= 5; v++) {
      this.load.image(`bay_cover${v}`, `assets/bays/cover${v}.png`);
    }
    // Construction texture — fallback sprite pro chybějící moduly/assety.
    this.load.image("bay_construction", "assets/bays/construction.png");

    // Orbitální dekor.
    this.load.image("asteroid2", "assets/sprites/asteroid2.png");

    // Potlač chyby při chybějícím souboru.
    this.load.on("loaderror", () => {
      // Silent skip — textures.exists() to odfiltruje.
    });
  }

  create(): void {
    this.world = createInitialWorld();
    // Start ihned — žádná "press SPACE to start" obrazovka (S16).
    startGame(this.world);

    // Dev-only: vystav world do window, ať jde debugovat v DevTools (Console: __world).
    // Vite `import.meta.env.DEV` je true jen při `pnpm dev`, v prod buildu se blok odstraní (tree-shake).
    if (import.meta.env.DEV) {
      (window as unknown as { __world: World }).__world = this.world;
    }

    this.tooltips = new TooltipManager(this);
    this.modal = new ModalManager(this);

    // Hvězdné pozadí — samostatný Container, scroll po ose Y nezávisle na UI.
    this.background = new BackgroundSystem(this, CANVAS_W, MID_H);
    this.background.update(0);

    // Asteroid v orbitě — střed horizontálně, dlouhý oběh.
    createAsteroidOrbit(this, CANVAS_W / 2, CANVAS_H);

    // Start game: vypustit N asteroidů (S16). Každý má náhodnou dráhu/rychlost/scale.
    for (let i = 0; i < INITIAL_ASTEROID_COUNT; i++) {
      launchRandomAsteroid(this, CANVAS_W / 2);
    }

    // --- Panely ---
    const getWorld = () => this.world;
    this.header = new HeaderPanel(this, getWorld);
    this.actors = new ActorsPanel(this, getWorld);
    this.segment = new SegmentPanel(this, getWorld);
    this.sideRight = new SideRightPanel(this, getWorld, () => this.segment.getSelectedBayIdx());

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
        "[H]      open / close this Help\n" +
        "[WASD]   move bay selection (yellow cursor)\n" +
        "[ESC]    zavřít tento dialog\n" +
        "\n" +
        "Klik na damaged bay = enqueue repair task.\n" +
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
        "[H] help  [WASD] select bay",
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
        case "w":
          this.segment.moveSelection(0, -1);
          break;
        case "a":
          this.segment.moveSelection(-1, 0);
          break;
        case "s":
          this.segment.moveSelection(0, 1);
          break;
        case "d":
          this.segment.moveSelection(1, 0);
          break;
        case "h":
          this.openHelpModal();
          break;
      }
    });
  }

  // === Tick loop + render ==================================================

  override update(_time: number, delta: number): void {
    this.accumulator += delta;
    while (this.accumulator >= TICK_MS) {
      stepWorld(this.world);
      this.accumulator -= TICK_MS;
    }

    // Drift pozadí — globální vektor rotuje 1× za game day, magnitude 7 px (S16).
    this.background.tickDrift(delta);

    this.header.render();
    this.segment.render();
    this.actors.render();
    this.sideRight.render();
  }
}
