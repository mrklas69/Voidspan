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
  DAMAGED_WD,
} from "./world";

// === Factory ===

describe("createInitialWorld", () => {
  it("startuje v boot fázi s prázdnými resources na seed hodnotách", () => {
    const w = createInitialWorld();
    expect(w.phase).toBe("boot");
    expect(w.tick).toBe(0);
    expect(w.resources.air).toBe(100);
    expect(w.resources.food).toBe(40);
    expect(w.resources.kredo).toBe(20);
  });

  it("má 16 prázdných tiles v segmentu", () => {
    const w = createInitialWorld();
    expect(w.segment).toHaveLength(16);
    expect(w.segment.every((t) => t.kind === "empty")).toBe(true);
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
  it("přepne boot → phase_a a vytvoří damaged tile", () => {
    const w = createInitialWorld();
    startGame(w);
    expect(w.phase).toBe("phase_a");
    const damaged = w.segment[DAMAGED_TILE_IDX];
    expect(damaged.kind).toBe("damaged");
    if (damaged.kind === "damaged") {
      expect(damaged.wd_to_repair).toBe(DAMAGED_WD);
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
    const airBefore = w.resources.air;
    stepWorld(w);
    expect(w.tick).toBe(1);
    expect(w.resources.air).toBeCloseTo(airBefore - AIR_DRAIN_PER_TICK, 5);
  });

  it("air klesne na 0 za AIR_TIMEOUT_TICKS → loss air", () => {
    const w = createInitialWorld();
    startGame(w);
    for (let i = 0; i < AIR_TIMEOUT_TICKS; i++) stepWorld(w);
    expect(w.phase).toBe("loss");
    expect(w.loss_reason).toBe("air");
    expect(w.resources.air).toBe(0);
  });

  it("v boot se nic neděje (terminální/startovní stav)", () => {
    const w = createInitialWorld();
    stepWorld(w);
    expect(w.tick).toBe(0);
    expect(w.resources.air).toBe(100);
  });
});

describe("stepWorld: food drain v phase_b a phase_c", () => {
  it("v phase_b food klesá", () => {
    const w = createInitialWorld();
    startGame(w);
    repairDone(w);
    const foodBefore = w.resources.food;
    stepWorld(w);
    expect(w.resources.food).toBeCloseTo(foodBefore - FOOD_DRAIN_PER_TICK, 5);
  });

  it("v phase_a food neklesá (ještě není žízeň)", () => {
    const w = createInitialWorld();
    startGame(w);
    const foodBefore = w.resources.food;
    stepWorld(w);
    expect(w.resources.food).toBe(foodBefore);
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
