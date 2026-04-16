// ActorsPanel — levý sloupec, per-řádek dvojice {dot, name}.
// Dot barevně per status (6 demo barev pro vizuální ladění).

import Phaser from "phaser";
import type { World } from "../model";
import { ACTOR_DEFS } from "../model";
import { TooltipManager } from "../tooltip";
import {
  FONT_FAMILY,
  FONT_SIZE_PANEL,
  UI_DOT_ONLINE,
  UI_DOT_NPC,
  UI_DOT_WORKING,
  UI_DOT_WARN,
  UI_DOT_ALERT,
  UI_DOT_IDLE,
} from "../palette";
import {
  ACTORS_X,
  ACTORS_W,
  MID_Y,
  MID_H,
  COL_PANEL_BG,
  COL_TEXT,
} from "./layout";
import { createPanelHeader } from "./panel_header";

export class ActorsPanel {
  private rows: Array<{ dot: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text }> = [];

  constructor(
    scene: Phaser.Scene,
    private getWorld: () => World,
  ) {
    // Subtle bg fill — odliší zónu od canvas pozadí bez rámečku.
    scene.add
      .rectangle(ACTORS_X, MID_Y, ACTORS_W, MID_H, COL_PANEL_BG, 0.85)
      .setOrigin(0, 0);

    const contentY = createPanelHeader(scene, ACTORS_X + 10, MID_Y + 8, "ACTORS", ACTORS_W - 20);

    // Per-řádek dvojice: kulička ● (barevná) + jméno actora.
    const rowH = 26; // VT323 18px + padding
    const actors = getWorld().actors;
    for (let i = 0; i < actors.length; i++) {
      const y = contentY + 4 + i * rowH;
      const dot = scene.add.text(ACTORS_X + 10, y, "●", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_PANEL,
        color: UI_DOT_IDLE,
      });
      const name = scene.add.text(ACTORS_X + 10 + 18, y, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_PANEL,
        color: COL_TEXT,
      });
      this.rows.push({ dot, name });
    }
  }

  attachTooltips(tooltips: TooltipManager): void {
    const provider = () => {
      const w = this.getWorld();
      const idle = w.actors.filter((a) => a.state === "idle").length;
      const working = w.actors.filter((a) => a.state === "working").length;
      return `Kolonisté\n\nTotal: ${w.actors.length}\nIdle: ${idle}\nWorking: ${working}\n\nAuto-assign na nejbližší task.\nKlik na řádek = detail (P2+).`;
    };
    for (const row of this.rows) {
      tooltips.attach(row.dot, provider);
      tooltips.attach(row.name, provider);
    }
  }

  render(): void {
    // Demo mapping barevných kuliček — 6 barev pro vizuální ladění.
    // Produkční sémantika přijde s reálnými statusy.
    const demoColors = [
      UI_DOT_ONLINE,
      UI_DOT_WORKING,
      UI_DOT_NPC,
      UI_DOT_WARN,
      UI_DOT_ALERT,
      UI_DOT_IDLE,
    ];
    const actors = this.getWorld().actors;
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      const row = this.rows[i];
      if (!a || !row) continue;
      const def = ACTOR_DEFS[a.kind];
      const tag = a.state === "working" ? `→ ${a.taskId ?? "?"}` : "idle";
      const idCell = a.id.padEnd(7);
      row.dot.setColor(demoColors[i % demoColors.length] ?? UI_DOT_IDLE);
      row.name.setText(`${idCell}${def.power_w}W  ${tag}`);
    }
  }
}
