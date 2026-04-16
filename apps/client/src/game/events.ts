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

export const VERB_CATALOG: Record<EventVerb, VerbEntry> = {
  BOOT: { icon: "◉", label: "start simulace" },
  SPWN: { icon: "+", label: "spawn" },
  DEAD: { icon: "†", label: "aktér umřel" },
  ARRV: { icon: "↓", label: "landing / dokování" },
  DPRT: { icon: "↑", label: "odlet" },
  REPR: { icon: "✓", label: "repair" },
  BLD:  { icon: "▲", label: "build" },
  DEMO: { icon: "▽", label: "demolish" },
  DMG:  { icon: "×", label: "damage" },
  DECY: { icon: "↘", label: "decay" },
  DRN:  { icon: "−", label: "resource drain" },
  PROD: { icon: "*", label: "produkce" },
  HAUL: { icon: "→", label: "transport" },
  ASSN: { icon: "»", label: "task assigned" },
  CMPL: { icon: "✓✓", label: "task completed" },
  FAIL: { icon: "!", label: "task failed" },
  IDLE: { icon: "·", label: "idle" },
  WAKE: { icon: "☆", label: "probuzen" },
  DOCK: { icon: "⊙", label: "dock event" },
  TICK: { icon: "·", label: "tick marker" },
  SIGN: { icon: "⚑", label: "signal — level change" },
  EVNT: { icon: "◆", label: "scripted event" },
  SAY:  { icon: "\"", label: "dialog" },
  RPRT: { icon: "»»", label: "systémová zpráva" },
  TASK: { icon: "◈", label: "změna stavu úkolu" },
};

// === Severity lookup ===
//
// Pure function: verb × csq → severity.
// Pravidla (GLOSSARY §Severity — barva):
//   crit:    DEAD:*, DMG:CRIT, DRN:CRIT, FAIL:*
//   warn:    DECY:*, DMG:*, DRN:*
//   pos:     REPR:OK, BLD:OK, CMPL:OK, PROD:OK, WAKE:*
//   neutral: vše ostatní (TICK, IDLE, ASSN, HAUL, RPRT, ...)

const CRIT_VERBS: Set<EventVerb> = new Set(["DEAD", "FAIL"]);
const WARN_VERBS: Set<EventVerb> = new Set(["DECY"]);
const CRIT_OR_WARN_VERBS: Set<EventVerb> = new Set(["DMG", "DRN"]);
const POS_VERBS: Set<EventVerb> = new Set(["WAKE"]);
const POS_ON_OK: Set<EventVerb> = new Set(["REPR", "BLD", "CMPL", "PROD"]);

export function severity(verb: EventVerb, csq?: EventCsq): EventSeverity {
  if (CRIT_VERBS.has(verb)) return "crit";
  if (CRIT_OR_WARN_VERBS.has(verb)) {
    return csq === "CRIT" ? "crit" : "warn";
  }
  if (WARN_VERBS.has(verb)) return "warn";
  if (POS_VERBS.has(verb)) return "pos";
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
