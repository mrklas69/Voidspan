// ModulesPanel — floating panel layer 3.5 (levý okraj, mutex s InfoPanel).
// Hotkey [M] toggle. Per-module stats: status, HP%, power. Task progress je v [T].
// Struktura + scroll kopírují InfoPanel (S22 dialog + S24 KISS fix panel).

import Phaser from "phaser";
import type { World, Module, Task } from "./model";
import { STATUS_LABELS, statusRating } from "./model";
import type { TooltipManager } from "./tooltip";

import {
  COL_HULL_DARK,
  COL_HULL_MID,
  COL_TEXT_WHITE,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  UI_MASK_WHITE,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
  RATING_COLOR,
} from "./palette";
import { HUD_H } from "./ui/layout";
import {
  PANEL_DEPTH as DEPTH,
  PANEL_MARGIN as MARGIN,
  PANEL_PADDING as PADDING,
  PANEL_BG_ALPHA,
  PANEL_HEADER_H as HEADER_H,
  PANEL_HALF_H,
  PANEL_VERT_GAP,
  PANEL_WIDTH_STD,
  SCROLLBAR_W,
  SCROLLBAR_GAP,
  SCROLL_STEP,
  loadPanelOpenPref,
  savePanelOpenPref,
  ellipsizeText,
} from "./ui/panel_helpers";
import { dockManager } from "./ui/dock_manager";

const PANEL_W = PANEL_WIDTH_STD;
const PANEL_H = PANEL_HALF_H;

// S31: 3 řádky agregátů odstraněny, rating semafor zůstává. Seznam modulů
// začíná pod rating řádkem s zebra stripes.
const SCROLL_TOP = HEADER_H + 28;
const SCROLL_H = PANEL_H - SCROLL_TOP - 4;

// S29/S31 per-row layout: kindIdText (ellipsize na fix column) + statsText
// (fix x = KIND_COL_W). Formát: "Habitat (habitat_1)" | "poškozeno 85% plán".
const MOD_ROW_H = 24;       // font 18 + lineSpacing 6
const KIND_COL_W = 220;     // fixní šířka kind + id sloupce
const KIND_ELLIPSIS_W = KIND_COL_W - 8;  // ellipsize budget, 8 px gap
const MAX_MODULE_ROWS = 24; // pool (FVP max 16 bays × 1 modul, rezerva)

const LS_KEY = "voidspan.modulespanel.open";

const loadVisiblePref = () => loadPanelOpenPref(LS_KEY);
const saveVisiblePref = (v: boolean) => savePanelOpenPref(LS_KEY, v);

// Status modulu slovně (3. sloupec tabulky).
// S31: porovnání s hpPct (displayed int), ne s raw hp — jinak floating-point
// artefakt (hp=99.5 → round=100, ale hp<hp_max → "poškozeno 100%").
function moduleStatusCs(mod: Module, hpPct: number): string {
  if (mod.hp <= 0) return "zničeno";
  if (mod.status === "offline") return "offline";
  if (mod.status === "building") return "staví";
  if (mod.status === "demolishing") return "demoluje";
  if (hpPct < 100) return "poškozeno";
  return "OK";
}

// Task state 5. sloupec: plán / oprava... / nelze. Null = žádný aktivní task.
function moduleTaskState(tasks: Task[], moduleId: string): string {
  const t = tasks.find(
    (x) => x.target.moduleId === moduleId &&
    (x.status === "pending" || x.status === "active" || x.status === "paused"),
  );
  if (!t) return "";
  if (t.status === "pending") return "plán";
  if (t.status === "active") return "oprava...";
  if (t.status === "paused") return "nelze";
  return "";
}

export class ModulesPanel {
  private scene: Phaser.Scene;
  private getWorld: () => World;

  private container!: Phaser.GameObjects.Container;
  private ratingLabel!: Phaser.GameObjects.Text;
  private ratingValue!: Phaser.GameObjects.Text;
  private moduleRows: Array<{
    kindIdText: Phaser.GameObjects.Text;
    statsText: Phaser.GameObjects.Text;
  }> = [];
  // S29 full (pre-ellipsize) kindId + stats per row — tooltip zobrazí oba spojené.
  private fullRowData: Array<{ kindId: string; stats: string }> = [];
  private visible = false;

  // Scroll state.
  private scrollContent!: Phaser.GameObjects.Container;
  private scrollOffset = 0;
  private maxScroll = 0;
  private scrollTrack!: Phaser.GameObjects.Rectangle;
  private scrollThumb!: Phaser.GameObjects.Rectangle;

  // Touch drag scroll.
  private dragY: number | null = null;
  private dragOffset = 0;

  private onToggleOpenCb?: () => void;

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    this.scene = scene;
    this.getWorld = getWorld;
    this.build();
    this.visible = loadVisiblePref();
    this.container.setVisible(this.visible);
    if (this.visible) this.renderBody();
    dockManager.register("modules", "left", PANEL_W, () => this.visible);
  }

  private build(): void {
    // S29 pozice: vlevo dole (pod InfoPanelem). HUD + margin + InfoPanel + vert gap.
    const x = MARGIN;
    const y = HUD_H + MARGIN + PANEL_HALF_H + PANEL_VERT_GAP;

    this.container = this.scene.add.container(x, y).setDepth(DEPTH);

    const bg = this.scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, COL_HULL_DARK, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setStrokeStyle(1, UI_BORDER_DIM)
      .setInteractive();
    bg.on("pointerdown", (p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.dragY = p.y;
      this.dragOffset = this.scrollOffset;
    });
    this.container.add(bg);

    const titleText = this.scene.add
      .text(PADDING, PADDING, "Moduly", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0);
    this.container.add(titleText);

    const closeBtn = this.scene.add
      .text(PANEL_W - PADDING, PADDING, "X", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.toggle();
    });
    this.container.add(closeBtn);

    const underline = this.scene.add
      .rectangle(PADDING, HEADER_H - 2, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0);
    this.container.add(underline);

    // Rating — fixed nad scroll area. Po vzoru InfoPanelu.
    this.ratingLabel = this.scene.add
      .text(PADDING, HEADER_H + 4, "Stav modulů: ", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_PRIMARY,
      })
      .setOrigin(0, 0);
    this.container.add(this.ratingLabel);

    this.ratingValue = this.scene.add
      .text(0, HEADER_H + 4, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
      })
      .setOrigin(0, 0);
    this.container.add(this.ratingValue);

    const contentW = PANEL_W - 2 * PADDING - SCROLLBAR_W - SCROLLBAR_GAP;
    this.scrollContent = this.scene.add.container(PADDING, SCROLL_TOP);
    this.container.add(this.scrollContent);

    // Per-row module pool: kindIdText (ellipsize na KIND_ELLIPSIS_W) + statsText
    // (fix x = KIND_COL_W).
    for (let i = 0; i < MAX_MODULE_ROWS; i++) {
      const rowY = i * MOD_ROW_H;

      const kindIdText = this.scene.add
        .text(0, rowY, "", {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_SIDEPANEL,
          color: UI_TEXT_PRIMARY,
        })
        .setOrigin(0, 0);
      const statsText = this.scene.add
        .text(KIND_COL_W, rowY, "", {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_SIDEPANEL,
          color: UI_TEXT_PRIMARY,
        })
        .setOrigin(0, 0);
      this.moduleRows.push({ kindIdText, statsText });
      this.fullRowData.push({ kindId: "", stats: "" });
      this.scrollContent.add(kindIdText);
      this.scrollContent.add(statsText);
    }

    const maskGraphics = this.scene.make.graphics({});
    maskGraphics.fillStyle(UI_MASK_WHITE);
    maskGraphics.fillRect(x + PADDING, y + SCROLL_TOP, contentW, SCROLL_H);
    this.scrollContent.setMask(maskGraphics.createGeometryMask());

    const sbX = PANEL_W - SCROLLBAR_W - 4;
    this.scrollTrack = this.scene.add
      .rectangle(sbX, SCROLL_TOP, SCROLLBAR_W, SCROLL_H, COL_HULL_MID, 0.3)
      .setOrigin(0, 0)
      .setVisible(false);
    this.container.add(this.scrollTrack);

    this.scrollThumb = this.scene.add
      .rectangle(sbX, SCROLL_TOP, SCROLLBAR_W, 30, COL_TEXT_WHITE, 0.5)
      .setOrigin(0, 0)
      .setVisible(false)
      .setInteractive({ useHandCursor: true, draggable: true });
    this.scene.input.setDraggable(this.scrollThumb);
    this.scrollThumb.on("drag", (_p: Phaser.Input.Pointer, _dragX: number, dragY: number) => {
      if (this.maxScroll <= 0) return;
      const thumbH = this.scrollThumb.height;
      const travel = SCROLL_H - thumbH;
      const clampedY = Math.max(SCROLL_TOP, Math.min(SCROLL_TOP + travel, dragY));
      const ratio = travel > 0 ? (clampedY - SCROLL_TOP) / travel : 0;
      this.setScroll(ratio * this.maxScroll);
    });
    this.container.add(this.scrollThumb);

    this.scrollTrack.setInteractive({ useHandCursor: true });
    this.scrollTrack.on("pointerdown", (_p: Phaser.Input.Pointer, _lx: number, ly: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      if (this.maxScroll <= 0) return;
      const thumbH = this.scrollThumb.height;
      const travel = SCROLL_H - thumbH;
      const ratio = Math.max(0, Math.min(1, (ly - thumbH / 2) / travel));
      this.setScroll(ratio * this.maxScroll);
    });

    this.scene.input.on("wheel", (pointer: Phaser.Input.Pointer, _objs: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (!this.visible || this.maxScroll <= 0) return;
      if (pointer.x >= x && pointer.x <= x + PANEL_W && pointer.y >= y && pointer.y <= y + PANEL_H) {
        this.setScroll(this.scrollOffset + (dy > 0 ? SCROLL_STEP : -SCROLL_STEP));
      }
    });

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.dragY === null || !this.visible) return;
      const dy = this.dragY - pointer.y;
      this.setScroll(this.dragOffset + dy);
    });

    this.scene.input.on("pointerup", () => {
      this.dragY = null;
    });
  }

  private setScroll(next: number): void {
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, next));
    this.scrollContent.y = SCROLL_TOP - this.scrollOffset;
    this.updateScrollbar();
  }

  private updateScrollbar(): void {
    if (this.maxScroll <= 0) {
      this.scrollTrack.setVisible(false);
      this.scrollThumb.setVisible(false);
      return;
    }
    this.scrollTrack.setVisible(true);
    this.scrollThumb.setVisible(true);
    const ratio = SCROLL_H / (SCROLL_H + this.maxScroll);
    const thumbH = Math.max(20, Math.floor(SCROLL_H * ratio));
    const travel = SCROLL_H - thumbH;
    const pos = this.maxScroll > 0 ? (this.scrollOffset / this.maxScroll) * travel : 0;
    this.scrollThumb.setSize(SCROLLBAR_W, thumbH);
    this.scrollThumb.setY(SCROLL_TOP + pos);
  }

  // S29 — hover na kindIdText → pokud byl ořezán, tooltip ukáže plný řádek
  // (kind + id + stats spojené). Pokud se vešel beze změny, null = no tooltip.
  attachTooltips(tooltips: TooltipManager): void {
    for (let i = 0; i < MAX_MODULE_ROWS; i++) {
      const row = this.moduleRows[i]!;
      tooltips.attach(row.kindIdText, () => {
        const full = this.fullRowData[i];
        if (!full || !full.kindId) return null;
        if (row.kindIdText.text === full.kindId) return null; // nebyl ořez
        return `${full.kindId}  ${full.stats}`;
      });
    }
  }

  setOnToggleOpen(cb: () => void): void {
    this.onToggleOpenCb = cb;
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    saveVisiblePref(this.visible);
    this.dragY = null;
    if (this.visible) {
      this.scrollOffset = 0;
      this.renderBody();
      this.onToggleOpenCb?.();
    }
    dockManager.notifyChange();
  }

  isOpen(): boolean {
    return this.visible;
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.container.setVisible(false);
    saveVisiblePref(false);
    this.dragY = null;
    dockManager.notifyChange();
  }

  render(): void {
    if (!this.visible) return;
    this.renderBody();
  }

  private renderBody(): void {
    const w = this.getWorld();
    const mods = Object.values(w.modules);

    // Rating — avg HP modulů (= w.status.base.pct). 5-color semafor sdílí metriku s HP textem.
    const rating = statusRating(w.status.base.pct);
    const label = STATUS_LABELS[rating];
    this.ratingValue.setText(`${label.cs} (${label.en}) — ${Math.round(w.status.base.pct)}%`);
    this.ratingValue.setColor(RATING_COLOR[rating]);
    this.ratingValue.setX(PADDING + this.ratingLabel.width);

    // Řazení: online/building nahoře, pak offline, pak destroyed; sekundárně per kind.
    const statusOrder: Record<Module["status"], number> = {
      online: 0,
      building: 1,
      demolishing: 2,
      offline: 3,
    };
    mods.sort((a, b) => {
      if (a.hp <= 0 && b.hp > 0) return 1;
      if (b.hp <= 0 && a.hp > 0) return -1;
      const s = statusOrder[a.status] - statusOrder[b.status];
      if (s !== 0) return s;
      return a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id);
    });

    // Per-module řádky — 5-sloupcový formát:
    //   1. kind    "Habitat"
    //   2. (id)    "(habitat_1)"
    //   3. status  "OK / poškozeno / zničeno / offline / staví / demoluje"
    //   4. HP%     "85%"
    //   5. task    "plán / oprava... / nelze" (prázdné = žádný aktivní task)
    // Sloupce 1+2 v kindIdText (ellipsize), 3+4+5 v statsText (fix x).
    const visibleCount = Math.min(mods.length, MAX_MODULE_ROWS);
    for (let i = 0; i < MAX_MODULE_ROWS; i++) {
      const row = this.moduleRows[i]!;
      if (i >= visibleCount) {
        row.kindIdText.setVisible(false);
        row.statsText.setVisible(false);
        this.fullRowData[i] = { kindId: "", stats: "" };
        continue;
      }
      const mod = mods[i]!;
      const hpPct = mod.hp_max > 0 ? Math.round((mod.hp / mod.hp_max) * 100) : 0;
      const statusCs = moduleStatusCs(mod, hpPct);
      const taskState = moduleTaskState(w.tasks, mod.id);

      const kindIdFull = `${mod.kind} (${mod.id})`;
      const statsFull = taskState
        ? `${statusCs} ${hpPct}% ${taskState}`
        : `${statusCs} ${hpPct}%`;
      this.fullRowData[i] = { kindId: kindIdFull, stats: statsFull };
      ellipsizeText(row.kindIdText, kindIdFull, KIND_ELLIPSIS_W);
      row.statsText.setText(statsFull);
      // 5-barevný semafor per řádek — barva sdílí metriku s hpPct (izomorfismus).
      const rowColor = RATING_COLOR[statusRating(hpPct)];
      row.kindIdText.setColor(rowColor);
      row.statsText.setColor(rowColor);
      row.kindIdText.setVisible(true);
      row.statsText.setVisible(true);
    }

    // Total výška scrollContent = module rows (zobrazené) × ROW_H.
    const totalH = visibleCount * MOD_ROW_H;
    this.maxScroll = Math.max(0, totalH - SCROLL_H);
    this.scrollOffset = Math.min(this.scrollOffset, this.maxScroll);
    this.scrollContent.y = SCROLL_TOP - this.scrollOffset;
    this.updateScrollbar();
  }
}
