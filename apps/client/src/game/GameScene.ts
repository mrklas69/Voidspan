// GameScene — hlavní herní scéna P1 POC.
// S10 scope: §16 UI kostra + první asset (SolarArray sprite) + klikatelný Inspector.
// Model-first: všechny zóny čtou z `this.world`. Tile 40×40 native × 2× = 80×80 na canvasu.

import Phaser from "phaser";
// Verze z package.json — jediný zdroj pravdy, drží HUD v sync s balíčkem.
import pkg from "../../package.json";
import { formatResource, formatScalar } from "./format";
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
  enqueueRepairTask,
  formatGameTime,
  TICK_MS,
} from "./world";
import type { World, Module, Task } from "./model";
import { MODULE_DEFS, ACTOR_DEFS } from "./model";
import {
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
  UI_PANEL_BG,
  UI_BORDER_DIM,
  UI_BRAND_ICON,
  UI_DOT_ONLINE,
  UI_DOT_NPC,
  UI_DOT_WORKING,
  UI_DOT_WARN,
  UI_DOT_ALERT,
  UI_DOT_IDLE,
  FONT_FAMILY,
  FONT_SIZE_HUD,
  FONT_SIZE_LABEL,
  FONT_SIZE_HINT,
  FONT_SIZE_PANEL_HEADER,
} from "./palette";

// === Layout konstanty §16 (1280×720 canvas) ===

const CANVAS_W = 1280;
const CANVAS_H = 720;

// HUD = 1-řádkový Top Bar — identity + čas + resource bars + Help.
const HUD_H = 60;
const HUD_ROW_Y = 18;
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
// Boční panely — UI_BG semantika (palette[13] bg-near-black · panely).
const COL_PANEL_BG = UI_PANEL_BG;
const COL_TILE_SELECTED = UI_SELECT_STROKE;
const COL_TEXT = UI_TEXT_PRIMARY;
const COL_TEXT_DIM = UI_TEXT_DIM;
const COL_TEXT_ACCENT = UI_TEXT_ACCENT;

export class GameScene extends Phaser.Scene {
  private world!: World;
  private accumulator = 0;

  // Header (Top Bar) — 2 řádky. Row 1: ikona + AppName + meta + Help.
  // Row 2: 5 resource bars (E, W, S, F, ◎).
  private headerIconText?: Phaser.GameObjects.Text;
  private headerAppText?: Phaser.GameObjects.Text;
  private headerMetaText?: Phaser.GameObjects.Text;
  private headerRightText?: Phaser.GameObjects.Text;
  private headerResourceTexts: Phaser.GameObjects.Text[] = [];

  // Actors — per-řádek dvojice Text objektů: {dot, name}. Dot barevně per status.
  private actorRows: Array<{ dot: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text }> = [];
  private taskQueueText?: Phaser.GameObjects.Text;

  // Segment — pozadí rectangle + sprite (volitelný) per tile.
  private tileRects: Phaser.GameObjects.Rectangle[] = [];
  private tileSprites: (Phaser.GameObjects.Image | undefined)[] = [];

  // Inspector — klikem zvolený tile idx.
  private selectedTileIdx: number | null = null;
  private inspectorText?: Phaser.GameObjects.Text;

  // Překryv výběru — jeden rect nad spritem, přesouváme ho na selected tile.
  private selectionOverlay?: Phaser.GameObjects.Rectangle;

  // Tooltip manager — single instance per scene, attach přes hover.
  private tooltips!: TooltipManager;

  // Modal manager — centrovaný dialog (Help, budoucí menu).
  private modal!: ModalManager;

  // Background system — chunk-based procedural hvězdy/clusters/DSO.
  // Pozadí je v samostatném Containeru, posouváme ho po ose Y nezávisle na UI.
  private background!: BackgroundSystem;
  private cameraY = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

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
    this.load.image("tile_floor_damaged", "assets/tiles/floor_damaged.png");

    // Orbitální dekor — asteroid prochází nad segmentem.
    this.load.image("asteroid2", "assets/sprites/asteroid2.png");

    // Potlač chyby při chybějícím souboru — máme jen jeden asset zatím.
    this.load.on("loaderror", () => {
      // Silent skip — Phaser cache.exists() to odfiltruje.
    });
  }

  create(): void {
    this.world = createInitialWorld();

    this.tooltips = new TooltipManager(this);
    this.modal = new ModalManager(this);

    // Hvězdné pozadí — samostatný Container, scroll po ose Y nezávisle na UI.
    // Viewport = mid zone (výška MID_H). Šipky ↑ ↓ posunují cameraY + update.
    this.background = new BackgroundSystem(this, CANVAS_W, MID_H);
    this.background.update(this.cameraY);

    // Asteroid v orbitě — střed horizontálně, dlouhý oběh.
    createAsteroidOrbit(this, CANVAS_W / 2, CANVAS_H);

    this.createHeader();
    this.createActorsZone();
    this.createSegment();
    this.createTaskQueueZone();
    this.createLog();
    this.bindDebugKeys();

    this.attachTooltips();
  }

  // === Tooltips — hover nápovědy napříč UI =================================
  // Jeden manager, per-element provider. Text je dynamický (provider volaný
  // při hover), takže se mění podle stavu světa (např. tile kind).

  private attachTooltips(): void {
    // --- Top Bar ---
    const leftTooltipProvider = () =>
      `Identita / adresa / herní čas\n\nVersion: v${pkg.version}\nBelt day = 16 game hours\nTick = 1 game minute\nLOSS triggers highlight inline`;
    if (this.headerIconText) this.tooltips.attach(this.headerIconText, leftTooltipProvider);
    if (this.headerAppText) this.tooltips.attach(this.headerAppText, leftTooltipProvider);
    if (this.headerMetaText) this.tooltips.attach(this.headerMetaText, leftTooltipProvider);

    // --- Resource bars tooltips — s kvantifikací subtypů ---
    // Demo čísla (dokud world.ts není přepsaný na nový model).
    const resourceTooltips: Array<() => string> = [
      () =>
        "Energy — baterie pásu [E]\n" +
        "0.15 / 12 E  (1.2 %)\n\n" +
        "Výroba:  +0.30 E/tick  (2× SolarArray)\n" +
        "Spotřeba: -0.15 E/tick\n" +
        "Trend: +0.15 E/tick (nabíjí)",
      () =>
        "Work — pracovní kapacita [W]\n" +
        "18 / 32 W  (56 %)\n\n" +
        "Player:       8 W  (idle)\n" +
        "Constructor:  3×12 = 36 W\n" +
        "Hauler:       2×8 = 16 W\n" +
        "Working nyní: 18 W (2 aktéři)",
      () =>
        "Slab — pevné materiály [S]\n" +
        "45 / 100 S  (45 %)\n\n" +
        "  Food:         40\n" +
        "  Metal:         5\n" +
        "  Components:    0\n\n" +
        "Spotřeba: 8 food/game day\n" +
        "(8 osob × 1 food/den)",
      () =>
        "Flux — kapaliny + plyny [F]\n" +
        "80 / 120 F  (67 %)\n\n" +
        "  Air:        60\n" +
        "  Water:      15\n" +
        "  Coolant:     5\n\n" +
        "Breach = utíká Flux!",
      () =>
        "Coin [◎] — měna\n" +
        "◎ 20\n\n" +
        "Reprezentuje všechny platby,\n" +
        "mzdy, směnu, tržní operace.\n" +
        "Dock cost: ◎ 20\n\n" +
        "Income/expense history (P2+).",
    ];
    for (let i = 0; i < this.headerResourceTexts.length; i++) {
      const t = this.headerResourceTexts[i];
      const provider = resourceTooltips[i];
      if (t && provider) this.tooltips.attach(t, provider);
    }
    if (this.headerRightText) {
      this.tooltips.attach(
        this.headerRightText,
        () =>
          "Shortcuts\n\n[SPACE]  start sim\n[R]      debug: repair done\n[E]      debug: dock complete\n[W]      debug: end day\n[F5]     nový svět\nClick damaged tile = enqueue repair",
      );
    }

    // --- Actors zone (per-row) ---
    const actorsProvider = () => {
      const w = this.world;
      const idle = w.actors.filter((a) => a.state === "idle").length;
      const working = w.actors.filter((a) => a.state === "working").length;
      return `Kolonisté\n\nTotal: ${w.actors.length}\nIdle: ${idle}\nWorking: ${working}\n\nAuto-assign na nejbližší task.\nKlik na řádek = detail (P2+).`;
    };
    for (const row of this.actorRows) {
      this.tooltips.attach(row.dot, actorsProvider);
      this.tooltips.attach(row.name, actorsProvider);
    }

    // --- Task Queue zone (whole block) ---
    if (this.taskQueueText) {
      this.tooltips.attach(this.taskQueueText, () => {
        const w = this.world;
        const count = w.tasks.length;
        return `Úkoly\n\nV queue: ${count}\nProgress = WD done / total\n1 Constructor (12 W) = 12 WD / game day\n\nKlik damaged tile = enqueue repair.`;
      });
    }

    // --- Tile rects (16× dynamic per kind) ---
    for (let i = 0; i < this.tileRects.length; i++) {
      const rect = this.tileRects[i];
      if (!rect) continue;
      this.tooltips.attach(rect, () => this.tileTooltipText(i));
    }
  }

  private tileTooltipText(idx: number): string | null {
    const tile = this.world.segment[idx];
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
    const mod = this.world.modules[tile.moduleId];
    const modName = mod?.kind ?? "?";
    return `${pos}\n\nModule: ${modName}\nStatus: ${mod?.status ?? "?"}`;
  }

  // === Header (Top Bar) ====================================================
  // Vytvoří oba texty se stejným stylem. Obsah plní renderHeader() per tick —
  // tím se eliminuje font-flicker při načítání VT323 (oba texty se re-renderují
  // ve stejné kadenci, ne jen ten dynamický).

  private createHeader(): void {
    const baseStyle = {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_HUD,
    };
    // --- Row 1: ikona + AppName + meta + Help ---
    this.headerIconText = this.add.text(16, HUD_ROW_Y, "", {
      ...baseStyle,
      color: UI_BRAND_ICON,
    });
    this.headerAppText = this.add.text(0, HUD_ROW_Y, "", {
      ...baseStyle,
      color: COL_TEXT_ACCENT,
    });
    this.headerMetaText = this.add.text(0, HUD_ROW_Y, "", {
      ...baseStyle,
      color: COL_TEXT_DIM,
    });
    this.headerRightText = this.add
      .text(CANVAS_W - 16, HUD_ROW_Y, "", { ...baseStyle, color: COL_TEXT })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.headerRightText.on("pointerdown", () => this.openHelpModal());

    // 5× resource Text — inline za meta, pozice se přepočítá v renderHeader
    // podle aktuálních šířek (metrics se mění se setText).
    for (let i = 0; i < 5; i++) {
      const t = this.add.text(0, HUD_ROW_Y, "", {
        ...baseStyle,
        color: COL_TEXT,
      });
      this.headerResourceTexts.push(t);
    }
  }

  private openHelpModal(): void {
    this.modal.open({
      title: "Help",
      body:
        "Shortcuts\n" +
        "\n" +
        "[SPACE]  start simulation\n" +
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

  // === Panel header helper — bigger font + underline =======================
  // Odlišuje hlavičky bočních panelů (ACTORS / TASK QUEUE / INSPECTOR).
  // Vrací Y pod podtržením — callers tam umístí první řádek obsahu.

  private createPanelHeader(x: number, y: number, text: string, width: number): number {
    this.add.text(x, y, text, {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_PANEL_HEADER,
      color: COL_TEXT_ACCENT,
    });
    // Podtržení — tenká linka pod labelem v dim barvě.
    const underlineY = y + 26;
    this.add.rectangle(x, underlineY, width, 1, UI_BORDER_DIM).setOrigin(0, 0);
    return underlineY + 6; // padding pod podtržením
  }

  // === Actors (left column) ================================================

  private createActorsZone(): void {
    // Subtle bg fill — odliší zónu od canvas pozadí bez rámečku.
    this.add
      .rectangle(ACTORS_X, MID_Y, ACTORS_W, MID_H, COL_PANEL_BG, 0.85)
      .setOrigin(0, 0);

    const contentY = this.createPanelHeader(ACTORS_X + 10, MID_Y + 8, "ACTORS", ACTORS_W - 20);

    // Per-řádek dvojice: kulička ● (barevná) + jméno actora (amber).
    // Počet řádků odpovídá actors ve světě. Kulička jako text, ne graphics —
    // vyhýbá se mixu text/grafika, čistý Phaser.Text + color.
    const rowH = 26; // VT323 18px + padding
    for (let i = 0; i < this.world.actors.length; i++) {
      const y = contentY + 4 + i * rowH;
      const dot = this.add.text(ACTORS_X + 10, y, "●", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_LABEL,
        color: UI_DOT_IDLE,
      });
      const name = this.add.text(ACTORS_X + 10 + 18, y, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_LABEL,
        color: COL_TEXT,
      });
      this.actorRows.push({ dot, name });
    }
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
    // Subtle bg fill — odliší zónu od canvas pozadí bez rámečku.
    this.add
      .rectangle(TASKQUEUE_X, MID_Y, TASKQUEUE_W, MID_H, COL_PANEL_BG, 0.85)
      .setOrigin(0, 0);

    const contentY = this.createPanelHeader(
      TASKQUEUE_X + 10,
      MID_Y + 8,
      "TASK QUEUE",
      TASKQUEUE_W - 20,
    );
    // Dynamický task list — renderTaskQueue() přepisuje per frame.
    this.taskQueueText = this.add.text(TASKQUEUE_X + 10, contentY + 4, "", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_TEXT,
      wordWrap: { width: TASKQUEUE_W - 20 },
      lineSpacing: 4,
    });

    const divY = MID_Y + MID_H / 2;
    const inspectorContentY = this.createPanelHeader(
      TASKQUEUE_X + 10,
      divY + 8,
      "INSPECTOR",
      TASKQUEUE_W - 20,
    );

    // Dynamický text — refresh v renderInspector(). Word wrap, ať se popis vejde.
    this.inspectorText = this.add.text(TASKQUEUE_X + 10, inspectorContentY + 4, "", {
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
    // Event log ticker — centrovaný obsah, bez labelu (per UI Layout axiom).
    this.add
      .text(
        CANVAS_W / 2,
        logY + LOG_H / 2,
        "[SPACE] start  [L] asteroid  [↑↓] scroll bg (test)  [R/E/W] skip phase  [F5] new",
        {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_HINT,
          color: COL_TEXT_DIM,
        },
      )
      .setOrigin(0.5, 0.5);
  }

  // === Debug klávesy =======================================================

  private bindDebugKeys(): void {
    const kb = this.input.keyboard;
    kb?.on("keydown-SPACE", () => startGame(this.world));
    kb?.on("keydown-R", () => repairDone(this.world));
    kb?.on("keydown-E", () => dockComplete(this.world));
    kb?.on("keydown-W", () => endDay(this.world));
    kb?.on("keydown-L", () => launchRandomAsteroid(this, CANVAS_W / 2));
    // Šipky ↑ ↓ — test pozadí: scroll cameraX, BackgroundSystem dogeneruje chunks.
    // Později se toto přepojí na pohyb podél pásu.
    this.cursors = kb?.createCursorKeys();
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

    // Background scroll test — šipky ↑ ↓ posunují cameraY pozadí nezávisle na UI.
    // 400 px/s kadence. Směr: ↑ = cameraY klesá (obsah nahoru odplouvá), ↓ opačně.
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

    this.renderHeader();
    this.renderSegment();
    this.renderActors();
    this.renderTaskQueue();
    this.renderInspector();
  }

  // === Render Actors a Task Queue (S11 task engine) ========================

  private renderActors(): void {
    // Demo mapping barevných kuliček — každý actor ukazuje jinou barvu pro
    // vizuální ladění (A1: demo všech barev). Produkční sémantika přijde
    // s reálnými statusy (online/NPC/warn/alert).
    const demoColors = [
      UI_DOT_ONLINE,   // player
      UI_DOT_WORKING,  // c1
      UI_DOT_NPC,      // c2
      UI_DOT_WARN,     // c3
      UI_DOT_ALERT,    // h1
      UI_DOT_IDLE,     // h2
    ];
    for (let i = 0; i < this.world.actors.length; i++) {
      const a = this.world.actors[i];
      const row = this.actorRows[i];
      if (!a || !row) continue;
      const def = ACTOR_DEFS[a.kind];
      const tag = a.state === "working" ? `→ ${a.taskId ?? "?"}` : "idle";
      const idCell = a.id.padEnd(7);
      row.dot.setColor(demoColors[i % demoColors.length] ?? UI_DOT_IDLE);
      row.name.setText(`${idCell}${def.power_w}W  ${tag}`);
    }
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

  private renderHeader(): void {
    if (
      !this.headerIconText ||
      !this.headerAppText ||
      !this.headerMetaText ||
      !this.headerRightText
    )
      return;
    const w = this.world;
    const time = formatGameTime(w.tick);

    // Všechny segmenty header-u procházejí setText každý tick, ať font-load
    // stabilně chytne celou řadu najednou.
    this.headerIconText.setText("⊙");
    this.headerAppText.setX(this.headerIconText.x + this.headerIconText.width);
    this.headerAppText.setText("VOIDSPAN");
    this.headerMetaText.setX(this.headerAppText.x + this.headerAppText.width + 8);
    this.headerMetaText.setText(
      `v${pkg.version} Teegarden.Belt1.Seg042 ${time}${w.loss_reason ? ` // LOSS (${w.loss_reason})` : ""}`,
    );
    this.headerRightText.setText("Help");

    // Resource bary (demo seedy — dokud world.ts nepřepíšeme na nový model).
    // TODO: napojit na w.resources.energy/work/slab/flux/coin.
    const parts: string[] = [
      formatResource(0.15, 12, "E"),
      formatResource(18, 32, "W"),
      formatResource(45, 100, "S"),
      formatResource(80, 120, "F"),
      `◎ ${formatScalar(20)}`,
    ];
    // Inline za meta, gap 24 px mezi položkami.
    let x = this.headerMetaText.x + this.headerMetaText.width + 32;
    for (let i = 0; i < parts.length; i++) {
      const t = this.headerResourceTexts[i];
      if (!t) continue;
      t.setX(x);
      t.setText(parts[i]);
      x += t.width + 24;
    }
  }

  private renderSegment(): void {
    for (let i = 0; i < 16; i++) {
      const tile = this.world.segment[i];
      const rect = this.tileRects[i];
      if (!rect || !tile) continue;

      if (tile.kind === "damaged") {
        // Damaged tile = floor_damaged asset (textura trhliny) + tenký červený
        // stroke jako status-signál (urgentnost nese UI, ne asset sám).
        rect.setFillStyle(0x000000, 0);
        this.drawTileSprite(i, "tile_floor_damaged");
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
