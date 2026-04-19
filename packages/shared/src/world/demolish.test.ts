// Unit testy pro demolish task mechanika (S39) — enqueue, progress, completion,
// resource recovery. Mechanika je obecná (per-kind wd_to_demolish z MODULE_DEFS),
// FVP beat je Engine demo (autopilot po dokončení oprav).

import { describe, it, expect } from "vitest";
import { createInitialWorld } from "./init";
import { enqueueDemolishTask, progressTasks } from "./task";
import { MODULE_DEFS } from "../model";
import { DEMOLISH_RECOVERY_RATIO } from "../tuning";

// Helper: najdi Engine moduleId (FVP seed má jeden Engine 2×2 na zadi).
function findEngineId(w: ReturnType<typeof createInitialWorld>): string {
  const engine = Object.values(w.modules).find((m) => m.kind === "Engine");
  if (!engine) throw new Error("FVP init musí mít Engine modul");
  return engine.id;
}

describe("enqueueDemolishTask", () => {
  it("vytvoří demolish task s wd_total z katalogu (wd_to_demolish)", () => {
    const w = createInitialWorld();
    const engineId = findEngineId(w);
    const ok = enqueueDemolishTask(w, engineId);
    expect(ok).toBe(true);
    const task = w.tasks.find((t) => t.kind === "demolish");
    expect(task).toBeDefined();
    expect(task!.target.moduleId).toBe(engineId);
    expect(task!.wd_total).toBe(MODULE_DEFS.Engine.wd_to_demolish);
    expect(task!.status).toBe("pending");
  });

  it("idempotent — druhé zavolání vrátí false (task už existuje)", () => {
    const w = createInitialWorld();
    const engineId = findEngineId(w);
    expect(enqueueDemolishTask(w, engineId)).toBe(true);
    expect(enqueueDemolishTask(w, engineId)).toBe(false);
    expect(w.tasks.filter((t) => t.kind === "demolish")).toHaveLength(1);
  });

  it("neznámý moduleId → false (žádný task nevznikne)", () => {
    const w = createInitialWorld();
    expect(enqueueDemolishTask(w, "nonexistent_mod")).toBe(false);
    expect(w.tasks.some((t) => t.kind === "demolish")).toBe(false);
  });
});

describe("progressTasks — demolish větev", () => {
  it("HP modulu klesá proporčně k wd_done / wd_total", () => {
    const w = createInitialWorld();
    const engineId = findEngineId(w);
    const mod = w.modules[engineId]!;
    // Stabilní initialHp (applyRandomDamages může Engine poškodit náhodně).
    mod.hp = mod.hp_max;

    enqueueDemolishTask(w, engineId);
    const task = w.tasks.find((t) => t.kind === "demolish")!;
    task.status = "active";

    const hpMax = mod.hp_max;

    // Nasimuluj půlku práce manuálně.
    task.wd_done = task.wd_total * 0.5;
    // Fake workforce: dočasně E plná + drones k dispozici.
    w.resources.energy = w.energyMax;
    progressTasks(w);

    // HP po progressTasks má být ~(1 - 0.5) × hp_max = hp_max / 2 (plus malá delta z tohoto ticku).
    expect(mod.hp).toBeLessThan(hpMax * 0.6);
    expect(mod.hp).toBeGreaterThan(hpMax * 0.3);
    expect(mod.status).toBe("demolishing");
  });

  it("demolish nespotřebovává Solids (žádný material gate)", () => {
    const w = createInitialWorld();
    const engineId = findEngineId(w);
    enqueueDemolishTask(w, engineId);
    const task = w.tasks.find((t) => t.kind === "demolish")!;
    task.status = "active";

    // Vynuluj Solids — repair by se zastavil, demolish musí pokračovat.
    w.resources.solids = 0;
    w.resources.fluids = 0;
    w.resources.energy = w.energyMax;

    const wdBefore = task.wd_done;
    progressTasks(w);
    expect(task.wd_done).toBeGreaterThan(wdBefore);
  });
});

describe("completeTask — demolish větev", () => {
  it("při dokončení: bays → void, modul smazán z w.modules, CMPL:OK event", () => {
    const w = createInitialWorld();
    const engineId = findEngineId(w);
    const engineRootIdx = w.modules[engineId]!.rootIdx;

    enqueueDemolishTask(w, engineId);
    const task = w.tasks.find((t) => t.kind === "demolish")!;
    task.status = "active";

    // Předtáhni na konec: wd_done těsně pod wd_total, další tick dokončí.
    task.wd_done = task.wd_total - 0.001;
    w.resources.energy = w.energyMax;
    progressTasks(w);

    // Engine byl 2×2 — všechny 4 bays musí být void.
    expect(w.segment[engineRootIdx]!.kind).toBe("void");
    expect(w.segment[engineRootIdx + 1]!.kind).toBe("void");
    expect(w.segment[engineRootIdx + 8]!.kind).toBe("void");
    expect(w.segment[engineRootIdx + 9]!.kind).toBe("void");
    // Modul odstraněn z indexu.
    expect(w.modules[engineId]).toBeUndefined();
    // Task je completed.
    expect(task.status).toBe("completed");
    // CMPL:OK event emitnutý (poslední v bufferu).
    const cmpl = w.events.find((e) => e.verb === "CMPL" && e.item === "demolish");
    expect(cmpl).toBeDefined();
  });

  it("recovery surovin na plném Engine — (hp/hp_max) × recipe × ratio, full HP", () => {
    const w = createInitialWorld();
    const engineId = findEngineId(w);
    const mod = w.modules[engineId]!;

    // Přepiš light wear na full HP pro determinismus testu.
    mod.hp = mod.hp_max;
    w.resources.solids = 0;
    w.resources.fluids = 0;

    enqueueDemolishTask(w, engineId);
    const task = w.tasks.find((t) => t.kind === "demolish")!;
    task.status = "active";
    task.wd_done = task.wd_total - 0.001;
    w.resources.energy = w.energyMax;
    progressTasks(w);

    const def = MODULE_DEFS.Engine;
    // Full HP → scale = 1 × ratio = 0.5. Recipe 211 S + 62 F → 105.5 / 31.
    // Solids cap 100 → clamp na 100.
    const expectedSolids = (def.recipe.solids ?? 0) * 1.0 * DEMOLISH_RECOVERY_RATIO;
    const expectedFluids = (def.recipe.fluids ?? 0) * 1.0 * DEMOLISH_RECOVERY_RATIO;
    expect(w.resources.solids).toBeCloseTo(Math.min(100, expectedSolids), 1);
    expect(w.resources.fluids).toBeCloseTo(expectedFluids, 1);
  });

  it("recovery na poškozeném Engine — scale proporční k initialHp / hp_max", () => {
    const w = createInitialWorld();
    const engineId = findEngineId(w);
    const mod = w.modules[engineId]!;

    // Umělé poškození: 50 % HP před enqueue.
    mod.hp = mod.hp_max * 0.5;
    w.resources.solids = 0;
    w.resources.fluids = 0;

    enqueueDemolishTask(w, engineId);
    const task = w.tasks.find((t) => t.kind === "demolish")!;
    task.status = "active";
    task.wd_done = task.wd_total - 0.001;
    w.resources.energy = w.energyMax;
    progressTasks(w);

    const def = MODULE_DEFS.Engine;
    // Scale = 0.5 × 0.5 = 0.25. Solids 211 × 0.25 = 52.75. Fluids 62 × 0.25 = 15.5.
    const expectedSolids = (def.recipe.solids ?? 0) * 0.5 * DEMOLISH_RECOVERY_RATIO;
    const expectedFluids = (def.recipe.fluids ?? 0) * 0.5 * DEMOLISH_RECOVERY_RATIO;
    expect(w.resources.solids).toBeCloseTo(expectedSolids, 1);
    expect(w.resources.fluids).toBeCloseTo(expectedFluids, 1);
  });
});
