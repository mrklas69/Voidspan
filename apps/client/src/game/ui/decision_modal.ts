// DecisionModal (S39) — kapitánovo rozhodnutí při QM deadlocku.
// Dedikovaný modal s N tlačítky (kandidáti k obětování), každé ukazuje
// recovery estimate. Otevírá se automaticky při `w.pendingDecision !== null`,
// volba → chooseSacrifice + close.
//
// UI pattern:
//   Overlay (tmavý) + center panel (fix 520×auto) + title + message + tlačítka
//   vertikálně s per-kandidát popisem „KIND (id) → +X Solids, +Y Fluids".
//
// Žádný Close button — rozhodnutí je povinné, modal drží fokus dokud nevolíš.
// ESC neakceptován (memory: ESC je globální bezpečný odchod, ale zde by hráč
// mohl obejít rozhodnutí → skip).

import Phaser from "phaser";
import type { World } from "@voidspan/shared";
import { getSacrificeCandidates, chooseSacrifice, type SacrificeCandidate } from "@voidspan/shared";
import {
  UI_BORDER_DIM,
  UI_OVERLAY_BLACK,
  COL_HULL_DARK,
  UI_TEXT_PRIMARY,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
  HEX_AMBER_BRIGHT,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
  FONT_SIZE_TIP,
} from "../palette";
import { PANEL_BG_ALPHA } from "./panel_helpers";

const DEPTH = 2000; // stejná vrstva jako ModalManager
const PANEL_W = 520;
const PADDING = 24;
const BTN_H = 44;
const BTN_GAP = 10;
const OVERLAY_ALPHA = 0.4; // silnější než běžný modal — dramatičtější scéna

export class DecisionModal {
  private scene: Phaser.Scene;
  private getWorld: () => World;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private open_ = false;

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    this.scene = scene;
    this.getWorld = getWorld;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.close());
  }

  isOpen(): boolean { return this.open_; }

  // Otevře modal pokud je pendingDecision nastaveno a ještě není open. Volat
  // v GameScene.update() jako reaktivní watcher (cheap idempotent check).
  sync(): void {
    const w = this.getWorld();
    if (w.pendingDecision === null && this.open_) {
      // Rozhodnutí už proběhlo (test / externí clear) — zavři.
      this.close();
      return;
    }
    if (w.pendingDecision !== null && !this.open_) {
      this.open();
    }
  }

  private open(): void {
    if (this.open_) return;
    this.open_ = true;
    const w = this.getWorld();
    const candidates = getSacrificeCandidates(w);

    const cw = this.scene.scale.width;
    const ch = this.scene.scale.height;

    // Overlay — tmavší než standard modal (drama).
    const overlay = this.scene.add
      .rectangle(0, 0, cw, ch, UI_OVERLAY_BLACK, OVERLAY_ALPHA)
      .setOrigin(0, 0)
      .setDepth(DEPTH)
      .setInteractive(); // blokuj kliky do hry
    this.layer.push(overlay);

    // Panel — hp_dark pozadí + jemný okraj.
    const title = "ROZHODNUTÍ KAPITÁNA";
    const msg = "Protokol uvízl — chybí zdroje pro rozestavěnou stavbu.\nKterý modul obětovat pro recovery?";
    const msgLines = msg.split("\n").length;
    const btnTotalH = candidates.length * (BTN_H + BTN_GAP);
    const contentH = PADDING + 28 /* title */ + 12 + msgLines * 22 + 18 + btnTotalH + PADDING;
    const panelH = contentH;
    const panelX = Math.floor((cw - PANEL_W) / 2);
    const panelY = Math.floor((ch - panelH) / 2);

    const bg = this.scene.add
      .rectangle(panelX, panelY, PANEL_W, panelH, COL_HULL_DARK, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 1)
      .setStrokeStyle(1, UI_BORDER_DIM, 1);
    this.layer.push(bg);

    // Title.
    const titleText = this.scene.add
      .text(panelX + PADDING, panelY + PADDING, title, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2);
    this.layer.push(titleText);

    // Message.
    const msgY = panelY + PADDING + 28 + 12;
    const msgText = this.scene.add
      .text(panelX + PADDING, msgY, msg, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
        color: UI_TEXT_PRIMARY,
        wordWrap: { width: PANEL_W - 2 * PADDING },
      })
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2);
    this.layer.push(msgText);

    // Tlačítka — per kandidát.
    const btnStartY = msgY + msgLines * 22 + 18;
    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i]!;
      const by = btnStartY + i * (BTN_H + BTN_GAP);
      this.createButton(panelX + PADDING, by, PANEL_W - 2 * PADDING, cand);
    }

    // Pokud žádní kandidáti (extrémní scénář), zobraz hlášku.
    if (candidates.length === 0) {
      const none = this.scene.add
        .text(panelX + PADDING, btnStartY, "Žádný obětovatelný modul. Kolonie uvízla.", {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_TIP,
          color: UI_TEXT_ACCENT,
        })
        .setOrigin(0, 0)
        .setDepth(DEPTH + 2);
      this.layer.push(none);
    }
  }

  // Tlačítko s recovery estimate — klik obětuje modul.
  private createButton(x: number, y: number, w: number, cand: SacrificeCandidate): void {
    const btn = this.scene.add
      .rectangle(x, y, w, BTN_H, COL_HULL_DARK, 0.85)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2)
      .setStrokeStyle(1, UI_BORDER_DIM, 1)
      .setInteractive({ useHandCursor: true });
    this.layer.push(btn);

    const label = this.formatButtonLabel(cand);
    const labelText = this.scene.add
      .text(x + 12, y + BTN_H / 2, label, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
        color: UI_TEXT_PRIMARY,
      })
      .setOrigin(0, 0.5)
      .setDepth(DEPTH + 3);
    this.layer.push(labelText);

    btn.on("pointerover", () => {
      btn.setStrokeStyle(2, UI_SELECT_STROKE, 1);
      labelText.setColor(HEX_AMBER_BRIGHT);
    });
    btn.on("pointerout", () => {
      btn.setStrokeStyle(1, UI_BORDER_DIM, 1);
      labelText.setColor(UI_TEXT_PRIMARY);
    });
    btn.on("pointerdown", () => {
      const ok = chooseSacrifice(this.getWorld(), cand.moduleId);
      if (ok) this.close();
    });
  }

  // „Solar (solar_2) → +20 Solids" / „MedCore (medcore_1) → +40 Solids, +24 Fluids"
  private formatButtonLabel(cand: SacrificeCandidate): string {
    const parts: string[] = [];
    if (cand.recoverySolids > 0) parts.push(`+${Math.round(cand.recoverySolids)} Solids`);
    if (cand.recoveryFluids > 0) parts.push(`+${Math.round(cand.recoveryFluids)} Fluids`);
    const gain = parts.length > 0 ? parts.join(", ") : "(bez recovery)";
    return `${cand.kind} (${cand.moduleId}) → ${gain}`;
  }

  private close(): void {
    if (!this.open_) return;
    this.open_ = false;
    for (const obj of this.layer) obj.destroy();
    this.layer = [];
  }
}
