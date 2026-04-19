// Responsive Layout axiom (S24, KISS revize):
// Canvas = viewport. Všechny UI velikosti fix (HUD 60, LOG 60, BAY_PX 80, PANEL_W 420).
// Resize přepočítá jen CANVAS_W/H a re-centruje BELT. Nic se nelerpuje. Text v panelech
// zůstává fixních 18px; při malém okně panely přetékají — user zvětší okno.

import {
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
} from "../palette";

// === Canvas — aktualizováno v recomputeLayout() při každém resize ============

export let CANVAS_W = 1280;
export let CANVAS_H = 720;

// === Fixní rozměry ===========================================================

export const HUD_H = 60;
export const HUD_ROW_Y = 18;
export const LOG_H = 60;

// BAY_PX = render velikost bay v px. Historicky odvozeno z pixel art 40×40
// zdrojů × scale 2 (BAY_NATIVE/BAY_SCALE retirovány s PNG pipeline v S36).
export const BAY_PX = 80;
export const SEGMENT_W = 8 * BAY_PX; // 640
export const SEGMENT_H = 2 * BAY_PX; // 160

// === Animace — sdílené konstanty =============================================
// Pulse perioda UI = sjednocený „srdeční tep" napříč komponentami (ship_render
// outline pulse u active tasku + milestone_bar current chip). 2 s perioda,
// alpha yoyo sin. Derivovaná hodnota pro Math.sin(time * RAD_PER_MS).
export const UI_PULSE_RAD_PER_MS = (2 * Math.PI) / 2000;
export const UI_PULSE_ALPHA_MIN = 0.5;

// === Pozice — přepočítané při resize =========================================
// MID_Y/MID_H jsou interní pouze (derivace SEGMENT_Y); není veřejný konzument.

let MID_Y = HUD_H;
let MID_H = CANVAS_H - HUD_H - LOG_H;
export let SEGMENT_X = (CANVAS_W - SEGMENT_W) / 2;
export let SEGMENT_Y = MID_Y + (MID_H - SEGMENT_H) / 2;

// === Recompute ===============================================================

export function recomputeLayout(vw: number, vh: number): void {
  CANVAS_W = Math.max(1, Math.floor(vw));
  CANVAS_H = Math.max(1, Math.floor(vh));
  MID_Y = HUD_H;
  MID_H = Math.max(0, CANVAS_H - HUD_H - LOG_H);
  SEGMENT_X = Math.max(0, Math.round((CANVAS_W - SEGMENT_W) / 2));
  SEGMENT_Y = Math.round(MID_Y + (MID_H - SEGMENT_H) / 2);
}

// Setter pro DockManager — segment se re-centruje dle otevřených panelů.
// Volá se z DockManager.onChange listeneru v ShipRender + z GameScene.handleResize.
export function setSegmentX(x: number): void {
  SEGMENT_X = Math.max(0, Math.round(x));
}

// === Barvy (aliasy z palety — axiom Voidspan 16) =============================

export const COL_BAY_SELECTED = UI_SELECT_STROKE;
export const COL_TEXT = UI_TEXT_PRIMARY;
export const COL_TEXT_DIM = UI_TEXT_DIM;
export const COL_TEXT_ACCENT = UI_TEXT_ACCENT;
