// Flow history (S26) — rolling-window KPI akumulace per game day.
//
// Per game day ring buffer. Poslední index (WINDOW-1) = aktuální (partial)
// den, nižší indexy = předchozí uzavřené dny. advanceFlowDay volaný v pipeline
// rotuje buffer při přechodu na nový game day.

import type { World, FlowRing } from "../model";
import { TICKS_PER_GAME_DAY, FLOW_WINDOW_GAME_DAYS } from "../tuning";

export type FlowCategory = "solids" | "fluids";
export type FlowDirection = "in" | "out";

// Zaznamenej delta do aktuálního bucket (poslední index = partial today).
// Volá se při každém consume/produce — delta je vždy kladná hodnota množství.
export function recordFlow(w: World, cat: FlowCategory, dir: FlowDirection, amount: number): void {
  if (amount <= 0) return;
  const ring = w.flow[cat];
  const buf = dir === "in" ? ring.inBuf : ring.outBuf;
  const last = buf.length - 1;
  buf[last] = (buf[last] ?? 0) + amount;
}

// Posun na nový game day pokud tick překročil hranici. Shiftne oba buf (posune
// nejstarší ven, push 0 na konec jako nový accumulator).
export function advanceFlowDay(w: World): void {
  const currentDay = Math.floor(w.tick / TICKS_PER_GAME_DAY);
  if (currentDay <= w.flow.lastDay) return;
  const days = currentDay - w.flow.lastDay;
  for (let i = 0; i < days; i++) {
    shiftRing(w.flow.solids);
    shiftRing(w.flow.fluids);
    // `filled` roste s každým uzavřeným dnem, clamp na WINDOW (ring plně nasycen).
    w.flow.filled = Math.min(FLOW_WINDOW_GAME_DAYS, w.flow.filled + 1);
  }
  w.flow.lastDay = currentDay;
}

function shiftRing(r: FlowRing): void {
  r.inBuf.shift();
  r.inBuf.push(0);
  r.outBuf.shift();
  r.outBuf.push(0);
}

// Vrátí průměr in/out per game day z window.
// Podle @THINK A4 rozhodnutí: průměr jen přes zaplněné dny + ignoruj aktuální
// partial den (buffer[last] se plní in-progress). Dokud není `filled >= 1`,
// vrací 0 (nemáme data).
export function averageFlow(w: World, cat: FlowCategory, dir: FlowDirection): number {
  if (w.flow.filled === 0) return 0;
  const ring = w.flow[cat];
  const buf = dir === "in" ? ring.inBuf : ring.outBuf;
  // Zaplněné dny jsou na koncových `filled` pozicích PŘED partial today
  // (buf[last] = partial). Takže range [last-filled .. last-1].
  const last = buf.length - 1;
  let sum = 0;
  for (let i = last - w.flow.filled; i < last; i++) sum += buf[i] ?? 0;
  return sum / w.flow.filled;
}

// S31: partial today extrapolace — akumulovaný bucket × (DAY / elapsed) = rate/day.
// Slouží jako fallback, když `averageFlow` vrací 0 (filled === 0, prvních 10 dnů
// po startu). Zobrazuje "co se děje teď", ne stabilizovaný průměr.
export function currentDayRate(w: World, cat: FlowCategory, dir: FlowDirection): number {
  const ring = w.flow[cat];
  const buf = dir === "in" ? ring.inBuf : ring.outBuf;
  const partial = buf[buf.length - 1] ?? 0;
  if (partial <= 0) return 0;
  const elapsed = w.tick % TICKS_PER_GAME_DAY;
  if (elapsed <= 0) return 0;
  return partial * (TICKS_PER_GAME_DAY / elapsed);
}
