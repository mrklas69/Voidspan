// GameScene — hlavní herní scéna P1 POC.
// S10 scope: §16 UI kostra + první asset (SolarArray sprite) + klikatelný Inspector.
// Model-first: všechny zóny čtou z `this.world`. Tile 40×40 native × 2× = 80×80 na canvasu.

import Phaser from "phaser";
import {
  createInitialWorld,
  stepWorld,
  startGame,
  repairDone,
  dockComplete,
  endDay,
  enqueueRepairTask,
  phaseLabel,
  TICK_MS,
} from "./world";
import type { World, Module, Actor, Task } from "./model";
import { MODULE_DEFS, ACTOR_DEFS } from "./model";
import {
  UI_BORDER_DIM,
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
  UI_TILE_DAMAGED,
  FONT_FAMILY,
  FONT_SIZE_HUD,
  FONT_SIZE_LABEL,
  FONT_SIZE_HINT,
} from "./palette";

// === Layout konstanty §16 (1280×720 canvas) ===

const CANVAS_W = 1280;
const CANVAS_H = 720;

const HUD_H = 60;
const LOG_H = 60;
const MID_Y = HUD_H; // 60
const MID_H = CANVAS_H - HUD_H - LOG_H; // 600

const ACTORS_W = 150;
const ACTORS_X = 0;

const TASKQUEUE_W = 250;
const TASKQUEUE_X = CANVAS_W - TASKQUEUE_W; // 1030

const TILE_NATIVE = 40;
const TILE_SCALE = 2;
const TILE_PX = TILE_NATIVE * TILE_SCALE; // 80
const SEGMENT_W = 8 * TILE_PX; // 640
const SEGMENT_H = 2 * TILE_PX; // 160
const SEGMENT_X = (CANVAS_W - SEGMENT_W) / 2; // 320
const SEGMENT_Y = MID_Y + (MID_H - SEGMENT_H) / 2; // 340

// === Barvy — přes palette.ts (axiom Voidspan 16) ===
// Lokální aliasy drží GameScene-specific jména, ale hodnoty jdou z palety.
const COL_ZONE_BORDER = UI_BORDER_DIM;
const COL_ZONE_LABEL = UI_TEXT_DIM;
const COL_TILE_DAMAGED = UI_TILE_DAMAGED;
const COL_TILE_SELECTED = UI_SELECT_STROKE;
const COL_TEXT = UI_TEXT_PRIMARY;
const COL_TEXT_DIM = UI_TEXT_DIM;
const COL_TEXT_ACCENT = UI_TEXT_ACCENT;

export class GameScene extends Phaser.Scene {
  private world!: World;
  private accumulator = 0;

  // HUD
  private hudText?: Phaser.GameObjects.Text;

  // Actors + Task queue dynamic text
  private actorsText?: Phaser.GameObjects.Text;
  private taskQueueText?: Phaser.GameObjects.Text;

  // Segment — pozadí rectangle + sprite (volitelný) per tile.
  private tileRects: Phaser.GameObjects.Rectangle[] = [];
  private tileSprites: (Phaser.GameObjects.Image | undefined)[] = [];

  // Inspector — klikem zvolený tile idx.
  private selectedTileIdx: number | null = null;
  private inspectorText?: Phaser.GameObjects.Text;

  // Překryv výběru — jeden rect nad spritem, přesouváme ho na selected tile.
  private selectionOverlay?: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: "game" });
  }

  // === Preload: načti sprity modulů z MODULE_DEFS ============================

  preload(): void {
    // Iterujeme přes statický katalog. Každý modul má `asset` filename
    // relativní k /assets/modules/ (Vite servíruje apps/client/public/ na /).
    // Klíč do Phaser cache = module kind (PascalCase ze ModuleKind type).
    for (const kind of Object.keys(MODULE_DEFS) as Array<keyof typeof MODULE_DEFS>) {
      const def = MODULE_DEFS[kind];
      // Zatím máme jen solar_array.png — ostatní load selže tiše a renderSegment
      // si to ohlídá přes cache.exists(). Až přijdou další assety, jen je doplníš.
      this.load.image(kind, `assets/modules/${def.asset}`);
    }
    // Tile assety (ne-moduly) — floor pro prázdný tile atd.
    // Klíč "tile_floor" = podlaha bez modulu.
    this.load.image("tile_floor", "assets/tiles/floor.png");

    // Potlač chyby při chybějícím souboru — máme jen jeden asset zatím.
    this.load.on("loaderror", () => {
      // Silent skip — Phaser cache.exists() to odfiltruje.
    });
  }

  create(): void {
    this.world = createInitialWorld();

    this.createHud();
    this.createActorsZone();
    this.createSegment();
    this.createTaskQueueZone();
    this.createLog();
    this.bindDebugKeys();
  }

  // === HUD (top bar) =======================================================

  private createHud(): void {
    this.add
      .rectangle(0, 0, CANVAS_W, HUD_H, 0x000000, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COL_ZONE_BORDER);

    this.hudText = this.add.text(16, 18, "", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_HUD,
      color: COL_TEXT,
    });
  }

  // === Actors (left column) ================================================

  private createActorsZone(): void {
    this.add
      .rectangle(ACTORS_X, MID_Y, ACTORS_W, MID_H, 0x000000, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COL_ZONE_BORDER);

    this.add.text(ACTORS_X + 10, MID_Y + 8, "ACTORS", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_ZONE_LABEL,
    });

    // Dynamický seznam actors — renderActors() přepisuje per frame.
    this.actorsText = this.add.text(ACTORS_X + 10, MID_Y + 40, "", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_TEXT,
      lineSpacing: 6,
    });
  }

  // === Segment (center, 8×2 tiles) =========================================

  private createSegment(): void {
    // Žádný rámeček kolem segmentu ani kolem tile — ať je vidět jen obsah (sprity).
    // Tile rect je plně průhledný, slouží už jen jako hit-area pro klik.
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col;
        const x = SEGMENT_X + col * TILE_PX;
        const y = SEGMENT_Y + row * TILE_PX;

        const rect = this.add
          .rectangle(x, y, TILE_PX, TILE_PX, 0x000000, 0) // fill alpha 0 = neviditelné
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        rect.on("pointerdown", () => this.selectTile(idx));
        this.tileRects[idx] = rect;
      }
    }

    // Selection overlay — zatím skrytý, pozicuje se v renderSegment().
    this.selectionOverlay = this.add
      .rectangle(0, 0, TILE_PX, TILE_PX, 0x000000, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COL_TILE_SELECTED)
      .setDepth(20)
      .setVisible(false);
  }

  // === TaskQueue + Inspector (right column) ================================

  private createTaskQueueZone(): void {
    this.add
      .rectangle(TASKQUEUE_X, MID_Y, TASKQUEUE_W, MID_H, 0x000000, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COL_ZONE_BORDER);

    this.add.text(TASKQUEUE_X + 10, MID_Y + 8, "TASK QUEUE", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_ZONE_LABEL,
    });
    // Dynamický task list — renderTaskQueue() přepisuje per frame.
    this.taskQueueText = this.add.text(TASKQUEUE_X + 10, MID_Y + 40, "", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_TEXT,
      wordWrap: { width: TASKQUEUE_W - 20 },
      lineSpacing: 4,
    });

    const divY = MID_Y + MID_H / 2;
    this.add.line(TASKQUEUE_X, divY, 0, 0, TASKQUEUE_W, 0, COL_ZONE_BORDER).setOrigin(0, 0);

    this.add.text(TASKQUEUE_X + 10, divY + 8, "INSPECTOR", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_ZONE_LABEL,
    });

    // Dynamický text — refresh v renderInspector(). Word wrap, ať se popis vejde.
    this.inspectorText = this.add.text(TASKQUEUE_X + 10, divY + 32, "", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_TEXT,
      wordWrap: { width: TASKQUEUE_W - 20 },
      lineSpacing: 4,
    });
  }

  // === Log (bottom bar) ====================================================

  private createLog(): void {
    const logY = CANVAS_H - LOG_H;
    this.add
      .rectangle(0, logY, CANVAS_W, LOG_H, 0x000000, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COL_ZONE_BORDER);

    this.add.text(16, logY + 8, "LOG", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_ZONE_LABEL,
    });

    this.add.text(
      16,
      logY + 28,
      "[SPACE] start  klikni damaged tile = repair task  [R/E/W] skip phase  [F5] new",
      {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_HINT,
        color: COL_TEXT_DIM,
      }
    );
  }

  // === Debug klávesy =======================================================

  private bindDebugKeys(): void {
    const kb = this.input.keyboard;
    kb?.on("keydown-SPACE", () => startGame(this.world));
    kb?.on("keydown-R", () => repairDone(this.world));
    kb?.on("keydown-E", () => dockComplete(this.world));
    kb?.on("keydown-W", () => endDay(this.world));
  }

  // === Klik na tile → Inspector ============================================

  private selectTile(idx: number): void {
    this.selectedTileIdx = idx;
    // Damaged tile = klik je zároveň enqueue repair task. Idempotent —
    // druhý klik na ten samý damaged nic nepřidá. Empty/module_ref tile = jen select.
    const tile = this.world.segment[idx];
    if (tile?.kind === "damaged") {
      enqueueRepairTask(this.world, idx);
    }
  }

  // === Tick loop + render ==================================================

  override update(_time: number, delta: number): void {
    this.accumulator += delta;
    while (this.accumulator >= TICK_MS) {
      stepWorld(this.world);
      this.accumulator -= TICK_MS;
    }

    this.renderHud();
    this.renderSegment();
    this.renderActors();
    this.renderTaskQueue();
    this.renderInspector();
  }

  // === Render Actors a Task Queue (S11 task engine) ========================

  private renderActors(): void {
    if (!this.actorsText) return;
    // Kompaktní řádek per actor: ▸ id (kind power) state. Working má za sebou taskId.
    const lines = this.world.actors.map((a: Actor) => {
      const def = ACTOR_DEFS[a.kind];
      const tag = a.state === "working" ? `→ ${a.taskId ?? "?"}` : "idle";
      // Padding aby state sloupec lícoval. id má max 6 znaků (player), pad pravý.
      const idCell = a.id.padEnd(7);
      return `${idCell}${def.power_w}W  ${tag}`;
    });
    this.actorsText.setText(lines);
  }

  private renderTaskQueue(): void {
    if (!this.taskQueueText) return;
    const tasks = this.world.tasks;
    if (tasks.length === 0) {
      this.taskQueueText.setText("— prázdno —");
      this.taskQueueText.setColor(COL_TEXT_DIM);
      return;
    }
    // Per task: id + kind + target + progress %. KISS, žádné drag&drop ani cancel.
    const lines = tasks.flatMap((t: Task) => {
      const pct = Math.min(100, (t.wd_done / t.wd_total) * 100);
      const target =
        t.target.tileIdx !== undefined ? `tile ${t.target.tileIdx}` : "—";
      const bar = renderBar(pct, 12);
      return [
        `${t.id}  ${t.kind}  ${target}`,
        `  ${bar} ${pct.toFixed(0)}%  (${t.assigned.length}× actor)`,
      ];
    });
    this.taskQueueText.setText(lines);
    this.taskQueueText.setColor(COL_TEXT);
  }

  private renderHud(): void {
    if (!this.hudText) return;
    const w = this.world;
    const wallSec = (w.tick * TICK_MS) / 1000;

    const line = [
      `⊙ VOIDSPAN`,
      `AIR ${w.resources.air.toFixed(1).padStart(5)}%`,
      `FOOD ${w.resources.food.toFixed(1).padStart(5)}`,
      `KREDO ${String(w.resources.kredo).padStart(3)}`,
      `TICK ${String(w.tick).padStart(4)}`,
      `${wallSec.toFixed(1)}s`,
      `// ${phaseLabel(w.phase)}${w.loss_reason ? ` (${w.loss_reason})` : ""}`,
    ].join("   ");
    this.hudText.setText(line);
  }

  private renderSegment(): void {
    for (let i = 0; i < 16; i++) {
      const tile = this.world.segment[i];
      const rect = this.tileRects[i];
      if (!rect || !tile) continue;

      if (tile.kind === "damaged") {
        // Damaged bez assetu zatím — červená poloprůhledná vrstva přes rect.
        rect.setFillStyle(COL_TILE_DAMAGED, 0.6);
        this.removeSprite(i);
      } else if (tile.kind === "empty") {
        rect.setFillStyle(0x000000, 0); // průhledné pozadí, sprite je celý obsah
        this.drawTileSprite(i, "tile_floor");
      } else if (tile.kind === "module_ref") {
        rect.setFillStyle(0x000000, 0);
        this.drawTileSprite(i, this.world.modules[tile.moduleId]?.kind ?? "");
      }
    }

    // Umísti selection overlay na vybraný tile, nebo schovej.
    if (this.selectionOverlay) {
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
  }

  // Vykreslí nebo aktualizuje sprite na tile pozici. `textureKey` = Phaser cache klíč.
  // Pokud textura neexistuje nebo je key prázdný, skryje existující sprite.
  private drawTileSprite(tileIdx: number, textureKey: string): void {
    if (!textureKey || !this.textures.exists(textureKey)) {
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
      sprite = this.add.image(x, y, textureKey).setScale(TILE_SCALE).setDepth(5);
      this.tileSprites[tileIdx] = sprite;
    } else {
      sprite.setTexture(textureKey).setVisible(true);
    }
  }

  private removeSprite(tileIdx: number): void {
    const sprite = this.tileSprites[tileIdx];
    if (sprite) sprite.setVisible(false);
  }

  private renderInspector(): void {
    if (!this.inspectorText) return;
    const idx = this.selectedTileIdx;

    if (idx === null) {
      this.inspectorText.setText("— nic není vybráno —");
      this.inspectorText.setColor(COL_TEXT_DIM);
      return;
    }

    const tile = this.world.segment[idx];
    if (!tile) return;

    const row = Math.floor(idx / 8);
    const col = idx % 8;
    const pos = `tile ${idx} (r${row} c${col})`;

    if (tile.kind === "empty") {
      this.inspectorText.setText(`${pos}\n\nEmpty\nŽádný modul ani poškození.`);
      this.inspectorText.setColor(COL_TEXT_DIM);
      return;
    }

    if (tile.kind === "damaged") {
      this.inspectorText.setText(`${pos}\n\nDamaged hull\nWD to repair: ${tile.wd_to_repair}`);
      this.inspectorText.setColor(COL_TEXT_ACCENT);
      return;
    }

    if (tile.kind === "module_ref") {
      const mod = this.world.modules[tile.moduleId] as Module | undefined;
      if (!mod) {
        this.inspectorText.setText(`${pos}\n\n[chyba: modul ${tile.moduleId} neexistuje]`);
        return;
      }
      const def = MODULE_DEFS[mod.kind];
      const lines = [
        pos,
        "",
        `${def.label}  ${def.w}×${def.h}`,
        `status: ${mod.status}`,
        `HP: ${mod.hp} / ${def.max_hp}`,
        `power: ${def.power_w > 0 ? "+" : ""}${def.power_w} W`,
        `build: ${def.wd_to_build} WD · ${def.cost_kredo} Kredo`,
        "",
        def.description,
      ];
      this.inspectorText.setText(lines);
      this.inspectorText.setColor(COL_TEXT);
    }
  }
}

// ASCII progress bar pro task queue. width = počet znaků celkem.
// Příklad: renderBar(50, 10) → "█████░░░░░"
function renderBar(pct: number, width: number): string {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}
