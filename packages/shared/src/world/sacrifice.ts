// Sacrifice candidates (S39) — moduly, které může kapitán obětovat při
// deadlocku pro recovery zdrojů. Blacklist kritických + výpočet recovery
// estimate (Solids + Fluids, stejný vzorec jako completeTask demolish).

import type { World, ModuleKind } from "../model";
import { MODULE_DEFS } from "../model";
import { DEMOLISH_RECOVERY_RATIO } from "../tuning";
import { enqueueDemolishTask } from "./task";
import { appendEvent } from "../events";

// Moduly, které NELZE obětovat (kritická infrastruktura).
// Engine je vyloučen implicitně — je offline / už demolován při deadlocku.
const SACRIFICE_BLACKLIST: ReadonlySet<ModuleKind> = new Set<ModuleKind>([
  "Habitat",      // ubytování — budoucí wake-up mechanika
  "MedCore",      // life-support cryo + lékařské centrum
  "CommandPost",  // QM stanoviště, pilot logika
]);

export type SacrificeCandidate = {
  moduleId: string;
  kind: ModuleKind;
  recoverySolids: number;
  recoveryFluids: number;
  totalRecovery: number; // pro řazení (solids + fluids)
};

// Vrátí kandidáty k obětování, seřazené desc podle total recovery.
// Filtr: online moduly, non-blacklist, non-Engine. Recovery = (hp/hp_max) ×
// recipe × DEMOLISH_RECOVERY_RATIO — identické s completeTask demolish.
export function getSacrificeCandidates(w: World): SacrificeCandidate[] {
  const candidates: SacrificeCandidate[] = [];
  for (const mod of Object.values(w.modules)) {
    if (mod.status !== "online") continue;
    if (mod.kind === "Engine") continue;
    if (SACRIFICE_BLACKLIST.has(mod.kind)) continue;
    const def = MODULE_DEFS[mod.kind];
    const hpRatio = mod.hp / mod.hp_max;
    const scale = hpRatio * DEMOLISH_RECOVERY_RATIO;
    const recoverySolids = (def.recipe.solids ?? 0) * scale;
    const recoveryFluids = (def.recipe.fluids ?? 0) * scale;
    candidates.push({
      moduleId: mod.id,
      kind: mod.kind,
      recoverySolids,
      recoveryFluids,
      totalRecovery: recoverySolids + recoveryFluids,
    });
  }
  candidates.sort((a, b) => b.totalRecovery - a.totalRecovery);
  return candidates;
}

// Kapitán zvolil obětování daného modulu. Clear pendingDecision, enqueue demo,
// emit narativní event. QM v dalším ticku pick uvidí live demo → rescue flow
// pokračuje (recovery přitečou, paused build resume).
export function chooseSacrifice(w: World, moduleId: string): boolean {
  const mod = w.modules[moduleId];
  if (!mod) return false;
  const ok = enqueueDemolishTask(w, moduleId);
  if (!ok) return false;
  w.pendingDecision = null;
  appendEvent(w, "SYST", {
    actor: "player",
    loc: moduleId,
    text: `Kapitán rozhodl — obětovat ${moduleId} pro recovery.`,
  });
  return true;
}

// Detekce deadlocku — QM nemůže pokračovat ani s rescue. Podmínky:
//   - materialReason (Solids/Fluids chybí) existuje
//   - Engine demo už proběhl (engineDemoEnqueued = true; další automatická
//     recovery neexistuje)
//   - Live demo neběží (jinak by rescue pokračoval)
//   - Existuje paused build/repair task čekající na materiál (pokud nic
//     není paused, QM není v deadlocku — prostě nic nedělá)
export function isDeadlocked(w: World, materialReasonPresent: boolean): boolean {
  if (!materialReasonPresent) return false;
  if (!w.engineDemoEnqueued) return false; // Engine demo je ještě možný rescue
  // Live demo running? Pak rescue právě probíhá, nezaseklo se.
  const liveDemo = w.tasks.some(
    (t) => t.kind === "demolish" &&
      (t.status === "active" || t.status === "pending" || t.status === "paused"),
  );
  if (liveDemo) return false;
  // Aspoň jeden pausovaný build/repair task, který čeká na materiál.
  const pausedWaiting = w.tasks.some(
    (t) => (t.kind === "build" || t.kind === "repair") && t.status === "paused",
  );
  return pausedWaiting;
}
