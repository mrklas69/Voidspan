// ModulesPanel — floating panel layer 3.5 (levý okraj, mutex s InfoPanel).
// Hotkey [M] toggle. Per-module stats: status, HP%, power, active repair task.
// Struktura + scroll kopírují InfoPanel (S22 dialog + S24 KISS fix panel).

import Phaser from "phaser";
import type { World, Module } from "./model";
import { MODULE_DEFS } from "./model";
import type { TooltipManager } from "./tooltip";

import {
  COL_HULL_DARK,
  COL_HULL_MID,
  COL_TEXT_WHITE,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  FONT_FAMILY,
  FONT_SIZE_LABEL,
  ratingColor,
} from "./palette";
import { HUD_H } from "./ui/layout";

const DEPTH = 1500;
const PANEL_W = 460;
const MARGIN = 12;
const PADDING = 12;
const PANEL_BG_ALPHA = 0.9;
const HEADER_H = 40;

const PANEL_H = 576;

const SCROLL_TOP = HEADER_H + 4;
const SCROLL_H = PANEL_H - SCROLL_TOP - 4;
const SCROLLBAR_W = 8;
const SCROLLBAR_GAP = 4;
const SCROLL_STEP = 24;

const LS_KEY = "voidspan.modulespanel.open";

function loadVisiblePref(): boolean {
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
}

function saveVisiblePref(v: boolean): void {
  try { localStorage.setItem(LS_KEY, v ? "1" : "0"); } catch { /* incognito */ }
}

// Status ikona per modul. Hraje roli „lampička" — rating barví HP text.
function statusIcon(mod: Module): string {
  if (mod.hp <= 0) return "✕";
  if (mod.status === "online") return "●";
  if (mod.status === "offline") return "○";
  if (mod.status === "building") return "▯";
  if (mod.status === "demolishing") return "▼";
  return "·";
}

export class ModulesPanel {
  private scene: Phaser.Scene;
  private getWorld: () => World;

  private container!: Phaser.GameObjects.Container;
  private bodyText!: Phaser.GameObjects.Text;
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
  }

  private build(): void {
    const x = MARGIN;
    const y = HUD_H + MARGIN;

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
        fontSize: FONT_SIZE_LABEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0);
    this.container.add(titleText);

    const closeBtn = this.scene.add
      .text(PANEL_W - PADDING, PADDING, "✕", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_LABEL,
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

    const contentW = PANEL_W - 2 * PADDING - SCROLLBAR_W - SCROLLBAR_GAP;
    this.scrollContent = this.scene.add.container(PADDING, SCROLL_TOP);
    this.container.add(this.scrollContent);

    // Single-column text. Řádek per modul, ikona status + kind(id) + HP% + P.
    // Barvy se nastavují přes Text.setTintFill per line není podporované — držíme
    // jeden neutral color pro celek a rating se projevuje stylistickou ikonou
    // (KISS; barevné HP bychom mohli přidat budoucím multi-Text vykreslením).
    this.bodyText = this.scene.add
      .text(0, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        color: UI_TEXT_PRIMARY,
        lineSpacing: 6,
        wordWrap: { width: contentW },
      })
      .setOrigin(0, 0);
    this.scrollContent.add(this.bodyText);

    const maskGraphics = this.scene.make.graphics({});
    maskGraphics.fillStyle(0xffffff);
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

  attachTooltips(_tooltips: TooltipManager): void {
    // Per-module hover tooltipy = P2+. Dnes celý panel je plaintext list.
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
  }

  render(): void {
    if (!this.visible) return;
    this.renderBody();
  }

  private renderBody(): void {
    const w = this.getWorld();
    const mods = Object.values(w.modules);

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

    // Agregáty pro header: production / consumption / HP avg.
    let production = 0;
    let consumption = 0;
    let hpSum = 0;
    let hpCount = 0;
    for (const mod of mods) {
      if (mod.hp_max <= 0) continue;
      const hpRatio = mod.hp / mod.hp_max;
      hpSum += hpRatio * 100;
      hpCount++;
      if (mod.status === "online") {
        const pw = MODULE_DEFS[mod.kind].power_w * hpRatio;
        if (pw > 0) production += pw;
        else consumption += pw;
      }
    }
    const hpAvg = hpCount > 0 ? Math.round(hpSum / hpCount) : 0;
    const net = production + consumption;
    const netSign = net >= 0 ? "+" : "";

    const lines: string[] = [];
    lines.push(`Celkem: ${mods.length}  HP avg ${hpAvg}%  E ${netSign}${net.toFixed(1)} W`);
    lines.push(`  prod +${production.toFixed(1)} W  / spotřeba ${consumption.toFixed(1)} W`);
    lines.push("");

    // Per-module řádek — klíčové stats v jedné lince + repair progress na druhé.
    for (const mod of mods) {
      const def = MODULE_DEFS[mod.kind];
      const hpPct = mod.hp_max > 0 ? Math.round((mod.hp / mod.hp_max) * 100) : 0;
      const hpRatio = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
      const pw = mod.status === "online" ? def.power_w * hpRatio : 0;
      const pwStr = pw === 0 ? "—" : `${pw > 0 ? "+" : ""}${pw.toFixed(1)} W`;
      const capStr = def.capacity_wh ? `  Cap ${Math.round((def.capacity_wh ?? 0) * hpRatio)}/${def.capacity_wh} Wh` : "";
      const statusTag =
        mod.status === "offline" ? " [offline]" :
        mod.status === "building" ? " [build]" :
        mod.status === "demolishing" ? " [demo]" : "";
      lines.push(
        `${statusIcon(mod)} ${mod.kind} (${mod.id})  HP ${hpPct}%  P ${pwStr}${capStr}${statusTag}`,
      );

      // Aktivní task na modul — repair / demolish / build.
      const task = w.tasks.find(
        (t) => t.target.moduleId === mod.id && (t.status === "active" || t.status === "paused" || t.status === "pending"),
      );
      if (task) {
        const pct = task.wd_total > 0 ? Math.round((task.wd_done / task.wd_total) * 100) : 0;
        const barLen = 10;
        const filled = Math.round((pct / 100) * barLen);
        const bar = "█".repeat(filled) + "░".repeat(barLen - filled);
        const statusLabel = task.status === "active" ? "" : ` [${task.status}]`;
        lines.push(`    └ ${task.kind} ${bar} ${pct}%${statusLabel}`);
      }
    }

    this.bodyText.setText(lines.join("\n"));

    // Barva HP textu (overall) per rating — tintFill celého textového objektu
    // by obarvil vše, ne jen HP. Držíme neutral; budoucí multi-Text layout by
    // umožnil barvit HP per řádek (viz komentář build()).
    void ratingColor; // rezerva pro budoucí rozlišení

    const totalH = this.bodyText.height;
    this.maxScroll = Math.max(0, totalH - SCROLL_H);
    this.scrollOffset = Math.min(this.scrollOffset, this.maxScroll);
    this.scrollContent.y = SCROLL_TOP - this.scrollOffset;
    this.updateScrollbar();
  }
}
