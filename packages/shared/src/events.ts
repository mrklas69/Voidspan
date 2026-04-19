// Event Log — verb katalog, severity lookup, ring buffer push.
// Jediný zdroj pravdy pro verb→icon mapování a severity(verb, csq) funkci.
// Kánon: GLOSSARY §Event Log System (S20).

import type { Event, EventCsq, EventSeverity, EventVerb, World } from "./model";
import { EVENT_LOG_CAPACITY } from "./tuning";

// === Verb katalog ===

export type VerbEntry = {
  icon: string;
  label: string;
};

// S27 Font glyph fallback fix: ASCII / Latin-1 substituce za exotické Unicode
// glyphy, které latin-subset nemá. Bezpečné držet: `× · » − ¤`.
// S31: katalog zredukován z 25 → 9 (jen verby, které v FVP v0.7 reálně emituje).
export const VERB_CATALOG: Record<EventVerb, VerbEntry> = {
  SYST: { icon: "*",  label: "systémová událost" },
  DEAD: { icon: "x",  label: "aktér umřel" },
  DMG:  { icon: "×",  label: "damage" },
  DECY: { icon: "\\", label: "decay" },
  DRN:  { icon: "−",  label: "resource drain" },
  ASSN: { icon: "»",  label: "task assigned" },
  CMPL: { icon: "OK", label: "task completed" },
  SIGN: { icon: ">>", label: "signal — level change" },
  TASK: { icon: "#",  label: "změna stavu úkolu" },
};

// === Severity lookup ===
//
// Pure function: verb × csq → severity.
// Pravidla (GLOSSARY §Severity — barva):
//   crit:    DEAD:*, DMG:CRIT, DRN:CRIT
//   warn:    DECY:*, DMG:*, DRN:*
//   pos:     CMPL:OK
//   neutral: ASSN, SIGN, SYST
// S31: CRIT_VERBS.FAIL, POS_VERBS.WAKE, POS_ON_OK.{REPR,BLD,PROD} retirováno
// společně s verb retirem — viz EventVerb comment v model.ts.

const CRIT_VERBS: Set<EventVerb> = new Set(["DEAD"]);
const WARN_VERBS: Set<EventVerb> = new Set(["DECY"]);
const CRIT_OR_WARN_VERBS: Set<EventVerb> = new Set(["DMG", "DRN"]);
const POS_ON_OK: Set<EventVerb> = new Set(["CMPL"]);
// SYST:CRIT = terminal collapse (jednou emitovaný epitaph).
const CRIT_ON_CRIT: Set<EventVerb> = new Set(["SYST"]);

// === Event icon (csq-aware) ===
//
// Axiom „verb = ikona, text = subjekt" — ikona nese akční sémantiku
// (zahájeno/pauza/dokončeno), text drží jen subjekt (oprava/col_03/...).
// Tím se eliminuje redundance typu „OK Dokončena oprava" → „OK oprava".
// TASK event má csq-specifickou ikonu; ostatní verby čtou VERB_CATALOG.
export function eventIcon(ev: Event): string {
  if (ev.verb === "TASK") {
    if (ev.csq === "PAUSE") return "||";
    if (ev.csq === "START" || ev.csq === "RESUME") return ">";
    // FAIL + unknown → default TASK icon
  }
  return VERB_CATALOG[ev.verb].icon;
}

export function severity(verb: EventVerb, csq?: EventCsq): EventSeverity {
  if (CRIT_VERBS.has(verb)) return "crit";
  if (CRIT_OR_WARN_VERBS.has(verb)) {
    return csq === "CRIT" ? "crit" : "warn";
  }
  if (CRIT_ON_CRIT.has(verb) && csq === "CRIT") return "crit";
  if (WARN_VERBS.has(verb)) return "warn";
  if (POS_ON_OK.has(verb) && csq === "OK") return "pos";
  // S24 TASK: START/RESUME = pos, PAUSE = warn, FAIL = crit.
  if (verb === "TASK") {
    if (csq === "FAIL") return "crit";
    if (csq === "PAUSE") return "warn";
    if (csq === "START" || csq === "RESUME" || csq === "OK") return "pos";
    return "neutral";
  }
  return "neutral";
}

// === Ring buffer push ===

export function appendEvent(
  w: World,
  verb: EventVerb,
  fields?: Omit<Event, "tick" | "verb" | "severity">,
): void {
  const ev: Event = {
    tick: w.tick,
    verb,
    severity: severity(verb, fields?.csq),
    ...fields,
  };
  w.events.push(ev);
  if (w.events.length > EVENT_LOG_CAPACITY) {
    w.events.splice(0, w.events.length - EVENT_LOG_CAPACITY);
  }
}
