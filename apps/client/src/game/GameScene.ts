// GameScene — hlavní herní scéna P1 POC.
// Orchestrator: vytváří panely (Header / Segment / Actors / SideRight / Log),
// drží World model a tick loop. Veškerá prezentace je v `ui/*.ts`.
// Model-first: world = jediný zdroj pravdy, panely čtou přes closures.

import Phaser from "phaser";
import { TooltipManager } from "./tooltip";
import { ModalManager } from "./modal";
import {
  shouldShowTerminal,
  markTerminalDismissed,
  TERMINAL_TITLE,
  buildTerminalBody,
} from "./terminal";
import { BackgroundSystem, preloadM110 } from "./background";
import {
  createInitialWorld,
  stepWorld,
  TICK_MS,
} from "./world";
import type { World } from "./model";
import { EventLogPanel } from "./event_log";
import { InfoPanel } from "./info_panel";
import { ModulesPanel } from "./modules_panel";
import { TaskQueuePanel } from "./task_queue";
import { FONT_FAMILY, FONT_SIZE_CHROME } from "./palette";
import * as L from "./ui/layout";
import { COL_TEXT_DIM, recomputeLayout, setSegmentX } from "./ui/layout";
import { dockManager } from "./ui/dock_manager";
import { HeaderPanel } from "./ui/header";
import { ShipRender } from "./ui/ship_render";
// S19: ActorsPanel (ui/actors.ts) skrytý — detail bay/modulu jen v hover tooltipu.
// SideRightPanel retirován v S28 (dead code s layered bay refs).
// Až budeme řešit layer 3.5 Floating workspace, vrátí se jako toggle panel [K].

export class GameScene extends Phaser.Scene {
  private world!: World;
  private accumulator = 0;
  // S19 test: camera scroll po ose Y přes šipky — manuální test průhlednosti pozadí.
  private cameraY = 0;

  private tooltips!: TooltipManager;
  private modal!: ModalManager;
  private background!: BackgroundSystem;

  private header!: HeaderPanel;
  private segment!: ShipRender;
  private eventLog!: EventLogPanel;
  private taskQueue!: TaskQueuePanel;
  private infoPanel!: InfoPanel;
  private modulesPanel!: ModulesPanel;

  // S24: Bottom Bar command buttons — drženy jako array, re-pozicovatelné při resize.
  private logCmdTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: "game" });
  }

  // === Preload: Tabler SVG ikony + DSO ======================================

  preload(): void {
    // S35 Tabler icons — 8 kind glyphs + 1 fallback (cube). SVG rasterizace
    // v Phaser 3.60+ je lossless, výstup tintable přes setTint (stroke="#ffffff"
    // v SVG → tint × white = tint). Scale 2 = 48×48 raster, dost na 40 px bay.
    const TABLER_ICONS: Array<[string, string]> = [
      ["icon:Habitat", "home"],
      ["icon:SolarArray", "solar-panel"],
      ["icon:Storage", "package"],
      ["icon:Assembler", "hammer"],
      ["icon:Dock", "anchor"],
      ["icon:Engine", "engine"],
      ["icon:MedCore", "first-aid-kit"],
      ["icon:CommandPost", "broadcast"],
      ["icon:fallback", "cube"],
    ];
    for (const [key, name] of TABLER_ICONS) {
      this.load.svg(key, `assets/icons/${name}.svg`, { scale: 2 });
    }
    // Module PNG assety retirovány v S36 — ShipRender kreslí procedurálně přes
    // Phaser.Graphics + Tabler SVG glyphy. Starý PNG pipeline (8 modulů,
    // bay_construction fallback, skeleton/cover z S28) v git history.
    // Asteroid sprite retirován — viz IDEAS „Asteroid system (P2+)".

    // M-110 (S32) — eliptická satelitní galaxie, 1 SVG part. Iterace po
    // zkušenosti s plnou M-31 kompozicí (přeplněná — KISS redukce).
    preloadM110(this);

    // Potlač chyby při chybějícím souboru.
    this.load.on("loaderror", () => {
      // Silent skip — textures.exists() to odfiltruje.
    });
  }

  create(): void {
    this.world = createInitialWorld();

    // S24: spočítej responsive layout podle aktuálního viewportu PŘED vytvořením panelů.
    recomputeLayout(this.scale.width, this.scale.height);

    // Dev-only: vystav world do window, ať jde debugovat v DevTools (Console: __world).
    if (import.meta.env.DEV) {
      (window as unknown as { __world: World }).__world = this.world;
    }

    this.tooltips = new TooltipManager(this);
    this.modal = new ModalManager(this);

    // Hvězdné pozadí — samostatný Container, 2D chunks, reaktivní setSize při resize.
    this.background = new BackgroundSystem(this, L.CANVAS_W, L.CANVAS_H);
    this.background.update(0);

    // --- Panely ---
    const getWorld = () => this.world;
    this.header = new HeaderPanel(this, getWorld);
    this.segment = new ShipRender(this, getWorld);
    this.eventLog = new EventLogPanel(this, getWorld);
    this.taskQueue = new TaskQueuePanel(this, getWorld);
    this.infoPanel = new InfoPanel(this, getWorld);
    this.modulesPanel = new ModulesPanel(this, getWorld);

    // S29: mutex pairs zrušeny (dříve I↔M a E↔T) — všechny 4 panely mohou být
    // otevřené současně ve 2×2 gridu (I vlevo nahoře, M vlevo dole, E vpravo
    // nahoře, T vpravo dole). DockManager BELT re-centering zachován.

    // Initial dock override — pokud panely otevřené z LS prefs, BELT se hned re-centruje.
    setSegmentX(dockManager.getSegmentX());
    this.segment.relayout();

    this.createLog();
    this.bindDebugKeys();

    // Tooltips — každý panel si attach sám po vytvoření všech elementů.
    this.header.attachTooltips(this.tooltips);
    this.segment.attachTooltips(this.tooltips);
    this.infoPanel.attachTooltips(this.tooltips);
    this.modulesPanel.attachTooltips(this.tooltips);
    this.eventLog.attachTooltips(this.tooltips);
    this.taskQueue.attachTooltips(this.tooltips);

    // S24: resize handler — recomputeLayout + relayout všech panelů.
    this.scale.on("resize", this.handleResize, this);

    // QM Terminal (S32) — onboarding modal, nahrazuje Welcome dialog. Auto-open
    // pro prvního návštěvníka; user ho pak může kdykoli otevřít přes [Q].
    // Neblokuje simulaci (axiom S19 — modal overlay, čas běží dál).
    if (shouldShowTerminal()) {
      this.openTerminalModal();
    }
  }

  // === Globální ESC handler (F5) ============================================
  // Pořadí priority: modal (Help nebo QM Terminal, S32 sdílejí ModalManager) →
  // floating panely (M/I/E/T). Lokální ESC listenery v Modal odebrány — jeden
  // handler řídí vše.
  private handleEscape(): void {
    if (this.modal.isOpen()) { this.modal.closeFromEsc(); return; }
    if (this.modulesPanel.isOpen()) { this.modulesPanel.close(); return; }
    if (this.infoPanel.isOpen()) { this.infoPanel.close(); return; }
    if (this.taskQueue.isOpen()) { this.taskQueue.close(); return; }
    if (this.eventLog.isOpen()) { this.eventLog.close(); return; }
  }

  // S24: resize handler. Jen ty panely, které reálně přesouvají něco dle CANVAS_W/H:
  // - background: dogenerujeme chunks do nové plochy
  // - segment: BELT se re-centruje (SEGMENT_X/Y se mění)
  // - eventLog: je v pravém rohu (CANVAS_W se mění)
  // - bottom command bar: je centrovaný (CANVAS_W se mění)
  // HeaderPanel render() čte CANVAS_W každý frame → nepotřebuje relayout.
  // InfoPanel je v levém rohu (x = MARGIN fix) → nepotřebuje relayout.
  private handleResize(gameSize: Phaser.Structs.Size): void {
    recomputeLayout(gameSize.width, gameSize.height);
    // Po recompute baseline aplikuj dock override (BELT centering podle otevřených panelů).
    setSegmentX(dockManager.getSegmentX());
    this.background.setSize(L.CANVAS_W, L.CANVAS_H);
    this.segment.relayout();
    this.eventLog.relayout();
    this.taskQueue.relayout();
    this.layoutLogCommands();
  }

  // === Help modal trigger (Top Bar) ========================================

  private openHelpModal(): void {
    this.modal.open({
      title: "Nápověda",
      bodyLeft:
        "Klávesnice:\n" +
        "  [WASD]  pohyb kurzorem po trupu\n" +
        "  [I]     panel Stav\n" +
        "  [M]     panel Moduly\n" +
        "  [E]     panel Události\n" +
        "  [T]     panel Úkoly\n" +
        "  [Q]uery QM terminál\n" +
        "  [H]     tato nápověda\n" +
        "  [ESC]   zavřít dialog\n" +
        "\n" +
        "Myš / dotyk:\n" +
        "  Klik na políčko   výběr\n" +
        "  Hover / long-tap  tooltip\n" +
        "  Kolečko / drag    scroll panelu",
      bodyRight:
        "Co sleduješ:\n" +
        "  Top bar     pět os zdrojů\n" +
        "  Střed       16 políček trupu\n" +
        "  Události    kronika kolonie\n" +
        "  Úkoly       fronta QuarterMastera\n" +
        "\n" +
        "Kolonie běží bez tebe.\n" +
        "Nemusíš nic řešit. Pozoruj,\n" +
        "jak autopilot drží systém naživu.",
    });
  }

  // QM Terminal modal — onboarding briefing od QuarterMastera. Volá se auto při
  // prvním spuštění (shouldShowTerminal = LS flag false) a manuálně přes [Q].
  // Po zavření markTerminalDismissed — auto-open se příště neopakuje, [Q] je
  // vždy k dispozici. B varianta (IDEAS): dynamické live commands.
  private openTerminalModal(): void {
    this.modal.open({
      title: TERMINAL_TITLE,
      body: buildTerminalBody(this.world),
      cursor: true,
      onClose: () => markTerminalDismissed(),
    });
  }

  // === Log (Bottom Bar) ====================================================

  private createLog(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_CHROME,
      color: COL_TEXT_DIM,
    };

    // Touch-friendly command buttons — každý zvlášť klikatelný (mobil bez klávesnice).
    const commands: Array<{ text: string; action: () => void }> = [
      { text: "[I]nfo", action: () => this.infoPanel.toggle() },
      { text: "[M]odules", action: () => this.modulesPanel.toggle() },
      { text: "[E]vents", action: () => this.eventLog.toggle() },
      { text: "[T]asks", action: () => this.taskQueue.toggle() },
      { text: "[Q]uery", action: () => this.openTerminalModal() },
      { text: "[H]elp", action: () => this.openHelpModal() },
    ];

    this.logCmdTexts = commands.map((cmd) => {
      const t = this.add.text(0, 0, cmd.text, style).setOrigin(0, 0.5);
      t.setInteractive({ useHandCursor: true });
      t.on("pointerdown", cmd.action);
      return t;
    });
    this.layoutLogCommands();
  }

  // S24: pozice Bottom Bar tlačítek — přepočítat při vzniku i při resize.
  private layoutLogCommands(): void {
    if (this.logCmdTexts.length === 0) return;
    const logY = L.CANVAS_H - L.LOG_H;
    const btnY = logY + L.LOG_H / 2;
    const gap = 32;
    const totalW =
      this.logCmdTexts.reduce((sum, t) => sum + t.width, 0) +
      gap * (this.logCmdTexts.length - 1);
    let x = (L.CANVAS_W - totalW) / 2;
    for (const t of this.logCmdTexts) {
      t.setPosition(x, btnY);
      x += t.width + gap;
    }
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
        case "e":
          this.eventLog.toggle();
          break;
        case "t":
          this.taskQueue.toggle();
          break;
        case "i":
          this.infoPanel.toggle();
          break;
        case "m":
          this.modulesPanel.toggle();
          break;
        case "q":
          this.openTerminalModal();
          break;
        case "h":
          this.openHelpModal();
          break;
        case "escape":
          this.handleEscape();
          break;
        // Šipky nahoru/dolů — scroll hvězdného pozadí (test průhlednosti).
        case "arrowup":
          this.cameraY -= 40;
          this.background.update(this.cameraY);
          break;
        case "arrowdown":
          this.cameraY += 40;
          this.background.update(this.cameraY);
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
    this.eventLog.render();
    this.taskQueue.render();
    this.infoPanel.render();
    this.modulesPanel.render();
  }
}
