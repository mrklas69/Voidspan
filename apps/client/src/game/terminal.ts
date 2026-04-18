// QM Communication Terminal (S32) — modální dialog QuarterMastera.
//
// Kánon: IDEAS §QM Communication Terminal — varianta A (template, no AI).
// FVP role: nahrazuje Welcome dialog jako onboarding UX. QM ve `v2.3` persona
// vysílá read-only úvodní briefing Pozorovateli.
//
// Auto-open při prvním spuštění (LS flag); manuálně přes [Q] kdykoli.
// Využívá existující ModalManager — žádný vlastní scroll/layout.

import type { World } from "./model";
import { computeWork } from "./world";
import { SEED_CREW_CRYO } from "./tuning";

// Adresa trupu v Teegarden síti (S33 single-segment FVP — Release 2+ bude
// derivován z World.address po zavedení multi-segment beltu).
const SEGMENT_ADDRESS = "Teegarden.Belt1.Seg042";

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

export const TERMINAL_TITLE = "QM Terminal";

// Jednosloupcový formát — hráč projde briefing lineárně shora dolů.
// Builder bere World za argument a nahrazuje runtime metriky (E/W/S/F).
// {red! X} placeholder autorské kritičnosti — Phaser.Text v modalu nepodporuje
// per-inline barvu, proto KISS ASCII tag `[!! X]` izomorfní s `[OK]` pattern.
export function buildTerminalBody(w: World): string {
  const work = computeWork(w);
  const E = Math.round(w.resources.energy);
  const W = work.capMax;
  const S = Math.round(w.resources.solids);
  const F = Math.round(w.resources.fluids);
  return (
    `Voidspan v1.0 Observer Edition\n` +
    `BOOT... QuarterMaster v2.3 online\n` +
    `pozorovatel read-only (${OBSERVER_ID})\n` +
    `2387-04-16.12:14 Dokončení establish [OK]\n` +
    `2387-04-17.03:33 Dokončení Kontroly [OK]\n` +
    `   ${SEED_CREW_CRYO} kolonistů v kryo\n` +
    `   MedCore online\n` +
    `   Storage zásobena\n` +
    `   Engine offline (startup legacy)\n` +
    `   Orbita: ${SEGMENT_ADDRESS} [Nestabilní!!!]\n` +
    `   Energie ${E} Wh\n` +
    `   Práce ${W} Wh\n` +
    `   Pevné ${S}\n` +
    `   Tekuté ${F}\n` +
    `2387-04-17.14:47 Stabilizace orbity [OK]\n` +
    `2387-04-25.09:24 Zahájení oprav [Probíhá...]\n` +
    `>`
  );
}
