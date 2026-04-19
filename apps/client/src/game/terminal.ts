// QM Communication Terminal (S32) — modální dialog QuarterMastera.
//
// Kánon: IDEAS §QM Communication Terminal — varianta A (template, no AI).
// FVP role: nahrazuje Welcome dialog jako onboarding UX. QM ve `v2.3` persona
// vysílá read-only úvodní briefing Pozorovateli.
//
// Auto-open při prvním spuštění (LS flag); manuálně přes [Q] kdykoli.
// Využívá existující ModalManager — žádný vlastní scroll/layout.

import type { World } from "@voidspan/shared";

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

// Jednosloupcový formát — boot sekvence + milestones. Milestones čteny z
// `world.milestones` (S38 — jediný zdroj pravdy sdílený s UI milestone barem).
// Status mapování na ASCII tag: done = [OK], current = [Probíhá...],
// planned = [—]. Runtime briefing blok (odsazené řádky s E/W/S/F snapshotem)
// retirován v S38 — kvintet Top Baru a milestone bar nesou stejnou info
// live, duplikace v modalu byla zbytečná.
const STATUS_TAG_CS: Record<"done" | "current" | "planned", string> = {
  done: "[OK]",
  current: "[Probíhá...]",
  planned: "[—]",
};

export function buildTerminalBody(w: World): string {
  // Milestone řádky — ty s datem prefixujeme datem, ostatní (planned) jen label.
  const milestoneLines = w.milestones.map((m) => {
    const tag = STATUS_TAG_CS[m.status];
    const prefix = m.date_cs ? `${m.date_cs} ` : "";
    return `${prefix}${m.label_cs} ${tag}`;
  }).join("\n");

  return (
    `Voidspan v1.1 Observer Edition\n` +
    `BOOT... QuarterMaster v2.3 online\n` +
    `pozorovatel read-only (${OBSERVER_ID})\n` +
    `${milestoneLines}\n` +
    `>`
  );
}
