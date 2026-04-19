// Testy pro world/bay.ts — getOuterHP + getBayTrajectory.
// Po S28 layered bay retire: bay tagged union jen { void | module_root | module_ref }.

import { describe, it, expect } from "vitest";
import { getOuterHP, getBayTrajectory } from "./bay";
import { createInitialWorld } from "./init";

describe("getOuterHP", () => {
  const w = createInitialWorld();

  it("void bay → null", () => {
    const w2 = createInitialWorld();
    w2.segment[0] = { kind: "void" };
    expect(getOuterHP(w2, 0)).toBeNull();
  });

  it("out-of-range index → null", () => {
    expect(getOuterHP(w, 999)).toBeNull();
  });

  it("module_root bay → deleguje na modul (kind = label)", () => {
    const idx = w.segment.findIndex((b) => b.kind === "module_root");
    expect(idx).toBeGreaterThanOrEqual(0);
    const bay = w.segment[idx];
    if (bay?.kind !== "module_root") throw new Error("expected module_root");
    const mod = w.modules[bay.moduleId]!;
    const out = getOuterHP(w, idx);
    expect(out).toEqual({ hp: mod.hp, hp_max: mod.hp_max, label: mod.kind });
  });

  it("module_ref bay → také deleguje na modul (multi-bay Engine)", () => {
    const idx = w.segment.findIndex((b) => b.kind === "module_ref");
    if (idx < 0) return; // některé seedy nemusí mít multi-bay
    const bay = w.segment[idx];
    if (bay?.kind !== "module_ref") throw new Error("expected module_ref");
    const mod = w.modules[bay.moduleId]!;
    const out = getOuterHP(w, idx);
    expect(out).toEqual({ hp: mod.hp, hp_max: mod.hp_max, label: mod.kind });
  });
});

describe("getBayTrajectory", () => {
  it("default bez tasku → static", () => {
    const w = createInitialWorld();
    expect(getBayTrajectory(w, 0)).toBe("static");
  });

  it("void bay → static (early return)", () => {
    const w = createInitialWorld();
    w.segment[0] = { kind: "void" };
    expect(getBayTrajectory(w, 0)).toBe("static");
  });

  it("repair task na modulu pod bayem → rising (s assigned actor)", () => {
    const w = createInitialWorld();
    const idx = w.segment.findIndex((b) => b.kind === "module_root");
    expect(idx).toBeGreaterThanOrEqual(0);
    const bay = w.segment[idx];
    if (bay?.kind !== "module_root") throw new Error("expected module_root");
    w.tasks.push({
      id: "task_test",
      kind: "repair",
      target: { moduleId: bay.moduleId },
      wd_total: 10, wd_done: 0,
      assigned: ["player"],
      priority: 1,
      status: "active",
      createdAt: 0,
    });
    expect(getBayTrajectory(w, idx)).toBe("rising");
  });

  it("demolish task s assigned → falling", () => {
    const w = createInitialWorld();
    const idx = w.segment.findIndex((b) => b.kind === "module_root");
    expect(idx).toBeGreaterThanOrEqual(0);
    const bay = w.segment[idx];
    if (bay?.kind !== "module_root") throw new Error("expected module_root");
    w.tasks.push({
      id: "task_test",
      kind: "demolish",
      target: { moduleId: bay.moduleId },
      wd_total: 10, wd_done: 0,
      assigned: ["player"],
      priority: 1,
      status: "active",
      createdAt: 0,
    });
    expect(getBayTrajectory(w, idx)).toBe("falling");
  });

  it("task bez assigned → static (i s repair task)", () => {
    const w = createInitialWorld();
    const idx = w.segment.findIndex((b) => b.kind === "module_root");
    expect(idx).toBeGreaterThanOrEqual(0);
    const bay = w.segment[idx];
    if (bay?.kind !== "module_root") throw new Error("expected module_root");
    w.tasks.push({
      id: "task_test",
      kind: "repair",
      target: { moduleId: bay.moduleId },
      wd_total: 10, wd_done: 0,
      assigned: [],
      priority: 1,
      status: "pending",
      createdAt: 0,
    });
    expect(getBayTrajectory(w, idx)).toBe("static");
  });
});
