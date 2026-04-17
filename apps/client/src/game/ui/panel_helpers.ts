// Sdílené konstanty + LS pref helpery + text ellipsize pro floating panely
// (info_panel, modules_panel, event_log, task_queue).
// Kompromisní DRY (S28, audit F2): full FloatingPanel base class odložen na
// 5. panel — zatím extrahované jen sdílené konstanty + LS pref load/save.

import type Phaser from "phaser";

// === Sdílené konstanty (S22 + S24 floating panel layout axiom) ===

export const PANEL_DEPTH = 1500;
export const PANEL_MARGIN = 12;
export const PANEL_PADDING = 12;
export const PANEL_BG_ALPHA = 0.9;
export const PANEL_HEADER_H = 40;

// S29 fixed 2×2 layout: I+E nahoře, M+T dole. Mutex pairs zrušeny, všechny 4
// panely mohou být otevřené současně.
// Výška bumpnutá o 30 % (282 → 367) — panely přesahují přes Log bar při
// baseline 720, uživatel zvětší okno pro full view. Všechny 4 panely sdílejí
// PANEL_HALF_H a PANEL_WIDTH_STD (stejně vysoké + stejně široké).
export const PANEL_HALF_H = 367;
export const PANEL_VERT_GAP = 12;
export const PANEL_WIDTH_STD = 460;

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

// === Text ellipsize (S29) =================================================
//
// Když řádek v 1-line log panelu (event_log, task_queue) přeteče šířku,
// místo zalamování ho ořízneme a přidáme "…" na konec. Pure algoritmus níže
// je testovatelný (měřicí funkce jako parametr); Phaser wrapper volá setText
// několikrát během binary search (O(log N)) — acceptable pro on-demand render.

const ELLIPSIS = "…";

// Pure logika — binary search nejdelšího prefixu který se vejde s "…".
// Injected `measure` umožňuje testy bez Phaser (mock char-width).
export function ellipsizePrefix(
  full: string,
  maxW: number,
  measure: (s: string) => number,
): string {
  if (full.length === 0 || measure(full) <= maxW) return full;
  let lo = 0;
  let hi = full.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(full.slice(0, mid) + ELLIPSIS) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return full.slice(0, lo) + ELLIPSIS;
}

// Phaser wrapper — in-place setText + width measurement binary search.
// Pokud se full vejde, jen 1× setText; jinak ~log2(N) setText volání.
// Návrat: `true` pokud byla aplikovaná ellipsizace (full text byl příliš široký),
// `false` jinak. Callee může použít k rozhodnutí, zda ukázat tooltip s plnou verzí.
export function ellipsizeText(
  t: Phaser.GameObjects.Text,
  full: string,
  maxW: number,
): boolean {
  t.setText(full);
  if (full.length === 0 || t.width <= maxW) return false;
  let lo = 0;
  let hi = full.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    t.setText(full.slice(0, mid) + ELLIPSIS);
    if (t.width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  t.setText(full.slice(0, lo) + ELLIPSIS);
  return true;
}
