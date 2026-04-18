// TaskQueuePanel — floating panel layer 3.5, bottom-right slot. Hotkey [T] toggle.
// 5-color semafor per Task.status. Řádek: [čas] Název (target) [bar]pct (eta).
// Kánon: GLOSSARY §Protocol — QuarterMaster monitoring + task queue.
// Bez scrollu — MAX_VISIBLE pokryje plný pool service/active/pending tasků.

import Phaser from "phaser";
import type { World, Task, TaskStatus } from "./model";
import { formatGameTimeShort, formatEta, taskEtaTicks, describeTaskTarget } from "./world";
import { renderBar } from "./format";
import type { TooltipManager } from "./tooltip";
import {
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
  HEX_ALERT_RED,
  HEX_WARN_AMBER,
  HEX_OK_GREEN,
  HEX_INFO_BLUE,
  HEX_COOLANT_CYAN,
} from "./palette";
import {
  PANEL_PADDING as PADDING,
  PANEL_HEADER_H as HEADER_H,
  ellipsizeText,
} from "./ui/panel_helpers";
import { FloatingPanel } from "./ui/floating_panel";

const ROW_H = 20;

// S24 status → barva (5-color semafor, viz GLOSSARY).
// Cyan pro `active` (ne oranžová) — úmyslně mimo HP rating paletu (red/orange/amber/lime/green),
// aby task fáze nebyla čtena jako "varování". Cyan sdílí kanonický tón s Fluids/Coolant, tady
// v task kontextu znamená "probíhá bez problému". Paused zůstává amber (krátkodobá anomálie =
// akceptovatelný zvuk rating palety).
const STATUS_COLOR: Record<TaskStatus, string> = {
  eternal:   HEX_INFO_BLUE,     // modrá = věčný service task
  active:    HEX_COOLANT_CYAN,  // cyan = probíhá (mimo rating paletu)
  paused:    HEX_WARN_AMBER,    // žlutá = pozastaveno
  pending:   UI_TEXT_DIM,       // neutral amber = čeká
  completed: HEX_OK_GREEN,      // zelená = dokončeno
  failed:    HEX_ALERT_RED,     // červená = neproveditelné
};

// Řazení sekcí — eternal nahoře (monitor), aktivní, pozastavené, čekající, uzavřené.
const SECTION_ORDER: TaskStatus[] = [
  "eternal", "active", "paused", "pending", "completed", "failed",
];

// Split řádku na 2 části (S29): lead (čas + název) se ellipsizuje zleva,
// suffix (bar + pct + eta / OK / FAILED) je right-aligned a drží plnou šířku.
// Izomorfismus s ModulesPanel kind/stats columny.
function formatTaskLead(w: World, task: Task): string {
  const name = describeTaskTarget(w, task);
  if (task.status === "eternal") return name;
  if (task.status === "completed" || task.status === "failed") {
    const t = task.completedAt != null ? formatGameTimeShort(task.completedAt) : "—";
    return `[${t}] ${name}`;
  }
  return `[${formatGameTimeShort(task.createdAt)}] ${name}`;
}

function formatTaskSuffix(w: World, task: Task): string {
  if (task.status === "eternal") return "";
  if (task.status === "completed") return "OK";
  if (task.status === "failed") return "X FAILED";

  // pending / active / paused — progres + ETA.
  const pct = task.wd_total > 0 ? Math.min(100, (task.wd_done / task.wd_total) * 100) : 0;
  const bar = renderBar(pct, 10);
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

export class TaskQueuePanel extends FloatingPanel {
  private getWorld: () => World;

  // S29 pair per row: leadText (ellipsize) + suffixText (right-aligned dynamic x).
  private rowPairs: Array<{
    leadText: Phaser.GameObjects.Text;
    suffixText: Phaser.GameObjects.Text;
  }> = [];
  // Full (pre-ellipsize) lead + suffix per row — tooltip zobrazí kompletní řádek.
  private fullRows: Array<{ lead: string; suffix: string }> = [];

  private maxVisible = 0;

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    super(scene, {
      dockId: "tasks",
      lsKey: "voidspan.taskqueue.open",
      title: "Task Queue",
      slot: "bottom-right",
    });
    this.getWorld = getWorld;
    this.init();
  }

  protected buildBody(): void {
    const bodyH = this.panelH - HEADER_H;
    this.maxVisible = Math.floor(bodyH / ROW_H);

    // Body rows — pre-allocate MAX_VISIBLE row pairs (lead + suffix).
    // lead je left-aligned (x=PADDING), suffix je right-aligned (x se dopočítá
    // per-row v render() podle jeho měřené šířky — right edge = panelW - PADDING).
    for (let i = 0; i < this.maxVisible; i++) {
      const rowY = HEADER_H + i * ROW_H;
      const leadText = this.scene.add
        .text(PADDING, rowY, "", {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_SIDEPANEL,
          color: UI_TEXT_PRIMARY,
        })
        .setOrigin(0, 0);
      const suffixText = this.scene.add
        .text(this.panelW - PADDING, rowY, "", {
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
  }

  // S29 — tooltip na leadText: pokud byl ořezán, ukaž plný řádek (lead + suffix).
  attachTooltips(tooltips: TooltipManager): void {
    for (let i = 0; i < this.maxVisible; i++) {
      const pair = this.rowPairs[i]!;
      tooltips.attach(pair.leadText, () => {
        const full = this.fullRows[i];
        if (!full || !full.lead) return null;
        if (pair.leadText.text === full.lead) return null; // nebyl ořez
        return full.suffix ? `${full.lead}  ${full.suffix}` : full.lead;
      });
    }
  }

  protected renderBody(): void {
    const tasks = this.getWorld().tasks;

    // Seřadit podle sekce, uvnitř sekce aktivní podle ETA asc,
    // completed/failed podle completedAt desc, ostatní createdAt asc.
    const sorted = [...tasks].sort((a, b) => {
      const sa = SECTION_ORDER.indexOf(a.status);
      const sb = SECTION_ORDER.indexOf(b.status);
      if (sa !== sb) return sa - sb;
      if (a.status === "completed" || a.status === "failed") {
        return (b.completedAt ?? 0) - (a.completedAt ?? 0);
      }
      return a.createdAt - b.createdAt;
    });

    const visibleCount = Math.min(sorted.length, this.maxVisible);
    const GAP = 8;
    const rightEdge = this.panelW - PADDING;
    for (let i = 0; i < this.maxVisible; i++) {
      const pair = this.rowPairs[i]!;
      if (i < visibleCount) {
        const task = sorted[i]!;
        const color = STATUS_COLOR[task.status];
        const w = this.getWorld();

        // 1) Suffix nejdřív — setText, Phaser přepočítá width; .x zůstává
        //    panelW - PADDING (origin 1,0 = right edge).
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
  }
}
