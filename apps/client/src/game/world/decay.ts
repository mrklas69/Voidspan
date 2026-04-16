// Decay tick — entropie. Slot 1 pipeline.
// Moduly ztrácejí HP konstantním dripem.
// Rate = DECAY_RATE_PER_GAME_DAY * hp_max / TICKS_PER_GAME_DAY per tick.
// Modul s HP=0 přechází na offline. DECY event při přechodu na offline.

import type { World } from "../model";
import { TICKS_PER_GAME_DAY, DECAY_RATE_PER_GAME_DAY } from "../tuning";
import { appendEvent } from "../events";

export function decayTick(w: World): void {
  for (const mod of Object.values(w.modules)) {
    if (mod.hp <= 0) continue;
    const drain = (mod.hp_max * DECAY_RATE_PER_GAME_DAY) / TICKS_PER_GAME_DAY;
    mod.hp = Math.max(0, mod.hp - drain);
    if (mod.hp <= 0 && mod.status === "online") {
      mod.status = "offline";
      appendEvent(w, "DECY", { csq: "CRIT", loc: mod.id, item: mod.kind, text: `${mod.kind} zničen rozpadem` });
    }
  }
}
