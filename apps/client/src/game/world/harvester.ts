// AsteroidHarvester production (S39). Per game hour Poisson sample: drony
// loví asteroidy, modul je přeměňuje na Solids. Level 1 (FVP): λ=3 ks/hod,
// clamp [0, 5]. Budoucí levely: vyšší λ + vyšší clamp (upgrade path).
//
// Batch per-hour trigger: tick % ticks_per_hour === 0 → sample per Harvester.
// Každá instance modulu samplu nezávisle (stochasticky). Offline / building
// / demolishing instance neprodukují.
//
// HP ratio penalty: λ_effective = λ × (hp / hp_max). Poškozený harvester má
// drony neschopné pro vzdálenější cíle. 100 % jen bezvadný (axiom S18).

import type { World } from "../model";
import { TICKS_PER_GAME_DAY, SOLIDS_MAX } from "../tuning";
import { poisson } from "./random";
import { appendEvent } from "../events";
import { recordFlow } from "./flow";

// Level 1 parametry — průměr 3, clamp [0, 5]. Upgrade levely rozšíří tuning
// tabulku (Solar 1×1 → 2×2, 10× produkce viz IDEAS „Module research & upgrade").
const HARVESTER_LEVEL_1_LAMBDA = 3;
const HARVESTER_LEVEL_1_MAX = 5;

export function harvesterTick(w: World): void {
  const ticksPerHour = TICKS_PER_GAME_DAY / 16;
  // Sample jen na hraně game hour (1× za hodinu).
  if (w.tick % ticksPerHour !== 0) return;
  if (w.tick === 0) return; // seed tick — žádná produkce
  for (const mod of Object.values(w.modules)) {
    if (mod.kind !== "AsteroidHarvester") continue;
    if (mod.status !== "online") continue;
    const hpRatio = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
    const lamEff = HARVESTER_LEVEL_1_LAMBDA * hpRatio;
    const yield_ = poisson(lamEff, HARVESTER_LEVEL_1_MAX);
    if (yield_ <= 0) continue;
    // Přidej Solids do skladu, clamp SOLIDS_MAX. Overflow se ztratí (sklad plný).
    const before = w.resources.solids;
    w.resources.solids = Math.min(SOLIDS_MAX, w.resources.solids + yield_);
    const taken = w.resources.solids - before;
    recordFlow(w, "solids", "in", taken);
    if (taken > 0) {
      appendEvent(w, "SYST", {
        loc: mod.id,
        amount: taken,
        text: `Harvestor ${mod.id}: asteroidy zachyceny +${taken} Solids`,
      });
    }
  }
}
