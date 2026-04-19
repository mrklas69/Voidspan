// Milestone auto-advance (S39) — narativní progression Mission Scenario.
// Volá se v protocolTick. Per-milestone trigger checkne podmínku; pokud splněna,
// current → done + chain next planned → current. Emit SYST event při advance.
// Modal UI pak zobrazí unacked done milestone (flow: done + acked=false → modal).
//
// FVP triggery (Transit arc):
//   repairs → done      když všechny online moduly zdravé (tolerance drift)
//   dock_build → done   když dock_1 modul existuje + status online
//   first_wake → done   zatím bez triggeru (R2 wake-up mechanika)
//   arrival → done      zatím bez triggeru (R2 arrivalsTick)
//
// Chain: done milestone automaticky posune následující „planned" na „current".

import type { World, Milestone } from "../model";
import { QM_FULL_HP_TOLERANCE_PCT } from "../tuning";
import { appendEvent } from "../events";
import { formatGameDateCs } from "./format";

// Trigger: všechny online moduly HP ≥ tolerance threshold (stejná definice jako
// QM anyDamagedModule — izomorfismus). Offline/building/demolishing moduly
// se neberou v úvahu.
function isRepairsDone(w: World): boolean {
  const threshold = (100 - QM_FULL_HP_TOLERANCE_PCT) / 100;
  for (const mod of Object.values(w.modules)) {
    if (mod.status !== "online") continue;
    if (mod.hp / mod.hp_max < threshold) return false;
  }
  return true;
}

// Trigger: dock_1 existuje + je online (dokončená stavba, ne building).
function isDockBuildDone(w: World): boolean {
  const dock = w.modules["dock_1"];
  return !!dock && dock.status === "online";
}

// Trigger: kapitán probuzen z cryo (S39 wake-up mechanika). Terminal P1 beat —
// „první probuzený" = konec FVP fáze. R2 rozšíří na per-actor wake chain.
function isFirstWakeDone(w: World): boolean {
  return w.captainAwake === true;
}

// Per-milestone trigger registry. Pořadí odpovídá timeline.
const TRIGGERS: Record<string, (w: World) => boolean> = {
  repairs: isRepairsDone,
  dock_build: isDockBuildDone,
  first_wake: isFirstWakeDone,
};

// Posun milestonů. Volá se každý tick. Side-effects:
//   - current milestone splňuje trigger → status "done", acked=false, emit SYST
//   - následující planned milestone → "current" (chain)
export function advanceMilestones(w: World): void {
  for (let i = 0; i < w.milestones.length; i++) {
    const m = w.milestones[i]!;
    if (m.status !== "current") continue;
    const trigger = TRIGGERS[m.id];
    if (!trigger) continue;
    if (!trigger(w)) continue;
    // Advance — date_cs odráží reálný game time advance, ne seed hodnotu.
    m.status = "done";
    m.acked = false;
    m.date_cs = formatGameDateCs(w.tick);
    appendEvent(w, "SYST", {
      loc: m.id,
      text: `Milník splněn: ${m.label_cs}`,
    });
    // Chain: first planned → current. Date_cs zaznamená datumčas zahájení
    // (dočasně — při vlastním advance se přepíše na datumčas dokončení).
    for (let j = i + 1; j < w.milestones.length; j++) {
      const next = w.milestones[j]!;
      if (next.status === "planned") {
        next.status = "current";
        next.date_cs = formatGameDateCs(w.tick);
        break;
      }
    }
  }
}

// První unacked done milestone (pro modal). null = žádný čekající.
export function firstPendingAck(w: World): Milestone | null {
  for (const m of w.milestones) {
    if (m.status === "done" && !m.acked) return m;
  }
  return null;
}
