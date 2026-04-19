// Voidspan — Neon paleta (S35)
// Závazný vzorník (axiom) — jediný zdroj pravdy pro barvy a typografii v UI/rendereru.
// Vizuální reference: `apps/client/public/palette-preview.html` (dev: /palette-preview.html).
// Původní Hull & Amber preview: `apps/client/public/style-guide.html` (archiv).
//
// Barvy jsou k dispozici ve dvou formátech:
//   - `HEX_*` string (`"#rrggbb"`) pro Phaser Text color, CSS, log.
//   - `COL_*` number (`0xrrggbb`) pro Phaser fillStyle, strokeStyle, rectangle barvu.
//
// NIKDY nepoužívej ad-hoc hex literály v kódu — vždy přes tento modul.

// ============================================================================
// 1. Paleta — Neon výbojky na deep-space pozadí
// ============================================================================
// Historie:
//   S16b: #080808 (bg-near-black) sloučeno s #0a0a10 (void-black) — byly
//         k nerozeznání. UI_BG/UI_PANEL_BG nyní čtou z VOID_BLACK.
//   S16c: přidán coolant-cyan jako studený status akcent (voda/chladivo/led/štíty).
//   S35:  Hull & Amber → Neon. Rating semafor posunut do výbojkové rodiny
//         (zachována 5-kbelíková sémantika, pozice 4 přemapována z cyan na
//         lime-yellow — spojité hue od zelené přes amber k červené, bez skoku
//         do studené modré). Cyan zůstává v paletě jako Storage/Fluids kanon
//         (UI_STATUS_COOLANT), ale není rating barva. Brand amber pro UI chrome
//         zachován, jen saturovanější (#ffd060 → #ffd94a). Ship bude používat
//         per-kind hue (§1b KIND_*, 8 modulů) — to je doména ship_render (S35+).

// --- Svět: deep space, hull (01-07) ---
export const HEX_VOID_BLACK    = "#000510"; // 01 — téměř černá s modrým nádechem
export const HEX_HULL_DARK     = "#1a1e28"; // 02
export const HEX_HULL_MID      = "#2e3440"; // 03
export const HEX_HULL_LIGHT    = "#4c5462"; // 04
export const HEX_METAL_GRAY    = "#6a7080"; // 05
export const HEX_METAL_LIGHT   = "#8a8e98"; // 06
export const HEX_BRIGHT_METAL  = "#c0c4cc"; // 07

// --- Status: 5 neon výbojek + info-blue + coolant-cyan (08-14) ---
// Rating mapping 1-5 níže (RATING_COLOR). Sodium/plasma/solar/lime/mint rodina.
export const HEX_ALERT_RED     = "#ff2850"; // 08 — rate-1 · sodium plasma red
export const HEX_WARN_ORANGE   = "#ff6a1f"; // 09 — rate-2 · hot plasma orange
export const HEX_WARN_AMBER    = "#ffb020"; // 10 — rate-3 · solar amber
export const HEX_RATE_LIME     = "#b8ff2e"; // 11 — rate-4 · acid lime-yellow (S35 přemapování)
export const HEX_OK_GREEN      = "#39ff5e"; // 12 — rate-5 · electric mint-lime
export const HEX_INFO_BLUE     = "#4088c8"; // 13 — info/NPC (non-rating)
export const HEX_COOLANT_CYAN  = "#00e8ff"; // 14 — voda/chladivo/led/štíty + KIND_STORAGE

// --- UI / terminál: amber na tmavém (15-17) ---
export const HEX_AMBER_DIM     = "#8a6820"; // 15
export const HEX_AMBER_BRIGHT  = "#ffd94a"; // 16
export const HEX_TEXT_WHITE    = "#ffffff"; // 17

// --- Number varianty (0xrrggbb) pro Phaser primitives ---
export const COL_VOID_BLACK    = 0x000510;
export const COL_HULL_DARK     = 0x1a1e28;
export const COL_HULL_MID      = 0x2e3440;
export const COL_HULL_LIGHT    = 0x4c5462;
export const COL_METAL_GRAY    = 0x6a7080;
export const COL_METAL_LIGHT   = 0x8a8e98;
export const COL_BRIGHT_METAL  = 0xc0c4cc;
export const COL_ALERT_RED     = 0xff2850;
export const COL_WARN_ORANGE   = 0xff6a1f;
export const COL_WARN_AMBER    = 0xffb020;
export const COL_RATE_LIME     = 0xb8ff2e;
export const COL_OK_GREEN      = 0x39ff5e;
export const COL_INFO_BLUE     = 0x4088c8;
export const COL_COOLANT_CYAN  = 0x00e8ff;
export const COL_AMBER_DIM     = 0x8a6820;
export const COL_AMBER_BRIGHT  = 0xffd94a;
export const COL_TEXT_WHITE    = 0xffffff;

// ============================================================================
// 1b. Per-kind hue — 8 modulů (ship identity, S35)
// ============================================================================
// Každý modul kind má vlastní identity color (vlákno identity). Používá
// ship_render (S35+) — outline border + Phaser.FX.Glow. Status modulace
// (ONline/DAMAGED/OFFLINE/BUILD) vrstva nad kind hue, viz palette-preview §3.
// Pozor na kolize: CommandPost violet (ne green — konflikt s rate-5),
// Engine mint (ne green), MedCore cryo-blue (ne dock azure), Storage cyan
// sdílí hodnotu s HEX_COOLANT_CYAN (KISS, jeden kanonický tón pro „chlad").

export const HEX_KIND_HABITAT   = "#ff9438"; // warm orange · obývání
export const HEX_KIND_SOLAR     = "#ffd400"; // solar yellow · energie
export const HEX_KIND_STORAGE   = "#00e8ff"; // electric cyan · zásoby (= COOLANT_CYAN)
export const HEX_KIND_ASSEMBLER = "#ff3cc0"; // hot magenta · výroba
export const HEX_KIND_DOCK      = "#3090ff"; // electric azure · příjem kapslí
export const HEX_KIND_ENGINE    = "#00ffb0"; // mint teal · pohon
export const HEX_KIND_MEDCORE   = "#60b8ff"; // cryo blue · zdraví/cryo
export const HEX_KIND_COMMAND   = "#9b6cff"; // neon violet · velení

export const COL_KIND_HABITAT   = 0xff9438;
export const COL_KIND_SOLAR     = 0xffd400;
export const COL_KIND_STORAGE   = 0x00e8ff;
export const COL_KIND_ASSEMBLER = 0xff3cc0;
export const COL_KIND_DOCK      = 0x3090ff;
export const COL_KIND_ENGINE    = 0x00ffb0;
export const COL_KIND_MEDCORE   = 0x60b8ff;
export const COL_KIND_COMMAND   = 0x9b6cff;

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

export const UI_STATUS_ALERT   = HEX_ALERT_RED;         // DEAD:CRIT, damaged, fatal
export const UI_STATUS_WARN    = HEX_WARN_AMBER;        // warning threshold
export const UI_STATUS_INFO    = HEX_INFO_BLUE;         // dock, fleet, neutral
export const UI_STATUS_OK      = HEX_OK_GREEN;          // reserve (P2+)
export const UI_STATUS_COOLANT = HEX_COOLANT_CYAN;      // voda / chladivo / štíty (Fluids subtyp — P2+)

// ============================================================================
// 2b. Dashboard semafor (S25, S35 přemapování) — 5-color rating pro UI metriky
// ============================================================================
// Kánon: UI ukazatel s barvou odvozuje barvu ze stejné metriky, kterou zobrazuje
// (feedback_indicator_color_same_metric). Pět kbelíků dle `statusRating(pct)`:
// < 15 % red, < 40 % orange, < 60 % amber, < 80 % lime, ≥ 80 % mint-green.
// Tooltip headery (TooltipContent.headerColor) i Top Bar dashboard bary čerpají
// stejnou mapu — barva v baru = barva v headeru.
//
// S35: pozice 4 přemapována z cyan na lime-yellow (HEX_RATE_LIME). Rating rodina
// se teď táhne spojitě od green (5) přes amber (3) do red (1) bez skoku do
// studené modré. Cyan zůstává jako Storage/Fluids kanon (UI_STATUS_COOLANT,
// HEX_KIND_STORAGE), jen už není rating barva.
//
// Re-export prahů z tuning.ts pro world.ts toLevel() (3-state status node level).

import { THRESHOLD_CRIT_PCT, THRESHOLD_WARN_PCT } from "@voidspan/shared";
import { statusRating, type StatusRating } from "@voidspan/shared";
export { THRESHOLD_CRIT_PCT, THRESHOLD_WARN_PCT };

// 5stavový semafor hodnocení (S23, S35 posun do neon rodiny). Izomorfní
// s StatusRating z model.ts. Sdíleno mezi Top Bar, InfoPanel, Tooltips,
// Event Log (SIGN).
export const RATING_COLOR: Record<StatusRating, string> = {
  5: HEX_OK_GREEN,       // Excellent — electric mint-lime
  4: HEX_RATE_LIME,      // Good — acid lime-yellow (S35: přemapováno z cyan)
  3: HEX_WARN_AMBER,     // Fair — solar amber
  2: HEX_WARN_ORANGE,    // Poor — hot plasma orange
  1: HEX_ALERT_RED,      // Failure — sodium plasma red
};

// Přímá pct→color projekce pro místa, kde nepotřebujeme zvlášť rating label.
export function ratingColor(pct: number): string {
  return RATING_COLOR[statusRating(pct)];
}

// Number varianty rating mappingu (Phaser fillStyle/setTint potřebuje 0xrrggbb).
// Izomorfní s RATING_COLOR (HEX) — držíme paralelní dvojici jako u ostatních
// kanálů palette (HEX_* + COL_*).
export const RATING_COL: Record<StatusRating, number> = {
  5: COL_OK_GREEN,
  4: COL_RATE_LIME,
  3: COL_WARN_AMBER,
  2: COL_WARN_ORANGE,
  1: COL_ALERT_RED,
};

export function ratingColorNum(pct: number): number {
  return RATING_COL[statusRating(pct)];
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
//   PANEL  — všechny floating panely (Info/Moduly/Události/Úkoly), Help modal, QM terminál
//   TIP    — tooltipy + footer/btn/hint texty (nejmenší čitelný)
// S29 Atkinson bump -2 px: sans má větší x-height než VT323 → menší velikost
// vypadá stejně čitelně a textů se vejde víc.
export const FONT_SIZE_CHROME    = "22px"; // Top Bar, Bottom Bar
export const FONT_SIZE_PANEL     = "20px"; // commandButton, ActorsPanel (S33: modály přepnuty na SIDEPANEL)
export const FONT_SIZE_SIDEPANEL = "18px"; // boční panely I / M / E / T + modály (Help, QM Terminal)
export const FONT_SIZE_TIP       = "18px"; // tooltipy + drobné texty (footer, btn, hotkey hints)
