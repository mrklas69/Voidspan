// SideRightPanel — pravý sloupec: TASK QUEUE (horní polovina) + INSPECTOR (dolní).
// Task queue zobrazuje frontu úkolů s progress bary.
// Inspector zobrazuje kontext vybraného bay (čte přes `getSelectedBayIdx` ze Segment).

import Phaser from "phaser";
import type { World, Module, Task } from "../model";
import { MODULE_DEFS } from "../model";
import { renderBar } from "../format";
import { TooltipManager } from "../tooltip";
import { FONT_FAMILY, FONT_SIZE_LABEL, FONT_SIZE_PANEL_HEADER, UI_BORDER_DIM } from "../palette";
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
  private inspectorHeader: Phaser.GameObjects.Text;
  private inspectorText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    private getWorld: () => World,
    private getSelectedBayIdx: () => number | null,
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
    // Inline header (S16) — místo statického labelu "INSPECTOR" zobrazuje název
    // vybrané entity (modul / povrch). Obsah pod podtržením = detaily.
    const divY = MID_Y + MID_H / 2;
    const headerX = TASKQUEUE_X + 10;
    const headerY = divY + 8;
    this.inspectorHeader = scene.add.text(headerX, headerY, "", {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_PANEL_HEADER,
      color: COL_TEXT_ACCENT,
    });
    const underlineY = headerY + 26;
    scene.add
      .rectangle(headerX, underlineY, TASKQUEUE_W - 20, 1, UI_BORDER_DIM)
      .setOrigin(0, 0);
    this.inspectorText = scene.add.text(TASKQUEUE_X + 10, underlineY + 10, "", {
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
      return `Úkoly\n\nV queue: ${count}\nProgress = WD done / total\n1 Constructor (12 W) = 12 WD / game day\n\nKlik damaged bay = enqueue repair.`;
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
        t.target.bayIdx !== undefined ? `bay ${t.target.bayIdx}` : "—";
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
    const idx = this.getSelectedBayIdx();
    if (idx === null) {
      this.inspectorHeader.setText("—");
      this.inspectorText.setText("nic není vybráno");
      this.inspectorText.setColor(COL_TEXT_DIM);
      return;
    }

    const w = this.getWorld();
    const bay = w.segment[idx];
    if (!bay) return;

    const row = Math.floor(idx / 8);
    const col = idx % 8;
    const pos = `bay ${idx} (r${row} c${col})`;

    if (bay.kind === "void") {
      this.inspectorHeader.setText("Void");
      this.inspectorText.setText(`${pos}\n\nOtevřený prostor. Nic tu není.`);
      this.inspectorText.setColor(COL_TEXT_DIM);
      return;
    }

    if (bay.kind === "skeleton") {
      const missing = bay.hp_max - bay.hp;
      this.inspectorHeader.setText("Skeleton");
      this.inspectorText.setText(
        `${pos}\n\n` +
          `HP: ${bay.hp.toFixed(0)} / ${bay.hp_max}\n` +
          (missing > 0
            ? `Missing: ${missing.toFixed(0)} HP\nKlik = enqueue repair task.`
            : `(kostra bez poškození, nevzduchotěsná)`),
      );
      this.inspectorText.setColor(missing > 0 ? COL_TEXT_ACCENT : COL_TEXT_DIM);
      return;
    }

    if (bay.kind === "covered") {
      const missing = bay.hp_max - bay.hp;
      this.inspectorHeader.setText(`Covered v${bay.variant}`);
      this.inspectorText.setText(
        `${pos}\n\n` +
          `HP: ${bay.hp.toFixed(0)} / ${bay.hp_max}\n` +
          (missing > 0
            ? `Missing: ${missing.toFixed(0)} HP\nKlik = enqueue repair task.`
            : `(vzduchotěsné, bez poškození)`),
      );
      this.inspectorText.setColor(missing > 0 ? COL_TEXT_ACCENT : COL_TEXT_DIM);
      return;
    }

    // module_root / module_ref
    const mod = w.modules[bay.moduleId] as Module | undefined;
    if (!mod) {
      this.inspectorHeader.setText("?");
      this.inspectorText.setText(`${pos}\n\n[chyba: modul ${bay.moduleId} neexistuje]`);
      return;
    }
    const def = MODULE_DEFS[mod.kind];
    this.inspectorHeader.setText(`${def.label}  ${def.w}×${def.h}`);
    const lines = [
      pos,
      "",
      `status: ${mod.status}`,
      `HP: ${mod.hp.toFixed(0)} / ${mod.hp_max}`,
      `cover: v${bay.coverVariant} (pod modulem)`,
      `power: ${def.power_w > 0 ? "+" : ""}${def.power_w} W`,
      `build: ${def.wd_to_build} WD · ◎ ${def.cost_coin}`,
      "",
      def.description,
    ];
    this.inspectorText.setText(lines);
    this.inspectorText.setColor(COL_TEXT);
  }
}
