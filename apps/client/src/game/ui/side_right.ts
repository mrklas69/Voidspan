// SideRightPanel — pravý sloupec: TASK QUEUE (horní polovina) + INSPECTOR (dolní).
// Task queue zobrazuje frontu úkolů s progress bary.
// Inspector zobrazuje kontext vybraného tile (čte přes `getSelectedTileIdx` ze Segment).

import Phaser from "phaser";
import type { World, Module, Task } from "../model";
import { MODULE_DEFS } from "../model";
import { renderBar } from "../format";
import { TooltipManager } from "../tooltip";
import { FONT_FAMILY, FONT_SIZE_LABEL } from "../palette";
import {
  TASKQUEUE_X,
  TASKQUEUE_W,
  MID_Y,
  MID_H,
  COL_PANEL_BG,
  COL_TEXT,
  COL_TEXT_DIM,
  COL_TEXT_ACCENT,
} from "./layout";
import { createPanelHeader } from "./panel_header";

export class SideRightPanel {
  private taskQueueText: Phaser.GameObjects.Text;
  private inspectorText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    private getWorld: () => World,
    private getSelectedTileIdx: () => number | null,
  ) {
    // Subtle bg fill — odliší zónu od canvas pozadí bez rámečku.
    scene.add
      .rectangle(TASKQUEUE_X, MID_Y, TASKQUEUE_W, MID_H, COL_PANEL_BG, 0.85)
      .setOrigin(0, 0);

    // --- TASK QUEUE (horní polovina) ---
    const contentY = createPanelHeader(
      scene,
      TASKQUEUE_X + 10,
      MID_Y + 8,
      "TASK QUEUE",
      TASKQUEUE_W - 20,
    );
    this.taskQueueText = scene.add.text(TASKQUEUE_X + 10, contentY + 4, "", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_TEXT,
      wordWrap: { width: TASKQUEUE_W - 20 },
      lineSpacing: 4,
    });

    // --- INSPECTOR (dolní polovina) ---
    const divY = MID_Y + MID_H / 2;
    const inspectorContentY = createPanelHeader(
      scene,
      TASKQUEUE_X + 10,
      divY + 8,
      "INSPECTOR",
      TASKQUEUE_W - 20,
    );
    this.inspectorText = scene.add.text(TASKQUEUE_X + 10, inspectorContentY + 4, "", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_LABEL,
      color: COL_TEXT,
      wordWrap: { width: TASKQUEUE_W - 20 },
      lineSpacing: 4,
    });
  }

  attachTooltips(tooltips: TooltipManager): void {
    tooltips.attach(this.taskQueueText, () => {
      const w = this.getWorld();
      const count = w.tasks.length;
      return `Úkoly\n\nV queue: ${count}\nProgress = WD done / total\n1 Constructor (12 W) = 12 WD / game day\n\nKlik damaged tile = enqueue repair.`;
    });
  }

  render(): void {
    this.renderTaskQueue();
    this.renderInspector();
  }

  private renderTaskQueue(): void {
    const tasks = this.getWorld().tasks;
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

  private renderInspector(): void {
    const idx = this.getSelectedTileIdx();
    if (idx === null) {
      this.inspectorText.setText("— nic není vybráno —");
      this.inspectorText.setColor(COL_TEXT_DIM);
      return;
    }

    const w = this.getWorld();
    const tile = w.segment[idx];
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

    // module_ref
    const mod = w.modules[tile.moduleId] as Module | undefined;
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
      `build: ${def.wd_to_build} WD · ◎ ${def.cost_coin}`,
      "",
      def.description,
    ];
    this.inspectorText.setText(lines);
    this.inspectorText.setColor(COL_TEXT);
  }
}
