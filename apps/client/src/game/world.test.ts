// Unit testy pro world.ts — FSM + resource drain + loss conditions.
// Vitest syntax (kompatibilní s Jest). Testujeme čistě funkcionální model
// bez Phaser importu — to je přesně ten důvod, proč S9 oddělil model od scény.

import { describe, it, expect } from "vitest";
import {
  createInitialWorld,
  startGame,
  repairDone,
  dockComplete,
  endDay,
  stepWorld,
  phaseLabel,
  AIR_DRAIN_PER_TICK,
  AIR_TIMEOUT_TICKS,
  FOOD_DRAIN_PER_TICK,
  DAMAGED_TILE_IDX,
  TILE_HP_MAX,
} from "./world";

// === Factory ===

describe("createInitialWorld", () => {
  it("startuje v boot fázi s prázdnými resources na seed hodnotách", () => {
    const w = createInitialWorld();
    expect(w.phase).toBe("boot");
    expect(w.tick).toBe(0);
    expect(w.resources.flux.air).toBe(100);
    expect(w.resources.slab.food).toBe(40);
    expect(w.resources.coin).toBe(20);
    expect(w.resources.energy).toBe(12);
  });

  it("má 16 tiles, mateřská loď dle POC §3 (7 modulů, 6 empty před damaged)", () => {
    const w = createInitialWorld();
    expect(w.segment).toHaveLength(16);
    // 7 modulů: 6× single-tile (idx 0..5) + Engine 2×2 (idx 6,7,14,15) = 10 module_ref tiles.
    // Empty: 8, 9, 10, 11, 12, 13 = 6 tiles. Damaged přijde až v startGame na idx 12.
    const moduleRefs = w.segment.filter((t) => t.kind === "module_ref");
    expect(moduleRefs.length).toBe(10);
    const empties = w.segment.filter((t) => t.kind === "empty");
    expect(empties.length).toBe(6);
    expect(
      empties.every(
        (t) => t.kind === "empty" && t.hp === TILE_HP_MAX && t.hp_max === TILE_HP_MAX,
      ),
    ).toBe(true);
    // 7 modul instancí v registru.
    expect(Object.keys(w.modules).length).toBe(7);
    expect(w.modules.commandpost_1?.kind).toBe("CommandPost");
    expect(w.modules.engine_1?.kind).toBe("Engine");
    // Engine 2×2 obsazuje idx 6,7 (top) a 14,15 (bottom).
    expect(w.segment[6]?.kind).toBe("module_ref");
    expect(w.segment[14]?.kind).toBe("module_ref");
  });

  it("každý tile je nezávislá instance (žádná sdílená reference)", () => {
    // Past v TS: `new Array(16).fill({kind:"empty"})` sdílí jednu referenci.
    // Array.from s callbackem vytváří nové objekty — tento test to hlídá.
    const w = createInitialWorld();
    expect(w.segment[0]).not.toBe(w.segment[1]);
  });
});

// === FSM přechody ===

describe("FSM: startGame (boot → phase_a)", () => {
  it("přepne boot → phase_a a vytvoří damaged tile na hp=0", () => {
    const w = createInitialWorld();
    startGame(w);
    expect(w.phase).toBe("phase_a");
    const damaged = w.segment[DAMAGED_TILE_IDX];
    expect(damaged.kind).toBe("damaged");
    if (damaged.kind === "damaged") {
      // HP-unified (S16): damaged start hp=0, hp_max=TILE_HP_MAX.
      expect(damaged.hp).toBe(0);
      expect(damaged.hp_max).toBe(TILE_HP_MAX);
    }
  });

  it("je no-op, když už není ve fázi boot", () => {
    const w = createInitialWorld();
    startGame(w);
    startGame(w); // druhé volání nemá efekt
    expect(w.phase).toBe("phase_a");
  });
});

describe("FSM: repairDone (phase_a → phase_b)", () => {
  it("přepne phase_a → phase_b a tile zpět na empty", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    expect(w.phase).toBe("phase_b");
    expect(w.segment[DAMAGED_TILE_IDX].kind).toBe("empty");
  });

  it("je no-op v jiné fázi (guard)", () => {
    const w = createInitialWorld();
    repairDone(w); // ve fázi boot nemá efekt
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
    dockComplete(w); // v phase_a nemá efekt
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

  it("je no-op mimo phase_c", () => {
    const w = createInitialWorld();
    startGame(w);
    endDay(w);
    expect(w.phase).toBe("phase_a");
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
    expect(w.resources.flux.air).toBe(0);
  });

  it("v boot se nic neděje (terminální/startovní stav)", () => {
    const w = createInitialWorld();
    stepWorld(w);
    expect(w.tick).toBe(0);
    expect(w.resources.flux.air).toBe(100);
  });
});

describe("stepWorld: food drain v phase_b a phase_c", () => {
  it("v phase_b food klesá", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    const foodBefore = w.resources.slab.food;
    stepWorld(w);
    expect(w.resources.slab.food).toBeCloseTo(foodBefore - FOOD_DRAIN_PER_TICK, 5);
  });

  it("v phase_a food neklesá (ještě není žízeň)", () => {
    const w = createInitialWorld();
    startGame(w);
    const foodBefore = w.resources.slab.food;
    stepWorld(w);
    expect(w.resources.slab.food).toBe(foodBefore);
  });

  it("food → 0 v phase_b vede k loss food", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    // Kolik ticks k vyčerpání 40 jídla při 1/120 za tick = 40 × 120 = 4800.
    // Přidáme buffer — float arithmetic nemusí hit přesně 0 po 4800 iteracích.
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

// === Helpers ===

describe("phaseLabel", () => {
  it("mapuje všechny fáze na čitelné stringy", () => {
    expect(phaseLabel("boot")).toContain("BOOT");
    expect(phaseLabel("phase_a")).toContain("HULL BREACH");
    expect(phaseLabel("phase_b")).toContain("ENGINE");
    expect(phaseLabel("phase_c")).toContain("BONUS");
    expect(phaseLabel("win")).toBe("WIN");
    expect(phaseLabel("loss")).toBe("LOSS");
  });
});
