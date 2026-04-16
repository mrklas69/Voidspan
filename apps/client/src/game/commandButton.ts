// CommandButton — opakovaně použitelné tlačítko pro paletu příkazů.
// Používá axiom palety (UI_PANEL_BG + UI_BORDER_DIM + UI_TEXT_PRIMARY).
// Hover highlight, click → callback. Volitelný tooltip přes TooltipManager.
//
// Použití:
//   createCommandButton(scene, x, y, "Launch Asteroid", () => {...}, tooltips?, tooltipText?)

import Phaser from "phaser";
import {
  UI_PANEL_BG,
  UI_BORDER_DIM,
  UI_TEXT_PRIMARY,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
  FONT_FAMILY,
  FONT_SIZE_PANEL,
} from "./palette";
import type { TooltipManager } from "./tooltip";

export interface CommandButtonOptions {
  width?: number;
  height?: number;
  tooltip?: TooltipManager;
  tooltipText?: string;
}

export function createCommandButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: CommandButtonOptions = {},
): void {
  const w = opts.width ?? 160;
  const h = opts.height ?? 36;

  // Border (outer) + bg (inner 1px inset) — stejný trik jako tooltip/modal.
  const border = scene.add
    .rectangle(x, y, w, h, UI_BORDER_DIM)
    .setOrigin(0, 0);
  const bg = scene.add
    .rectangle(x + 1, y + 1, w - 2, h - 2, UI_PANEL_BG)
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(x + w / 2, y + h / 2, label, {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_PANEL,
      color: UI_TEXT_PRIMARY,
    })
    .setOrigin(0.5, 0.5);

  // Hover highlight: border se rozsvítí na amber bright, label zbělá.
  bg.on("pointerover", () => {
    border.setFillStyle(UI_SELECT_STROKE);
    text.setColor(UI_TEXT_ACCENT);
  });
  bg.on("pointerout", () => {
    border.setFillStyle(UI_BORDER_DIM);
    text.setColor(UI_TEXT_PRIMARY);
  });
  bg.on("pointerdown", () => onClick());

  // Tooltip attach na bg rect (nikoli text, ať funguje i mimo glyfy).
  if (opts.tooltip && opts.tooltipText) {
    const tt = opts.tooltipText;
    opts.tooltip.attach(bg, () => tt);
  }
}
