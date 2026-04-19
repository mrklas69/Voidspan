// Terminal collapse detection — slot 6b pipeline.
//
// Axiom „Observer = bez game-over": simulace jede dál i po smrti kolonie. Ale
// narrative arc („autopilot drží systém naživu do úplného vyčerpání zdrojů")
// zaslouží **pointu**. Tento slot detekuje terminální stav a jednou emituje
// SYST:CRIT event jako epitaf. Guard flag `world.collapseEmitted` zajistí
// one-shot semantiku — další ticky událost neopakují.
//
// Terminal stav = všichni aktéři mrtví. Moduly mohou fyzicky přežít, ale
// bez živých kolonistů je simulace „prázdná loď v prostoru".

import type { World } from "../model";
import { appendEvent } from "../events";

export function collapseTick(w: World): void {
  if (w.collapseEmitted) return;
  // Všichni aktéři dead = terminal. Prázdný actor list (edge case testu)
  // neemituje — bez populace na startu nemá epitaf co oplakávat.
  if (w.actors.length === 0) return;
  const allDead = w.actors.every((a) => a.state === "dead");
  if (!allDead) return;

  w.collapseEmitted = true;
  appendEvent(w, "SYST", {
    csq: "CRIT",
    amount: w.actors.length,
    text: `Kolonie ztracena. ${w.actors.length} mrtvých. Simulace pokračuje.`,
  });
}
