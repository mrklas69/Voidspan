// TaskQueuePanel — floating panel layer 3.5 (pravý okraj, radio s EventLogPanel).
// Hotkey [T] toggle. ESC zavře. 5-color semafor per Task.status.
// Řádek: [čas] Název (target) [bar]pct (eta)
//
// S24 kánon: GLOSSARY §Protocol — QuarterMaster monitoring + task queue.
// Radio mutex: otevření [T] zavře [E] a naopak (sdílí pravý roh).

import Phaser from "phaser";
import type { World, Task, TaskStatus } from "./model";
import { formatGameTimeShort, formatEta, taskEtaTicks, describeTaskTarget } from "./world";
import type { TooltipManager } from "./tooltip";
import {
  COL_HULL_DARK,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
  HEX_ALERT_RED,
  HEX_WARN_ORANGE,
  HEX_WARN_AMBER,
  HEX_OK_GREEN,
  HEX_INFO_BLUE,
} from "./palette";
import { CANVAS_W, HUD_H } from "./ui/layout";
import {
  PANEL_DEPTH as DEPTH,
  PANEL_MARGIN as MARGIN,
  PANEL_PADDING as PADDING,
  PANEL_BG_ALPHA,
  PANEL_HEADER_H as HEADER_H,
  PANEL_HALF_H,
  PANEL_VERT_GAP,
  PANEL_WIDTH_STD,
  loadPanelOpenPref,
  savePanelOpenPref,
  ellipsizeText,
} from "./ui/panel_helpers";
import { dockManager } from "./ui/dock_manager";

const PANEL_W = PANEL_WIDTH_STD;
const ROW_H = 20;
// S29 iterace: footer retirován → FOOTER_H 0 → víc místa pro body rows.
const FOOTER_H = 0;
const PANEL_H = PANEL_HALF_H;
const BODY_H = PANEL_H - HEADER_H - FOOTER_H;
const MAX_VISIBLE = Math.floor(BODY_H / ROW_H);

const LS_KEY = "voidspan.taskqueue.open";

const loadVisiblePref = () => loadPanelOpenPref(LS_KEY);
const saveVisiblePref = (v: boolean) => savePanelOpenPref(LS_KEY, v);

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

// Split řádku na 2 části (S29): lead (čas + název) se ellipsizuje zleva,
// suffix (bar + pct + eta / OK / FAILED) je right-aligned a drží plnou šířku.
// Izomorfismus s ModulesPanel kind/stats columny.
//
// Eternal: lead = label, suffix = "" (jen label).
// Completed: lead = `[t] name`, suffix = "OK".
// Failed:    lead = `[t] name`, suffix = "X FAILED".
// Active/Pending/Paused: lead = `[t] name`, suffix = "bar pct% (eta)".

function formatTaskLead(w: World, task: Task): string {
  const name = describeTaskTarget(w, task);
  if (task.status === "eternal") return name;
  if (task.status === "completed" || task.status === "failed") {
    const t = task.completedAt != null ? formatGameTimeShort(task.completedAt) : "—";
    return `[${t}] ${name}`;
  }
  // pending / active / paused.
  return `[${formatGameTimeShort(task.createdAt)}] ${name}`;
}

function formatTaskSuffix(w: World, task: Task): string {
  if (task.status === "eternal") return "";
  if (task.status === "completed") return "OK";
  if (task.status === "failed") return "X FAILED";

  // pending / active / paused — progres + ETA.
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
  return `${bar}${pctStr} ${eta}`;
}

export class TaskQueuePanel {
  private scene: Phaser.Scene;
  private getWorld: () => World;

  private container!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private closeBtn!: Phaser.GameObjects.Text;
  // footerText retirován (S29 iterace) — user preference čistší UI.
  // S29 pair per row: leadText (ellipsize) + suffixText (right-aligned dynamic x).
  private rowPairs: Array<{
    leadText: Phaser.GameObjects.Text;
    suffixText: Phaser.GameObjects.Text;
  }> = [];
  // Full (pre-ellipsize) lead + suffix per row — tooltip zobrazí kompletní řádek.
  private fullRows: Array<{ lead: string; suffix: string }> = [];

  private visible = false;
  private onToggleOpen?: () => void; // callback — zavři jiné panely před otevřením

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    this.scene = scene;
    this.getWorld = getWorld;
    this.build();
    this.visible = loadVisiblePref();
    this.container.setVisible(this.visible);
    if (this.visible) this.render();
    dockManager.register("tasks", "right", PANEL_W, () => this.visible);
  }

  setOnToggleOpen(cb: () => void): void {
    this.onToggleOpen = cb;
  }

  private build(): void {
    // S29 pozice: vpravo dole (pod EventLogem). HUD + margin + EventLog + vert gap.
    const x = CANVAS_W - PANEL_W - MARGIN;
    const y = HUD_H + MARGIN + PANEL_HALF_H + PANEL_VERT_GAP;

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
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0);
    this.container.add(this.titleText);

    this.closeBtn = this.scene.add
      .text(PANEL_W - PADDING, PADDING, "X", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
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

    // Body rows — pre-allocate MAX_VISIBLE row pairs (lead + suffix).
    // lead je left-aligned (x=PADDING), suffix je right-aligned (x se dopočítá
    // per-row v render() podle jeho měřené šířky — right edge = PANEL_W - PADDING).
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const rowY = HEADER_H + i * ROW_H;
      const leadText = this.scene.add
        .text(PADDING, rowY, "", {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_SIDEPANEL,
          color: UI_TEXT_PRIMARY,
        })
        .setOrigin(0, 0);
      const suffixText = this.scene.add
        .text(PANEL_W - PADDING, rowY, "", {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_SIDEPANEL,
          color: UI_TEXT_PRIMARY,
        })
        .setOrigin(1, 0); // right-anchored — x = pravá hrana textu
      this.rowPairs.push({ leadText, suffixText });
      this.fullRows.push({ lead: "", suffix: "" });
      this.container.add(leadText);
      this.container.add(suffixText);
    }

    // S29 iterace: footer (count + underline) retirován — čistší UI.
  }

  toggle(): void {
    if (!this.visible && this.onToggleOpen) this.onToggleOpen();
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    saveVisiblePref(this.visible);
    if (this.visible) this.render();
    dockManager.notifyChange();
  }

  // S29 — tooltip na leadText: pokud byl ořezán, ukaž plný řádek (lead + suffix).
  attachTooltips(tooltips: TooltipManager): void {
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const pair = this.rowPairs[i]!;
      tooltips.attach(pair.leadText, () => {
        const full = this.fullRows[i];
        if (!full || !full.lead) return null;
        if (pair.leadText.text === full.lead) return null; // nebyl ořez
        return full.suffix ? `${full.lead}  ${full.suffix}` : full.lead;
      });
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
    dockManager.notifyChange();
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
    const GAP = 8;
    const rightEdge = PANEL_W - PADDING;
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const pair = this.rowPairs[i]!;
      if (i < visibleCount) {
        const task = sorted[i]!;
        const color = STATUS_COLOR[task.status];
        const w = this.getWorld();

        // 1) Suffix nejdřív — setText, Phaser přepočítá width; .x zůstává
        //    PANEL_W - PADDING (origin 1,0 = right edge).
        const suffixStr = formatTaskSuffix(w, task);
        pair.suffixText.setText(suffixStr);
        pair.suffixText.setColor(color);
        pair.suffixText.setVisible(true);

        // 2) Lead budget = pravá hrana suffixu − (jeho šířka + gap) − PADDING.
        //    Když je suffix prázdný (eternal), celá šířka patří leadu.
        const suffixLeftX = suffixStr.length === 0
          ? rightEdge
          : rightEdge - pair.suffixText.width - GAP;
        const leadMaxW = suffixLeftX - PADDING;

        const leadStr = formatTaskLead(w, task);
        this.fullRows[i] = { lead: leadStr, suffix: suffixStr };
        ellipsizeText(pair.leadText, leadStr, leadMaxW);
        pair.leadText.setColor(color);
        pair.leadText.setVisible(true);
      } else {
        pair.leadText.setVisible(false);
        pair.suffixText.setVisible(false);
        this.fullRows[i] = { lead: "", suffix: "" };
      }
    }

    // S29 iterace: footer count retirován.
  }

  // S24 KISS: panel má pevnou velikost, resize jen posune container do rohu.
  relayout(): void {
    const x = CANVAS_W - PANEL_W - MARGIN;
    const y = HUD_H + MARGIN + PANEL_HALF_H + PANEL_VERT_GAP;
    this.container.setPosition(x, y);
  }
}
