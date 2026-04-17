// scheduledEvents slot (9) — scripted události: asteroid hity.
//
// S29 KISS: jediný event type (asteroid). Stochastický trigger — každý tick
// šance ASTEROID_HIT_PROB_PER_TICK zasáhnout random non-void bay. Větší moduly
// (multi-bay) mají proporčně vyšší šanci, protože zabírají víc polí v poolu.
//
// Damage: uniform random [5 %, 20 %] × hp_max, HP se sníží skokově.
// Visual: module.flashUntilTick = w.tick + ASTEROID_FLASH_TICKS (red overlay v segment.ts).
// Event: DMG:WARN s text popisem.

import type { World } from "../model";
import {
  ASTEROID_HIT_PROB_PER_TICK,
  ASTEROID_DAMAGE_HP_RATIO,
  ASTEROID_FLASH_TICKS,
} from "../tuning";
import { appendEvent } from "../events";
import { randFloat, randInt } from "./random";

export function scheduledEvents(w: World): void {
  if (Math.random() >= ASTEROID_HIT_PROB_PER_TICK) return;
  triggerAsteroidHit(w);
}

function triggerAsteroidHit(w: World): void {
  // Pool = všechny non-void bay indexy. module_root i module_ref — větší moduly
  // mají proporčně vyšší šanci (realistická váha dle footprintu).
  const pool: number[] = [];
  for (let i = 0; i < w.segment.length; i++) {
    const bay = w.segment[i];
    if (bay && bay.kind !== "void") pool.push(i);
  }
  if (pool.length === 0) return; // jen void bays → nikam netrefit

  const bayIdx = pool[randInt(0, pool.length - 1)]!;
  const bay = w.segment[bayIdx]!;
  // TS narrowing: pool drží jen non-void, ale indexace zpět nese union.
  if (bay.kind === "void") return;
  // module_root i module_ref nesou moduleId — resolve stejně.
  const mod = w.modules[bay.moduleId];
  if (!mod || mod.hp <= 0) return; // už mrtvý modul — žádný damage

  const [lo, hi] = ASTEROID_DAMAGE_HP_RATIO;
  const damageRatio = randFloat(lo, hi);
  const damage = mod.hp_max * damageRatio;
  const hpBefore = mod.hp;
  mod.hp = Math.max(0, mod.hp - damage);
  mod.flashUntilTick = w.tick + ASTEROID_FLASH_TICKS;

  // Status update: HP=0 → offline (stejný pattern jako decay).
  if (mod.hp <= 0 && mod.status === "online") {
    mod.status = "offline";
  }

  const pctLost = Math.round(damageRatio * 100);
  const pctNow = Math.round((mod.hp / mod.hp_max) * 100);
  // EventCsq nemá WARN — severity "warn" vzniká default z verb DMG bez csq.
  // CRIT jen když modul padl na 0 HP (severity se povýší na "crit").
  appendEvent(w, "DMG", {
    ...(mod.hp <= 0 ? { csq: "CRIT" as const } : {}),
    loc: mod.id,
    item: mod.kind,
    amount: Math.round(damage),
    text: `Asteroid zasáhl ${mod.kind} — ztráta ${pctLost} % HP (zbývá ${pctNow} %)`,
  });
  void hpBefore; // dostupné pro budoucí trajectory (Before/After)
}
