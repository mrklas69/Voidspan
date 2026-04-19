// Unit testy pro AsteroidHarvester production + Poisson helper.

import { describe, it, expect } from "vitest";
import { createInitialWorld } from "./init";
import { harvesterTick } from "./harvester";
import { enqueueBuildTask } from "./task";
import { poisson } from "./random";
import { TICKS_PER_GAME_DAY, SOLIDS_MAX } from "../tuning";
import { FVP_RULES, evaluateRules } from "./rules";

describe("poisson helper", () => {
  it("lam=0 → vždy 0", () => {
    for (let i = 0; i < 100; i++) expect(poisson(0, 5)).toBe(0);
  });

  it("clamp na maxYield — lam vysoké, výsledek omezený", () => {
    for (let i = 0; i < 50; i++) {
      const v = poisson(20, 3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(3);
    }
  });

  it("lam=3 ~ průměr blízko 3 ve velkém vzorku", () => {
    let sum = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) sum += poisson(3, 10);
    const avg = sum / n;
    // Tolerance ±0.15 pro n=5000 sample.
    expect(avg).toBeGreaterThan(2.85);
    expect(avg).toBeLessThan(3.15);
  });
});

describe("harvesterTick", () => {
  // Helper: nastav svět tak, aby harvester existoval a byl online.
  function setupWithHarvester(): ReturnType<typeof createInitialWorld> {
    const w = createInitialWorld();
    // Vyvolej build task + dokonči ručně.
    expect(enqueueBuildTask(w, "AsteroidHarvester", 0)).toBe(true);
    const harvesterMod = Object.values(w.modules).find((m) => m.kind === "AsteroidHarvester")!;
    harvesterMod.status = "online";
    harvesterMod.hp = harvesterMod.hp_max;
    return w;
  }

  it("off-hour ticks → žádná produkce", () => {
    const w = setupWithHarvester();
    const solidsBefore = w.resources.solids;
    w.tick = 7; // ne game hour boundary (1h = 60 ticks)
    harvesterTick(w);
    expect(w.resources.solids).toBe(solidsBefore);
  });

  it("tick=0 seed skip — žádná produkce při initu", () => {
    const w = setupWithHarvester();
    const solidsBefore = w.resources.solids;
    w.tick = 0;
    harvesterTick(w);
    expect(w.resources.solids).toBe(solidsBefore);
  });

  it("on-hour tick → průměr ~3 ks × N iterací (big-sample test)", () => {
    const w = setupWithHarvester();
    w.resources.solids = 0;
    let totalProduced = 0;
    // 200 game hours sample.
    const ticksPerHour = TICKS_PER_GAME_DAY / 16;
    for (let h = 1; h <= 200; h++) {
      w.tick = h * ticksPerHour;
      const before = w.resources.solids;
      harvesterTick(w);
      const gained = w.resources.solids - before;
      totalProduced += gained;
      // Reset sklad aby nedošlo na cap.
      w.resources.solids = 0;
    }
    const avgPerHour = totalProduced / 200;
    // Tolerance ±0.3 pro n=200 (pomalejší konvergence).
    expect(avgPerHour).toBeGreaterThan(2.5);
    expect(avgPerHour).toBeLessThan(3.5);
  });

  it("offline harvester neprodukuje", () => {
    const w = setupWithHarvester();
    const harvesterMod = Object.values(w.modules).find((m) => m.kind === "AsteroidHarvester")!;
    harvesterMod.status = "offline";
    w.tick = TICKS_PER_GAME_DAY / 16;
    const solidsBefore = w.resources.solids;
    harvesterTick(w);
    expect(w.resources.solids).toBe(solidsBefore);
  });

  it("poškozený harvester (50 % HP) snižuje produkci ~polovičně", () => {
    const w = createInitialWorld();
    enqueueBuildTask(w, "AsteroidHarvester", 0);
    const harvesterMod = Object.values(w.modules).find((m) => m.kind === "AsteroidHarvester")!;
    harvesterMod.status = "online";
    harvesterMod.hp = harvesterMod.hp_max * 0.5;

    let total = 0;
    const ticksPerHour = TICKS_PER_GAME_DAY / 16;
    for (let h = 1; h <= 200; h++) {
      w.tick = h * ticksPerHour;
      const before = w.resources.solids;
      w.resources.solids = 0;
      harvesterTick(w);
      total += w.resources.solids - before < 0 ? 0 : w.resources.solids;
    }
    const avg = total / 200;
    // Half HP → efektivní λ = 1.5. Rozptyl toleruj ±0.3.
    expect(avg).toBeGreaterThan(1.0);
    expect(avg).toBeLessThan(2.0);
  });

  it("sklad na max — overflow se ztratí", () => {
    const w = setupWithHarvester();
    w.resources.solids = SOLIDS_MAX;
    w.tick = TICKS_PER_GAME_DAY / 16;
    harvesterTick(w);
    expect(w.resources.solids).toBe(SOLIDS_MAX);
  });
});

describe("QM rule: post-dock-build → Harvester", () => {
  it("rule triggered když dock_1 online + žádný Harvester", () => {
    const w = createInitialWorld();
    w.modules["dock_1"] = {
      id: "dock_1", kind: "Dock", rootIdx: 6, status: "online",
      hp: 1000, hp_max: 1000, progress_wd: 0,
    };
    // Obsad bays 6,7,14,15 (simulované dock).
    for (const idx of [6, 7, 14, 15]) {
      w.segment[idx] = idx === 6
        ? { kind: "module_root", moduleId: "dock_1" }
        : { kind: "module_ref", moduleId: "dock_1", rootOffset: { dx: idx === 7 ? 1 : 0, dy: idx >= 14 ? 1 : 0 } };
    }

    evaluateRules(w);

    const build = w.tasks.find((t) => t.kind === "build" && t.target.buildSpec === "AsteroidHarvester");
    expect(build).toBeDefined();
    expect(build!.target.bayIdx).toBe(0);
  });

  it("rule idempotent — dvojí evaluate nevytvoří druhý Harvester", () => {
    const w = createInitialWorld();
    w.modules["dock_1"] = {
      id: "dock_1", kind: "Dock", rootIdx: 6, status: "online",
      hp: 1000, hp_max: 1000, progress_wd: 0,
    };
    for (const idx of [6, 7, 14, 15]) {
      w.segment[idx] = idx === 6
        ? { kind: "module_root", moduleId: "dock_1" }
        : { kind: "module_ref", moduleId: "dock_1", rootOffset: { dx: idx === 7 ? 1 : 0, dy: idx >= 14 ? 1 : 0 } };
    }
    evaluateRules(w);
    evaluateRules(w);
    const builds = w.tasks.filter((t) => t.kind === "build" && t.target.buildSpec === "AsteroidHarvester");
    expect(builds).toHaveLength(1);
  });

  it("FVP_RULES obsahuje obě pravidla (Dock + Harvester)", () => {
    expect(FVP_RULES).toHaveLength(2);
    const ids = FVP_RULES.map((r) => r.id);
    expect(ids).toContain("post-engine-demo-build-dock");
    expect(ids).toContain("post-dock-build-harvester");
  });
});
