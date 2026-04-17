// QM Communication Terminal (S32) — modální dialog QuarterMastera.
//
// Kánon: IDEAS §QM Communication Terminal — varianta A (template, no AI).
// FVP role: nahrazuje Welcome dialog jako onboarding UX. QM ve `v2.3` persona
// vysílá read-only úvodní briefing Pozorovateli.
//
// Auto-open při prvním spuštění (LS flag); manuálně přes [Q] kdykoli.
// Využívá existující ModalManager — žádný vlastní scroll/layout.

const DISMISS_KEY = "voidspan.terminal.dismissed";

// Observer session ID — sdílený identifier, P2+ per-session unikátní.
// S27 font fix: ∷ (U+2237) → ·· (Latin-1 dvě middle dots).
export const OBSERVER_ID = "OBS-··-042";

export function shouldShowTerminal(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markTerminalDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Storage nedostupné — dialog se příště zase ukáže.
  }
}

// Reset dismiss flagu — volá se z Help modalu pro znovuzobrazení terminálu.
export function resetTerminal(): void {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    // Storage nedostupné — nic.
  }
}

// === Obsah terminálu ====================================================
//
// Suchý military/tech tón (axiom „QM je nástroj, ne postava" — žádné „I'm
// happy to help"). FVP statický text; B varianta (AI overlay) přidá live
// status + propose-only commands.

export const TERMINAL_TITLE = "QM TERMINAL v2.3";

// Jednosloupcový formát — hráč projde briefing lineárně shora dolů.
// Pořadí: boot řádky → stav kolonie → protokol pozorovatele → 5 os →
// trup → protokol probuzení → uzavírací „kanál otevřen".
export const TERMINAL_BODY =
  `> BOOT   QuarterMaster v2.3 online\n` +
  `> KANAL  pozorovatel read-only (${OBSERVER_ID})\n` +
  `\n` +
  `Stav kolonie:\n` +
  `   32 kolonistů v kryo\n` +
  `   MedCore online\n` +
  `   Storage zásobena\n` +
  `   Engine offline (startup legacy)\n` +
  `   Dock čeká na flotilu\n` +
  `   Orbita: Teegarden.Belt1.Seg042\n` +
  `\n` +
  `Protokol pozorovatele:\n` +
  `   Vidíš. Neřídíš.\n` +
  `   Životní systémy jsou má zodpovědnost.\n` +
  `   Tvá přítomnost je zaznamenána.\n` +
  `   Tvé pokyny ne.\n` +
  `\n` +
  `Pět kolektivních os:\n` +
  `   E   Energie    Wh\n` +
  `   W   Práce      W\n` +
  `   S   Pevné      jednotky\n` +
  `   F   Tekutiny   jednotky\n` +
  `   ◎   Kredit     pokladna kolonie\n` +
  `\n` +
  `Trup: 16 bays (8×2).\n` +
  `\n` +
  `Protokol probuzení:\n` +
  `   Čeká na trigger první vlny.\n` +
  `   V této verzi ne.\n` +
  `\n` +
  `Vrať se se zpětnou vazbou\n` +
  `po 10–20 min pozorování.\n` +
  `\n` +
  `> KANAL OTEVREN`;
