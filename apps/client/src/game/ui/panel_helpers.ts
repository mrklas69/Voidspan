// Sdílené konstanty + LS pref helpery pro 4 floating panely
// (info_panel, modules_panel, event_log, task_queue).
// Kompromisní DRY (S28, audit F2): full FloatingPanel base class odložen na
// 5. panel — zatím extrahované jen sdílené konstanty + LS pref load/save.

// === Sdílené konstanty (S22 + S24 floating panel layout axiom) ===

export const PANEL_DEPTH = 1500;
export const PANEL_MARGIN = 12;
export const PANEL_PADDING = 12;
export const PANEL_BG_ALPHA = 0.9;
export const PANEL_HEADER_H = 40;

// Scrollbar — sdílená geometrie (info_panel, modules_panel, event_log, task_queue).
export const SCROLLBAR_W = 8;
export const SCROLLBAR_GAP = 4;
export const SCROLL_STEP = 24;

// === LS persistence helpery ============================================
//
// Per-panel klíč drží otevřenost přes refresh. Try/catch chrání před incognito
// (kde localStorage hází). Návratová hodnota false v obou error path = panel
// startuje zavřený, což je bezpečný default (uživatel ho otevře hotkey).

export function loadPanelOpenPref(lsKey: string): boolean {
  try { return localStorage.getItem(lsKey) === "1"; } catch { return false; }
}

export function savePanelOpenPref(lsKey: string, open: boolean): void {
  try { localStorage.setItem(lsKey, open ? "1" : "0"); } catch { /* incognito */ }
}
