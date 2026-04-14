// Voidspan 16 — Hull & Amber
// Závazný vzorník (axiom) — jediný zdroj pravdy pro barvy a typografii v UI/rendereru.
// Vizuální reference: `apps/client/public/style-guide.html` (dev: /style-guide.html).
// Zdroj pro hand-pixel: `art/_palette.png` + `art/_palette.txt` (Paint.NET).
//
// Barvy jsou k dispozici ve dvou formátech:
//   - `HEX_*` string (`"#rrggbb"`) pro Phaser Text color, CSS, log.
//   - `COL_*` number (`0xrrggbb`) pro Phaser fillStyle, strokeStyle, rectangle barvu.
//
// NIKDY nepoužívej ad-hoc hex literály v kódu — vždy přes tento modul.

// ============================================================================
// 1. Paleta — 16 barev, 3 vrstvy
// ============================================================================
// Historie:
//   S16b: #080808 (bg-near-black) sloučeno s #0a0a10 (void-black) — byly
//         k nerozeznání. UI_BG/UI_PANEL_BG nyní čtou z VOID_BLACK.
//   S16c: přidán #40c0c0 (coolant-cyan) jako studený status akcent —
//         voda, chladivo, led, štíty, Flux.water/coolant subtypy.

// --- Svět: studený kov, void (01-07) ---
export const HEX_VOID_BLACK    = "#0a0a10"; // 01
export const HEX_HULL_DARK     = "#1a1e28"; // 02
export const HEX_HULL_MID      = "#2e3440"; // 03
export const HEX_HULL_LIGHT    = "#4c5462"; // 04
export const HEX_METAL_GRAY    = "#6a7080"; // 05
export const HEX_METAL_LIGHT   = "#8a8e98"; // 06
export const HEX_BRIGHT_METAL  = "#c0c4cc"; // 07

// --- Status: teplé + studené akcenty (08-13) ---
export const HEX_ALERT_RED     = "#ff4848"; // 08
export const HEX_WARN_ORANGE   = "#ff8020"; // 09
export const HEX_WARN_AMBER    = "#ffc030"; // 10
export const HEX_OK_GREEN      = "#60c060"; // 11
export const HEX_INFO_BLUE     = "#4088c8"; // 12
export const HEX_COOLANT_CYAN  = "#40c0c0"; // 13 — voda, chladivo, led, štíty

// --- UI / terminál: amber na tmavém (14-16) ---
export const HEX_AMBER_DIM     = "#b08030"; // 14
export const HEX_AMBER_BRIGHT  = "#ffd060"; // 15
export const HEX_TEXT_WHITE    = "#ffffff"; // 16

// --- Number varianty (0xrrggbb) pro Phaser primitives ---
export const COL_VOID_BLACK    = 0x0a0a10;
export const COL_HULL_DARK     = 0x1a1e28;
export const COL_HULL_MID      = 0x2e3440;
export const COL_HULL_LIGHT    = 0x4c5462;
export const COL_METAL_GRAY    = 0x6a7080;
export const COL_METAL_LIGHT   = 0x8a8e98;
export const COL_BRIGHT_METAL  = 0xc0c4cc;
export const COL_ALERT_RED     = 0xff4848;
export const COL_WARN_ORANGE   = 0xff8020;
export const COL_WARN_AMBER    = 0xffc030;
export const COL_OK_GREEN      = 0x60c060;
export const COL_INFO_BLUE     = 0x4088c8;
export const COL_COOLANT_CYAN  = 0x40c0c0;
export const COL_AMBER_DIM     = 0xb08030;
export const COL_AMBER_BRIGHT  = 0xffd060;
export const COL_TEXT_WHITE    = 0xffffff;

// ============================================================================
// 2. Sémantické aliasy — UI role (nikoli další barvy, jen pojmenované použití)
// ============================================================================
// Preferuj tyto aliasy v UI kódu. Když se paleta někdy upraví, stačí přebalit
// tenhle blok a sémantika drží. Direct COL_* jen pro pixel-art/debug.

export const UI_BG             = HEX_VOID_BLACK;        // panel background (hex)
export const UI_PANEL_BG       = COL_VOID_BLACK;        // panel background (number pro Phaser)
export const UI_BORDER_DIM     = COL_HULL_MID;          // zónové hranice
export const UI_TEXT_PRIMARY   = HEX_AMBER_BRIGHT;      // hlavní text, hodnoty
// UI_TEXT_DIM sloučeno s PRIMARY — zatím jednotná amber úroveň, jen ACCENT (bílá)
// odlišuje důležité (AppName, hlavičky panelů). Pokud se vrátí trojstupňová
// hierarchie, přepni zpět na HEX_AMBER_DIM.
export const UI_TEXT_DIM       = HEX_AMBER_BRIGHT;      // sjednoceno s primary
export const UI_TEXT_ACCENT    = HEX_TEXT_WHITE;        // nadpisy, důraz
export const UI_TEXT_HEADING   = HEX_TEXT_WHITE;        // synonym, readability

export const UI_SELECT_STROKE  = COL_AMBER_BRIGHT;      // klik výběr
export const UI_BAY_DAMAGED   = COL_ALERT_RED;         // damaged bay fill (alpha < 1)
export const UI_BRAND_ICON     = HEX_WARN_ORANGE;       // ⊙ ikona AppName — křiklavá oranžová

// Status dot palette — barevné kuličky v seznamech (Kolonisté, úkoly, události).
// Sémantika: (online/ok/busy/warn/alert/idle). Viz GLOSSARY → UI Layout → status dots.
export const UI_DOT_ONLINE     = HEX_OK_GREEN;          // online hráč, ready
export const UI_DOT_NPC        = HEX_INFO_BLUE;         // NPC, systémový actor
export const UI_DOT_WORKING    = HEX_AMBER_BRIGHT;      // pracuje, in-progress
export const UI_DOT_WARN       = HEX_WARN_ORANGE;       // warning, busy-over
export const UI_DOT_ALERT      = HEX_ALERT_RED;         // alert, offline, failed
export const UI_DOT_IDLE       = HEX_AMBER_DIM;         // idle, neaktivní

export const UI_STATUS_ALERT   = HEX_ALERT_RED;         // LOSS, damaged, fatal
export const UI_STATUS_WARN    = HEX_WARN_AMBER;        // warning threshold
export const UI_STATUS_INFO    = HEX_INFO_BLUE;         // dock, fleet, neutral
export const UI_STATUS_OK      = HEX_OK_GREEN;          // reserve (P2+)
export const UI_STATUS_COOLANT = HEX_COOLANT_CYAN;      // voda / chladivo / štíty (Flux.water/coolant)

// ============================================================================
// 2b. Dashboard semafor (S18) — globální prahy pro metriky v Top Baru a panelech
// ============================================================================
// Tříbarevný indikátor: red < CRIT ≤ orange < WARN ≤ green.
// Sjednoceno pro všechny metriky (Energy/Work/Slab/Flux/Coin atd.). Pro
// invertované metriky (utilizace, kde "vysoké = problém", např. Work)
// použij `metricColor(pct, true)` — interně přepočítá na 100-pct.
//
// Kompoziční pravidlo: parent metric color = nejhorší child (red > orange > green).

export const THRESHOLD_CRIT_PCT = 15;  // pod = red
export const THRESHOLD_WARN_PCT = 40;  // pod = orange, nad = green

// Helper: podle pct (0..100) vrátí HEX barvu pro Phaser Text.
// `inverted` = true pro utilizační metriky (Work) — vysoké pct = červeně.
export function metricColor(pct: number, inverted = false): string {
  const p = inverted ? 100 - pct : pct;
  if (p < THRESHOLD_CRIT_PCT) return HEX_ALERT_RED;
  if (p < THRESHOLD_WARN_PCT) return HEX_WARN_ORANGE;
  return HEX_OK_GREEN;
}

// ============================================================================
// 3. Typografie — Jersey 25 size scale (style-guide §2)
// ============================================================================
// Jersey 25 je pixel terminál font na 25-unit native gridu (Google Fonts, OFL).
// Vyšší rozlišení než VT323 → čitelnější na mobilu, drží retro vibe. Drž tyto
// velikosti, jinak rozbiješ rytmus UI. Jednotky px, tak jak je přijímá Phaser
// Text a CSS font-size.

export const FONT_FAMILY    = '"Jersey 25", monospace';
export const FONT_SIZE_HERO    = "48px"; // wordmark, title card
export const FONT_SIZE_H1      = "36px"; // screen heading
export const FONT_SIZE_H2      = "28px"; // section heading
export const FONT_SIZE_HUD     = "22px"; // HUD lišta, primární hodnoty
export const FONT_SIZE_BODY    = "20px"; // běžný text, task list
export const FONT_SIZE_LABEL   = "18px"; // popisky, caption, dim text
export const FONT_SIZE_HINT    = "16px"; // nejmenší čitelný — hotkeys, legenda
export const FONT_SIZE_PANEL_HEADER = "22px"; // hlavičky bočních panelů (ACTORS, TASK QUEUE…)
