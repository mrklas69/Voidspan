// Panel header helper — odlišuje hlavičky bočních panelů (ACTORS / TASK QUEUE / INSPECTOR).
// Vrací Y pod podtržením — callers tam umístí první řádek obsahu.
// Sdílený mezi ActorsPanel, TaskQueuePanel, InspectorPanel.

import Phaser from "phaser";
import { FONT_FAMILY, FONT_SIZE_PANEL_HEADER, UI_BORDER_DIM } from "../palette";
import { COL_TEXT_ACCENT } from "./layout";

export function createPanelHeader(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  width: number,
): number {
  scene.add.text(x, y, text, {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_PANEL_HEADER,
    color: COL_TEXT_ACCENT,
  });
  // Podtržení — tenká linka pod labelem v dim barvě.
  const underlineY = y + 26;
  scene.add.rectangle(x, underlineY, width, 1, UI_BORDER_DIM).setOrigin(0, 0);
  return underlineY + 6; // padding pod podtržením
}
