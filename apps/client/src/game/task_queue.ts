// TaskQueuePanel — floating panel layer 3.5 (pravý okraj, radio s EventLogPanel).
// Hotkey [T] toggle. ESC zavře. 5-color semafor per Task.status.
// Řádek: [čas] Název (target) [bar]pct (eta)
//
// S24 kánon: GLOSSARY §Protocol — QuarterMaster monitoring + task queue.
// Radio mutex: otevření [T] zavře [E] a naopak (sdílí pravý roh).

import Phaser from "phaser";
import type { World, Task, TaskStatus } from "./model";
import { formatGameTime, formatEta, taskEtaTicks, describeTaskTarget } from "./world";
import {
  COL_HULL_DARK,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  FONT_FAMILY,
  FONT_SIZE_HINT,
  FONT_SIZE_LABEL,
  HEX_ALERT_RED,
  HEX_WARN_ORANGE,
  HEX_WARN_AMBER,
  HEX_OK_GREEN,
  HEX_INFO_BLUE,
} from "./palette";
import { CANVAS_W, HUD_H } from "./ui/layout";

const DEPTH = 1500;
const PANEL_W = 420;
const MARGIN = 12;
const PADDING = 12;
const PANEL_BG_ALPHA = 0.9;
const ROW_H = 20;
const HEADER_H = 40;
const FOOTER_H = 28;
const PANEL_H = 576;
const BODY_H = PANEL_H - HEADER_H - FOOTER_H;
const MAX_VISIBLE = Math.floor(BODY_H / ROW_H);

const LS_KEY = "voidspan.taskqueue.open";

function loadVisiblePref(): boolean {
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
}
function saveVisiblePref(v: boolean): void {
  try { localStorage.setItem(LS_KEY, v ? "1" : "0"); } catch { /* incognito */ }
}

// S24 status → barva (5-color semafor, viz GLOSSARY).
const STATUS_COLOR: Record<TaskStatus, string> = {
  eternal:   HEX_INFO_BLUE,    // modrá = věčný service task
  active:    HEX_WARN_ORANGE,  // oranžová = probíhá
  paused:    HEX_WARN_AMBER,   // žlutá = pozastaveno
  pending:   UI_TEXT_DIM,      // neutral amber = čeká
  completed: HEX_OK_GREEN,     // zelená = dokončeno
  failed:    HEX_ALERT_RED,    // červená = neproveditelné
};

// Řazení sekcí — eternal nahoře (monitor), aktivní, pozastavené, čekající, uzavřené.
const SECTION_ORDER: TaskStatus[] = [
  "eternal", "active", "paused", "pending", "completed", "failed",
];

// Progress bar 10 znaků: ███░░░░░░░ (S24 — block full/empty, bez závorek).
function progressBar(pct: number, width = 10): string {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

// Formát řádku: [čas] Název [bar]pct% (eta)
// Eternal: jen label.
// Completed: čas dokončení.
// Active/Pending/Paused: čas vytvoření + progress + ETA.
// Failed: čas dokončení + "FAILED".
function formatTaskRow(w: World, task: Task): string {
  const name = describeTaskTarget(w, task);

  if (task.status === "eternal") {
    return name; // label už obsahuje vše („QuarterMaster v2.3 — Active")
  }

  if (task.status === "completed") {
    const t = task.completedAt != null ? formatGameTime(task.completedAt) : "—";
    return `[${t}] ${name} ✓`;
  }

  if (task.status === "failed") {
    const t = task.completedAt != null ? formatGameTime(task.completedAt) : "—";
    return `[${t}] ${name} ✕ FAILED`;
  }

  // pending / active / paused — progres + ETA.
  const t = formatGameTime(task.createdAt);
  const pct = task.wd_total > 0 ? Math.min(100, (task.wd_done / task.wd_total) * 100) : 0;
  const bar = progressBar(pct);
  const pctStr = `${Math.round(pct)}%`.padStart(4, " ");
  let eta = "";
  if (task.status === "active") {
    const etaT = taskEtaTicks(w, task);
    eta = `(${formatEta(etaT)})`;
  } else if (task.status === "paused") {
    eta = "(paused)";
  } else {
    eta = "(pending)";
  }
  return `[${t}] ${name} ${bar}${pctStr} ${eta}`;
}

export class TaskQueuePanel {
  private scene: Phaser.Scene;
  private getWorld: () => World;

  private container!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private closeBtn!: Phaser.GameObjects.Text;
  private footerText!: Phaser.GameObjects.Text;
  private rowTexts: Phaser.GameObjects.Text[] = [];

  private visible = false;
  private onToggleOpen?: () => void; // callback — zavři jiné panely před otevřením

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    this.scene = scene;
    this.getWorld = getWorld;
    this.build();
    this.visible = loadVisiblePref();
    this.container.setVisible(this.visible);
    if (this.visible) this.render();
  }

  setOnToggleOpen(cb: () => void): void {
    this.onToggleOpen = cb;
  }

  private build(): void {
    const x = CANVAS_W - PANEL_W - MARGIN;
    const y = HUD_H + MARGIN;

    this.container = this.scene.add.container(x, y).setDepth(DEPTH);

    const bg = this.scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, COL_HULL_DARK, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setStrokeStyle(1, UI_BORDER_DIM)
      .setInteractive();
    bg.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
    });
    this.container.add(bg);

    this.titleText = this.scene.add
      .text(PADDING, PADDING, "Task Queue", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_LABEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0);
    this.container.add(this.titleText);

    this.closeBtn = this.scene.add
      .text(PANEL_W - PADDING, PADDING, "✕", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_LABEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.closeBtn.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.toggle();
    });
    this.container.add(this.closeBtn);

    const underline = this.scene.add
      .rectangle(PADDING, HEADER_H - 2, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0);
    this.container.add(underline);

    // Body rows — pre-allocate MAX_VISIBLE text objects.
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const rowY = HEADER_H + i * ROW_H;
      const t = this.scene.add
        .text(PADDING, rowY, "", {
          fontFamily: FONT_FAMILY,
          fontSize: "18px",
          color: UI_TEXT_PRIMARY,
        })
        .setOrigin(0, 0);
      this.rowTexts.push(t);
      this.container.add(t);
    }

    this.footerText = this.scene.add
      .text(PADDING, PANEL_H - FOOTER_H + 4, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_HINT,
        color: UI_TEXT_DIM,
      })
      .setOrigin(0, 0);
    this.container.add(this.footerText);

    const footerLine = this.scene.add
      .rectangle(PADDING, PANEL_H - FOOTER_H, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0);
    this.container.add(footerLine);
  }

  toggle(): void {
    if (!this.visible && this.onToggleOpen) this.onToggleOpen();
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    saveVisiblePref(this.visible);
    if (this.visible) this.render();
  }

  isOpen(): boolean {
    return this.visible;
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.container.setVisible(false);
    saveVisiblePref(false);
  }

  // Called every frame from GameScene.update() — lightweight.
  render(): void {
    if (!this.visible) return;
    const tasks = this.getWorld().tasks;

    // Seřadit podle sekce, uvnitř sekce aktivní podle ETA asc, completed/failed podle completedAt desc, ostatní createdAt asc.
    const sorted = [...tasks].sort((a, b) => {
      const sa = SECTION_ORDER.indexOf(a.status);
      const sb = SECTION_ORDER.indexOf(b.status);
      if (sa !== sb) return sa - sb;
      if (a.status === "completed" || a.status === "failed") {
        return (b.completedAt ?? 0) - (a.completedAt ?? 0);
      }
      return a.createdAt - b.createdAt;
    });

    const visibleCount = Math.min(sorted.length, MAX_VISIBLE);
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const t = this.rowTexts[i]!;
      if (i < visibleCount) {
        const task = sorted[i]!;
        t.setText(formatTaskRow(this.getWorld(), task));
        t.setColor(STATUS_COLOR[task.status]);
        t.setVisible(true);
      } else {
        t.setVisible(false);
      }
    }

    const overflow = sorted.length - visibleCount;
    this.footerText.setText(
      overflow > 0 ? `${sorted.length} tasks (+${overflow} skrytých)` : `${sorted.length} tasks`,
    );
  }

  // S24 KISS: panel má pevnou velikost, resize jen posune container do rohu.
  relayout(): void {
    const x = CANVAS_W - PANEL_W - MARGIN;
    const y = HUD_H + MARGIN;
    this.container.setPosition(x, y);
  }
}
