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
export const UI_BRAND_ICON     = HEX_WARN_ORANGE;       // O ikona AppName — křiklavá oranžová (S27: ⊙ → O, font fix)

// Overlay axiom (S19) — modální dim + bay trajectory overlay.
// Černá zatmívací vrstva pod modalem/dialogem (alpha se nastavuje v modal.ts).
// Cíl: jediný zdroj pro jakýkoliv full-screen dim, bez ad-hoc 0x000000 v kódu.
export const UI_OVERLAY_BLACK  = 0x000000;              // modal/dialog dim — vždy s alpha < 1

// Phaser mask graphics flag — bílá = viditelná oblast masky.
// NIKOLI vizuální barva (není v 16-color paletě). Drží paletový axiom
// „zero hex literals outside palette" pro mask use case (alpha-clipping panelů).
export const UI_MASK_WHITE     = 0xffffff;

// Bay trajectory overlay barvy (S18 orange trajectory axiom, segment.ts).
// Oranžová = static missing HP, zelená = rising (repair/build), červená = falling (demolish).
// Vychází ze status akcentů palety — žádné duplicitní saturace.
export const UI_TRAJ_STATIC    = COL_WARN_ORANGE;       // static missing HP (čistě oranžová pulsuje)
export const UI_TRAJ_RISING    = COL_OK_GREEN;          // repair/build → HP roste
export const UI_TRAJ_FALLING   = COL_ALERT_RED;         // demolish → HP klesá

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
// 2b. Dashboard semafor (S25) — 5-color rating pro UI metriky
// ============================================================================
// Kánon: UI ukazatel s barvou odvozuje barvu ze stejné metriky, kterou zobrazuje
// (feedback_indicator_color_same_metric). Pět kbelíků dle `statusRating(pct)`:
// < 15 % red, < 40 % orange, < 60 % amber, < 80 % cyan, ≥ 80 % green.
// Tooltip headery (TooltipContent.headerColor) i Top Bar dashboard bary čerpají
// stejnou mapu — barva v baru = barva v headeru.
//
// Re-export prahů z tuning.ts pro world.ts toLevel() (3-state status node level).

import { THRESHOLD_CRIT_PCT, THRESHOLD_WARN_PCT } from "./tuning";
import { statusRating, type StatusRating } from "./model";
export { THRESHOLD_CRIT_PCT, THRESHOLD_WARN_PCT };

// 5stavový semafor hodnocení (S23). Izomorfní s StatusRating z model.ts.
// Sdíleno mezi Top Bar, InfoPanel, Tooltips, Event Log (SIGN).
export const RATING_COLOR: Record<StatusRating, string> = {
  5: HEX_OK_GREEN,       // Excellent — zelená
  4: HEX_COOLANT_CYAN,   // Good — cyan
  3: HEX_WARN_AMBER,     // Fair — amber
  2: HEX_WARN_ORANGE,    // Poor — oranžová
  1: HEX_ALERT_RED,      // Failure — červená
};

// Přímá pct→color projekce pro místa, kde nepotřebujeme zvlášť rating label.
export function ratingColor(pct: number): string {
  return RATING_COLOR[statusRating(pct)];
}

// ============================================================================
// 3. Typografie — Atkinson Hyperlegible size scale (style-guide §2)
// ============================================================================
// Atkinson Hyperlegible (Google Fonts, OFL) — sans navržený Braille Institutem
// pro max čitelnost, plná podpora české diakritiky. Upgrade z VT323 (pixelart
// CRT), který byl cool, ale přetejkal a byl nečitelný v malých velikostech.
// Fallback: IBM Plex Mono (viz index.html komentář). Drž tyto velikosti, jinak
// rozbiješ rytmus UI. Jednotky px, tak jak je přijímá Phaser Text a CSS.

export const FONT_FAMILY    = '"Atkinson Hyperlegible", system-ui, sans-serif';
// S28: 3-level hierarchie (sjednocení napříč). Větší = vnější, menší = vnitřní.
//   CHROME — Top Bar + Bottom Bar (vnější chrome aplikace)
//   PANEL  — všechny floating panely (Info/Moduly/Události/Úkoly), Help modal, welcome
//   TIP    — tooltipy + footer/btn/hint texty (nejmenší čitelný)
// S29 Atkinson bump -2 px: sans má větší x-height než VT323 → menší velikost
// vypadá stejně čitelně a textů se vejde víc.
export const FONT_SIZE_CHROME    = "22px"; // Top Bar, Bottom Bar
export const FONT_SIZE_PANEL     = "20px"; // modal, welcome, commandButton, ActorsPanel
export const FONT_SIZE_SIDEPANEL = "18px"; // boční panely I / M / E / T (-2 px vůči PANEL, vyšší hustota dat)
export const FONT_SIZE_TIP       = "18px"; // tooltipy + drobné texty (footer, btn, hotkey hints)
