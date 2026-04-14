// Unit testy pro world.ts — layered bay axiom (S18).
// Random layout → testy kontrolují invarianty, ne konkrétní pozice.

import { describe, it, expect } from "vitest";
import {
  createInitialWorld,
  startGame,
  repairDone,
  dockComplete,
  endDay,
  stepWorld,
  phaseLabel,
  enqueueRepairTask,
  getOuterHP,
  AIR_DRAIN_PER_TICK,
  AIR_TIMEOUT_TICKS,
  FOOD_DRAIN_PER_TICK,
  SKELETON_HP_MAX,
  COVERED_HP_MAX,
} from "./world";
import { MODULE_DEFS } from "./model";

// === Factory ===

describe("createInitialWorld", () => {
  it("startuje v boot fázi s resources na seed hodnotách", () => {
    const w = createInitialWorld();
    expect(w.phase).toBe("boot");
    expect(w.tick).toBe(0);
    expect(w.resources.flux.air).toBe(100);
    expect(w.resources.slab.food).toBe(40);
    expect(w.resources.coin).toBe(20);
    expect(w.resources.energy).toBe(12);
  });

  it("má 16 bays a 7 modulů (Engine + 6 startovních)", () => {
    const w = createInitialWorld();
    expect(w.segment).toHaveLength(16);
    expect(Object.keys(w.modules).length).toBe(7);
    expect(w.modules.engine_1?.kind).toBe("Engine");
    expect(w.modules.commandpost_1?.kind).toBe("CommandPost");
  });

  it("Engine 2×2 zabírá 4 bays (1 root + 3 ref) na fixní pozici idx 6", () => {
    const w = createInitialWorld();
    const engineRef = w.segment.filter(
      (t) =>
        (t.kind === "module_root" || t.kind === "module_ref") && t.moduleId === "engine_1",
    );
    expect(engineRef.length).toBe(4);
    // Engine root je na idx 6 (fixní kotevní bod).
    const t6 = w.segment[6];
    expect(t6?.kind).toBe("module_root");
    if (t6?.kind === "module_root") expect(t6.moduleId).toBe("engine_1");
  });

  it("každý modul má 1 module_root bay + potenciálně další module_ref bays", () => {
    const w = createInitialWorld();
    for (const [id, mod] of Object.entries(w.modules)) {
      const def = MODULE_DEFS[mod.kind];
      const rootCount = w.segment.filter(
        (t) => t.kind === "module_root" && t.moduleId === id,
      ).length;
      const refCount = w.segment.filter(
        (t) => t.kind === "module_ref" && t.moduleId === id,
      ).length;
      expect(rootCount).toBe(1);
      expect(rootCount + refCount).toBe(def.w * def.h);
    }
  });

  it("zbytek bays je mix skeleton + 2-3 covered (dle random)", () => {
    const w = createInitialWorld();
    const skeletons = w.segment.filter((t) => t.kind === "skeleton").length;
    const covered = w.segment.filter((t) => t.kind === "covered").length;
    expect(covered).toBeGreaterThanOrEqual(2);
    expect(covered).toBeLessThanOrEqual(3);
    // 16 total = 10 engine+6×1×1 moduly (+ ref) = 10 module bays; zbývá 6.
    // 6 = skeletons + covered.
    expect(skeletons + covered).toBe(6);
  });

  it("covered bays mají variant 1..5", () => {
    const w = createInitialWorld();
    for (const t of w.segment) {
      if (t.kind === "covered") {
        expect(t.variant).toBeGreaterThanOrEqual(1);
        expect(t.variant).toBeLessThanOrEqual(5);
      }
    }
  });

  it("skeleton.hp_max = SKELETON_HP_MAX, covered.hp_max = COVERED_HP_MAX", () => {
    const w = createInitialWorld();
    for (const t of w.segment) {
      if (t.kind === "skeleton") expect(t.hp_max).toBe(SKELETON_HP_MAX);
      if (t.kind === "covered") expect(t.hp_max).toBe(COVERED_HP_MAX);
    }
  });

  it("tři komponenty mají výraznější poškození (< 90 % hp_max)", () => {
    const w = createInitialWorld();
    // Collect outer HP pro všech 16 bays a najdi ty s nejvyšším missing ratio.
    const pcts: number[] = [];
    const seenModules = new Set<string>();
    for (let i = 0; i < 16; i++) {
      const t = w.segment[i]!;
      if (t.kind === "skeleton" || t.kind === "covered") {
        pcts.push(t.hp / t.hp_max);
      } else if (t.kind === "module_root") {
        if (!seenModules.has(t.moduleId)) {
          seenModules.add(t.moduleId);
          const m = w.modules[t.moduleId]!;
          pcts.push(m.hp / m.hp_max);
        }
      }
    }
    pcts.sort((a, b) => a - b);
    // Critical + medium + minor → 3 komponenty pod 90 % (minor je 75..90).
    const significantlyDamaged = pcts.filter((p) => p < 0.9).length;
    expect(significantlyDamaged).toBeGreaterThanOrEqual(3);
  });

  it("každý bay je nezávislá instance", () => {
    const w = createInitialWorld();
    expect(w.segment[0]).not.toBe(w.segment[1]);
  });
});

// === FSM přechody ===

describe("FSM: startGame (boot → phase_a)", () => {
  it("přepne boot → phase_a", () => {
    const w = createInitialWorld();
    startGame(w);
    expect(w.phase).toBe("phase_a");
  });

  it("je no-op mimo boot", () => {
    const w = createInitialWorld();
    startGame(w);
    startGame(w);
    expect(w.phase).toBe("phase_a");
  });
});

describe("FSM: repairDone (phase_a → phase_b)", () => {
  it("přepne phase_a → phase_b", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    expect(w.phase).toBe("phase_b");
  });

  it("je no-op v jiné fázi", () => {
    const w = createInitialWorld();
    repairDone(w);
    expect(w.phase).toBe("boot");
  });
});

describe("FSM: dockComplete (phase_b → phase_c)", () => {
  it("přepne phase_b → phase_c", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    dockComplete(w);
    expect(w.phase).toBe("phase_c");
  });

  it("je no-op v jiné fázi", () => {
    const w = createInitialWorld();
    startGame(w);
    dockComplete(w);
    expect(w.phase).toBe("phase_a");
  });
});

describe("FSM: endDay (phase_c → win)", () => {
  it("přepne phase_c → win", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    dockComplete(w);
    endDay(w);
    expect(w.phase).toBe("win");
  });
});

// === Tick step — resource drain ===

describe("stepWorld: air drain v phase_a", () => {
  it("tick zvyšuje counter a snižuje air", () => {
    const w = createInitialWorld();
    startGame(w);
    const airBefore = w.resources.flux.air;
    stepWorld(w);
    expect(w.tick).toBe(1);
    expect(w.resources.flux.air).toBeCloseTo(airBefore - AIR_DRAIN_PER_TICK, 5);
  });

  it("air klesne na 0 za AIR_TIMEOUT_TICKS → loss air", () => {
    const w = createInitialWorld();
    startGame(w);
    for (let i = 0; i < AIR_TIMEOUT_TICKS; i++) stepWorld(w);
    expect(w.phase).toBe("loss");
    expect(w.loss_reason).toBe("air");
  });

  it("v boot se nic neděje", () => {
    const w = createInitialWorld();
    stepWorld(w);
    expect(w.tick).toBe(0);
    expect(w.resources.flux.air).toBe(100);
  });
});

describe("stepWorld: food drain v phase_b/c", () => {
  it("v phase_b food klesá", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    const foodBefore = w.resources.slab.food;
    stepWorld(w);
    expect(w.resources.slab.food).toBeCloseTo(foodBefore - FOOD_DRAIN_PER_TICK, 5);
  });

  it("food → 0 v phase_b vede k loss food", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    const ticksToZero = Math.ceil(40 / FOOD_DRAIN_PER_TICK) + 5;
    for (let i = 0; i < ticksToZero; i++) stepWorld(w);
    expect(w.phase).toBe("loss");
    expect(w.loss_reason).toBe("food");
  });
});

describe("stepWorld: terminální stavy", () => {
  it("win neprogresuje ticky", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    dockComplete(w);
    endDay(w);
    const tickBefore = w.tick;
    stepWorld(w);
    expect(w.tick).toBe(tickBefore);
  });
});

// === getOuterHP / enqueueRepairTask ===

describe("getOuterHP", () => {
  it("vrátí HP vnější vrstvy (skeleton/covered) nebo modulu", () => {
    const w = createInitialWorld();
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      expect(outer).not.toBeNull();
      if (outer) {
        expect(outer.hp).toBeGreaterThan(0);
        expect(outer.hp_max).toBeGreaterThan(0);
      }
    }
  });
});

describe("enqueueRepairTask (generalized)", () => {
  it("enqueue repair pro bay s hp < hp_max", () => {
    const w = createInitialWorld();
    startGame(w);
    // Najdi první bay s missing HP.
    let targetIdx = -1;
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      if (outer && outer.hp < outer.hp_max) {
        targetIdx = i;
        break;
      }
    }
    expect(targetIdx).toBeGreaterThanOrEqual(0);
    const ok = enqueueRepairTask(w, targetIdx);
    expect(ok).toBe(true);
    expect(w.tasks.length).toBe(1);
  });

  it("idempotent — druhé volání na stejný target nic nepřidá", () => {
    const w = createInitialWorld();
    startGame(w);
    let targetIdx = -1;
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      if (outer && outer.hp < outer.hp_max) {
        targetIdx = i;
        break;
      }
    }
    enqueueRepairTask(w, targetIdx);
    const ok2 = enqueueRepairTask(w, targetIdx);
    expect(ok2).toBe(false);
    expect(w.tasks.length).toBe(1);
  });
});

// === Helpers ===

describe("phaseLabel", () => {
  it("mapuje všechny fáze", () => {
    expect(phaseLabel("boot")).toContain("BOOT");
    expect(phaseLabel("phase_a")).toContain("HULL BREACH");
    expect(phaseLabel("phase_b")).toContain("ENGINE");
    expect(phaseLabel("phase_c")).toContain("BONUS");
    expect(phaseLabel("win")).toBe("WIN");
    expect(phaseLabel("loss")).toBe("LOSS");
  });
});
