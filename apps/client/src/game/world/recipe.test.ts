// Unit testy pro recipe helpers (S25/S38).
// - estimateRepairHpDeltaPerTick: workforce → hp_delta predikce
// - firstMissingRecipeCategory: unified scale vs. progressTasks (S38 bug fix)

import { describe, it, expect } from "vitest";
import { createInitialWorld } from "./init";
import { estimateRepairHpDeltaPerTick, firstMissingRecipeCategory } from "./recipe";
import { enqueueRepairTask } from "./task";
import { findDamagedRootIdx } from "./test_helpers";
import { RECIPE_MIN_HP_EPSILON } from "../tuning";

describe("estimateRepairHpDeltaPerTick", () => {
  it("FVP init (23 dronů + E>0, vše cryo) → hp_delta ≈ 0.48", () => {
    const w = createInitialWorld();
    const delta = estimateRepairHpDeltaPerTick(w);
    // Výpočet: powerSum = 23 (dron) + 0 (actors cryo), wd_delta = 23/960 ≈ 0.024
    // hp_delta = 0.024 / WD_PER_HP(0.05) ≈ 0.479
    expect(delta).toBeGreaterThan(0.4);
    expect(delta).toBeLessThan(0.6);
  });

  it("E=0 → drony offline + vše cryo → powerSum=0 → floor EPSILON", () => {
    const w = createInitialWorld();
    w.resources.energy = 0;
    const delta = estimateRepairHpDeltaPerTick(w);
    // Floor drží minimum (bez floor by byl 0, což by maskovalo missing pro recipe>0).
    expect(delta).toBe(RECIPE_MIN_HP_EPSILON);
  });

  it("probuzený actor dodá svůj work → vyšší hp_delta", () => {
    const w = createInitialWorld();
    const before = estimateRepairHpDeltaPerTick(w);
    const player = w.actors.find((a) => a.id === "player");
    if (!player) throw new Error("player actor missing");
    player.state = "idle"; // probuzen
    const after = estimateRepairHpDeltaPerTick(w);
    expect(after).toBeGreaterThan(before);
  });

  it("dead actors se nepočítají do powerSum", () => {
    const w = createInitialWorld();
    const player = w.actors.find((a) => a.id === "player");
    if (!player) throw new Error("player actor missing");
    player.state = "dead";
    player.hp = 0;
    const delta = estimateRepairHpDeltaPerTick(w);
    // Dead ≠ alive contribution; powerSum = jen drony.
    expect(delta).toBeGreaterThan(0.4);
    expect(delta).toBeLessThan(0.6);
  });
});

describe("firstMissingRecipeCategory", () => {
  it("FVP init bez repair tasků → null (žádný gate)", () => {
    const w = createInitialWorld();
    expect(firstMissingRecipeCategory(w)).toBeNull();
  });

  it("po enqueue repair + solids=0 → 'Solids'", () => {
    const w = createInitialWorld();
    const added = enqueueRepairTask(w, findDamagedRootIdx(w));
    expect(added).toBe(true);
    w.resources.solids = 0;
    expect(firstMissingRecipeCategory(w)).toBe("Solids");
  });

  it("unified scale — 0.048 Solids < hp_delta per tick → 'Solids' (S38 bug fix)", () => {
    const w = createInitialWorld();
    enqueueRepairTask(w, findDamagedRootIdx(w));
    // 0.048 Solids = reálná hodnota reportovaná testerem.
    // hp_delta ~0.48 × recipe ≥ 0.5 Solids/HP → per-tick potřeba ≥ 0.24.
    // 0.048 < 0.24 → missing. Před S38 fix: protokol testoval EPSILON (0.01)
    // × 0.5 = 0.005 ≤ 0.048 → false negative (gate nezahlásil pauzu).
    w.resources.solids = 0.048;
    expect(firstMissingRecipeCategory(w)).toBe("Solids");
  });

  it("scale se nepoužívá při solids=seed — vše OK", () => {
    const w = createInitialWorld();
    enqueueRepairTask(w, findDamagedRootIdx(w));
    // Seed = 90 Solids, víc než 0.24 × recipe → no missing.
    expect(firstMissingRecipeCategory(w)).toBeNull();
  });
});
