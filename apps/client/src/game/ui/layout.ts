// Layout konstanty — sdílené napříč UI panely.
// Odpovídá §16 UI wireframe: 1280×720 canvas, Top Bar + Mid Panel + Bottom Bar.
// Všechny hodnoty v px. Single-source-of-truth pro všechny panely.

import {
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  UI_TEXT_ACCENT,
  UI_SELECT_STROKE,
  UI_PANEL_BG,
} from "../palette";

// === Canvas ==================================================================

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// === Top Bar (HUD) ==========================================================

// 1-řádkový Top Bar — identity + čas + resource bars + Help.
export const HUD_H = 60;
export const HUD_ROW_Y = 18;

// === Bottom Bar (Log ticker) =================================================

export const LOG_H = 60;

// === Mid zone (herní plocha) ================================================

export const MID_Y = HUD_H; // 60
export const MID_H = CANVAS_H - HUD_H - LOG_H; // 600

// === Actors (left column) ===================================================

export const ACTORS_W = 150;
export const ACTORS_X = 0;

// === Task Queue + Inspector (right column) ==================================

export const TASKQUEUE_W = 250;
export const TASKQUEUE_X = CANVAS_W - TASKQUEUE_W; // 1030

// === Segment grid (center, 8×2 tiles) =======================================

export const TILE_NATIVE = 40;
export const TILE_SCALE = 2;
export const TILE_PX = TILE_NATIVE * TILE_SCALE; // 80
export const SEGMENT_W = 8 * TILE_PX; // 640
export const SEGMENT_H = 2 * TILE_PX; // 160
export const SEGMENT_X = (CANVAS_W - SEGMENT_W) / 2; // 320
export const SEGMENT_Y = MID_Y + (MID_H - SEGMENT_H) / 2; // 340

// === Barvy (aliasy z palety — axiom Voidspan 16) =============================

export const COL_PANEL_BG = UI_PANEL_BG;
export const COL_TILE_SELECTED = UI_SELECT_STROKE;
export const COL_TEXT = UI_TEXT_PRIMARY;
export const COL_TEXT_DIM = UI_TEXT_DIM;
export const COL_TEXT_ACCENT = UI_TEXT_ACCENT;
