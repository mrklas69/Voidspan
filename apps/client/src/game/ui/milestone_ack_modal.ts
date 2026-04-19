// MilestoneAckModal (S39) — potvrzení dokončeného milníku.
// Auto-open při `firstPendingAck(w) !== null` (watcher v GameScene.update).
// Tón suchý/oznamovací (Voidspan narrativní hlas, ne celebration).
//
// Obsah: title „MILNÍK SPLNĚN" + label + datum (pokud je) + desc + [OK].
// Klik OK → flip `milestone.acked = true` → další tick může fire další milestone.

import Phaser from "phaser";
import type { World } from "@voidspan/shared";
import { firstPendingAck } from "@voidspan/shared";
import {
  UI_BORDER_DIM,
  UI_OVERLAY_BLACK,
  COL_HULL_DARK,
  UI_TEXT_PRIMARY,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
  HEX_AMBER_BRIGHT,
  HEX_OK_GREEN,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
  FONT_SIZE_TIP,
} from "../palette";
import { PANEL_BG_ALPHA } from "./panel_helpers";

const DEPTH = 2000;
const PANEL_W = 520;
const PADDING = 24;
const BTN_W = 120;
const BTN_H = 40;
const OVERLAY_ALPHA = 0.25; // lehčí než DecisionModal (pozitivní ohláška, ne drama)

export class MilestoneAckModal {
  private scene: Phaser.Scene;
  private getWorld: () => World;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private open_ = false;
  private shownMilestoneId: string | null = null;
  // Stabilní reference klávesových handlerů pro on()/off() pair. `once` byl
  // bug: při myším ack handler nefiroval, zůstal registrovaný. Další modal
  // otevření přidal druhý listener → ack pro stale shownMilestoneId → repeat.
  private readonly ackHandler = () => this.ack();

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    this.scene = scene;
    this.getWorld = getWorld;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.close());
  }

  isOpen(): boolean { return this.open_; }

  // Reaktivní watcher — volat v GameScene.update. Otevře modal, pokud existuje
  // unacked done milestone a ještě není open. Po ack zavře a nechá další tick
  // případně otevřít další.
  sync(): void {
    const pending = firstPendingAck(this.getWorld());
    if (!pending && this.open_) {
      this.close();
      return;
    }
    if (pending && !this.open_) {
      this.open(pending.id);
    }
  }

  private open(milestoneId: string): void {
    if (this.open_) return;
    this.open_ = true;
    this.shownMilestoneId = milestoneId;
    const w = this.getWorld();
    const m = w.milestones.find((x) => x.id === milestoneId);
    if (!m) { this.open_ = false; return; }

    const cw = this.scene.scale.width;
    const ch = this.scene.scale.height;

    // Overlay.
    const overlay = this.scene.add
      .rectangle(0, 0, cw, ch, UI_OVERLAY_BLACK, OVERLAY_ALPHA)
      .setOrigin(0, 0)
      .setDepth(DEPTH)
      .setInteractive();
    this.layer.push(overlay);

    // Panel.
    const title = "MILNÍK SPLNĚN";
    const datePart = m.date_cs ? ` · ${m.date_cs}` : "";
    const labelLine = `${m.label_cs}${datePart}`;
    const msgLines = Math.ceil(m.desc_cs.length / 60) + 2; // hrubý odhad pro wordWrap výšku
    const contentH = PADDING + 28 /*title*/ + 14 + 24 /*label*/ + 14 + msgLines * 22 + 24 + BTN_H + PADDING;
    const panelH = Math.max(220, contentH);
    const panelX = Math.floor((cw - PANEL_W) / 2);
    const panelY = Math.floor((ch - panelH) / 2);

    const bg = this.scene.add
      .rectangle(panelX, panelY, PANEL_W, panelH, COL_HULL_DARK, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 1)
      .setStrokeStyle(1, UI_BORDER_DIM, 1);
    this.layer.push(bg);

    // Title — green (positive acknowledgment).
    const titleText = this.scene.add
      .text(panelX + PADDING, panelY + PADDING, title, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: HEX_OK_GREEN,
      })
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2);
    this.layer.push(titleText);

    // Label + datum.
    const labelY = panelY + PADDING + 28 + 14;
    const labelText = this.scene.add
      .text(panelX + PADDING, labelY, labelLine, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2);
    this.layer.push(labelText);

    // Desc.
    const descY = labelY + 24 + 14;
    const descText = this.scene.add
      .text(panelX + PADDING, descY, m.desc_cs, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_TIP,
        color: UI_TEXT_PRIMARY,
        wordWrap: { width: PANEL_W - 2 * PADDING },
      })
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2);
    this.layer.push(descText);

    // [OK] button — center-anchored dole.
    const btnY = panelY + panelH - PADDING - BTN_H;
    const btnX = Math.floor(panelX + (PANEL_W - BTN_W) / 2);
    this.createOkButton(btnX, btnY);
  }

  private createOkButton(x: number, y: number): void {
    const btn = this.scene.add
      .rectangle(x, y, BTN_W, BTN_H, COL_HULL_DARK, 0.85)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2)
      .setStrokeStyle(1, UI_BORDER_DIM, 1)
      .setInteractive({ useHandCursor: true });
    this.layer.push(btn);

    const label = this.scene.add
      .text(x + BTN_W / 2, y + BTN_H / 2, "OK", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH + 3);
    this.layer.push(label);

    btn.on("pointerover", () => {
      btn.setStrokeStyle(2, UI_SELECT_STROKE, 1);
      label.setColor(HEX_AMBER_BRIGHT);
    });
    btn.on("pointerout", () => {
      btn.setStrokeStyle(1, UI_BORDER_DIM, 1);
      label.setColor(UI_TEXT_ACCENT);
    });
    btn.on("pointerdown", () => this.ack());

    // Enter / Space / ESC → ack (klávesové potvrzení, drží flow).
    // on() + shared handler reference → close() umí off() a listenery nepřežijí.
    const kb = this.scene.input.keyboard;
    if (kb) {
      kb.on("keydown-ENTER", this.ackHandler);
      kb.on("keydown-SPACE", this.ackHandler);
      kb.on("keydown-ESC", this.ackHandler);
    }
  }

  private ack(): void {
    if (!this.open_ || !this.shownMilestoneId) return;
    const w = this.getWorld();
    const m = w.milestones.find((x) => x.id === this.shownMilestoneId);
    if (m) m.acked = true;
    this.close();
  }

  private close(): void {
    if (!this.open_) return;
    this.open_ = false;
    this.shownMilestoneId = null;
    const kb = this.scene.input.keyboard;
    if (kb) {
      kb.off("keydown-ENTER", this.ackHandler);
      kb.off("keydown-SPACE", this.ackHandler);
      kb.off("keydown-ESC", this.ackHandler);
    }
    for (const obj of this.layer) obj.destroy();
    this.layer = [];
  }
}
