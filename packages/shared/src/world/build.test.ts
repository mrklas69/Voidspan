// Unit testy pro build task mechanika + QM rule (S39 — post-engine-demo → Dock).

import { describe, it, expect } from "vitest";
import { createInitialWorld } from "./init";
import { enqueueBuildTask, progressTasks, enqueueDemolishTask } from "./task";
import { protocolTick } from "./protocol";
import { FVP_RULES, evaluateRules } from "./rules";
import { MODULE_DEFS } from "../model";

describe("enqueueBuildTask", () => {
  it("vytvoří modul instance (status=building, hp=0) + obsadí bays + task", () => {
    const w = createInitialWorld();
    // Engine 2×2 nejdřív odstranit (aby bays 6,7,14,15 byly void).
    const engine = Object.values(w.modules).find((m) => m.kind === "Engine")!;
    enqueueDemolishTask(w, engine.id);
    const demo = w.tasks.find((t) => t.kind === "demolish")!;
    demo.status = "active";
    demo.wd_done = demo.wd_total - 0.001;
    w.resources.energy = w.energyMax;
    progressTasks(w); // dokončí demo, bays 6,7,14,15 → void

    expect(enqueueBuildTask(w, "Dock", 6)).toBe(true);

    const task = w.tasks.find((t) => t.kind === "build");
    expect(task).toBeDefined();
    expect(task!.wd_total).toBe(MODULE_DEFS.Dock.wd_to_build);

    const dock = w.modules[task!.target.moduleId!];
    expect(dock).toBeDefined();
    expect(dock!.kind).toBe("Dock");
    expect(dock!.status).toBe("building");
    expect(dock!.hp).toBe(0);

    // 4 bays obsazené: root (6) + 3 refs (7, 14, 15).
    expect(w.segment[6]!.kind).toBe("module_root");
    expect(w.segment[7]!.kind).toBe("module_ref");
    expect(w.segment[14]!.kind).toBe("module_ref");
    expect(w.segment[15]!.kind).toBe("module_ref");
  });

  it("odmítne build pokud bays nejsou void", () => {
    const w = createInitialWorld();
    // rootIdx 2 = solar_1 (module_root). Build sem nelze.
    expect(enqueueBuildTask(w, "Dock", 2)).toBe(false);
  });

  it("odmítne build pokud přesahuje segment (out of bounds)", () => {
    const w = createInitialWorld();
    // Dock 2×2 na rootIdx 7 (col 7) by přesahoval sloupec 8 — mimo.
    expect(enqueueBuildTask(w, "Dock", 7)).toBe(false);
  });

  it("idempotent — druhé volání na stejné rootIdx vrátí false", () => {
    const w = createInitialWorld();
    // Připrav 2×2 void blok (cols 0-1).
    expect(w.segment[0]!.kind).toBe("void");
    expect(enqueueBuildTask(w, "Dock", 0)).toBe(true);
    expect(enqueueBuildTask(w, "Dock", 0)).toBe(false);
  });
});

describe("progressTasks — build větev", () => {
  it("HP modulu roste z 0 k hp_max, Solids klesá (recipe konzumace)", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    w.resources.solids = 100;

    expect(enqueueBuildTask(w, "Dock", 0)).toBe(true);
    const task = w.tasks.find((t) => t.kind === "build")!;
    task.status = "active";
    const dock = w.modules[task.target.moduleId!]!;

    const solidsBefore = w.resources.solids;
    for (let i = 0; i < 10; i++) progressTasks(w);

    expect(dock.hp).toBeGreaterThan(0);
    expect(w.resources.solids).toBeLessThan(solidsBefore);
  });

  it("při completion: status=online, hp=hp_max, CMPL:OK event", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    w.resources.solids = 100;

    enqueueBuildTask(w, "Dock", 0);
    const task = w.tasks.find((t) => t.kind === "build")!;
    task.status = "active";
    task.wd_done = task.wd_total - 0.001;
    progressTasks(w);

    const dock = w.modules[task.target.moduleId!]!;
    expect(task.status).toBe("completed");
    expect(dock.status).toBe("online");
    expect(dock.hp).toBe(dock.hp_max);

    const cmpl = w.events.find((e) => e.verb === "CMPL" && e.item === "build");
    expect(cmpl).toBeDefined();
  });
});

describe("QM rule: post-engine-demo → Dock build", () => {
  it("FVP_RULES obsahuje post-engine-demo-build-dock s aspirační DSL syntaxí", () => {
    const rule = FVP_RULES.find((r) => r.id === "post-engine-demo-build-dock");
    expect(rule).toBeDefined();
    expect(rule!.dsl).toMatch(/if engine_1\.status == removed then/);
  });

  it("rule not triggered — Engine pořád existuje", () => {
    const w = createInitialWorld();
    evaluateRules(w);
    expect(w.tasks.some((t) => t.kind === "build")).toBe(false);
  });

  it("rule triggered — engine_1 odstraněn + flag true → enqueue build Dock", () => {
    const w = createInitialWorld();
    // Simuluj stav po Engine demo completion.
    w.engineDemoEnqueued = true;
    const engineId = Object.values(w.modules).find((m) => m.kind === "Engine")!.id;
    // Manuální demo finish: bays → void, modul pryč.
    for (let i = 0; i < w.segment.length; i++) {
      const bay = w.segment[i];
      if (bay?.kind === "module_root" && bay.moduleId === engineId) w.segment[i] = { kind: "void" };
      if (bay?.kind === "module_ref" && bay.moduleId === engineId) w.segment[i] = { kind: "void" };
    }
    delete w.modules[engineId];

    evaluateRules(w);

    const build = w.tasks.find((t) => t.kind === "build");
    expect(build).toBeDefined();
    expect(build!.target.buildSpec).toBe("Dock");
    expect(build!.target.bayIdx).toBe(6);
    const dock = w.modules["dock_1"];
    expect(dock).toBeDefined();
  });

  it("rule idempotent — dvojí evaluate nevytvoří druhý Dock", () => {
    const w = createInitialWorld();
    w.engineDemoEnqueued = true;
    const engineId = Object.values(w.modules).find((m) => m.kind === "Engine")!.id;
    for (let i = 0; i < w.segment.length; i++) {
      const bay = w.segment[i];
      if (bay?.kind === "module_root" && bay.moduleId === engineId) w.segment[i] = { kind: "void" };
      if (bay?.kind === "module_ref" && bay.moduleId === engineId) w.segment[i] = { kind: "void" };
    }
    delete w.modules[engineId];

    evaluateRules(w);
    evaluateRules(w);
    expect(w.tasks.filter((t) => t.kind === "build")).toHaveLength(1);
  });

  it("end-to-end: protocolTick enqueuje build Dock po simulaci demo completion", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    // Simuluj stav: engine demo flag true + Engine smazán (demo completed).
    w.engineDemoEnqueued = true;
    const engineId = Object.values(w.modules).find((m) => m.kind === "Engine")!.id;
    for (let i = 0; i < w.segment.length; i++) {
      const bay = w.segment[i];
      if (bay?.kind === "module_root" && bay.moduleId === engineId) w.segment[i] = { kind: "void" };
      if (bay?.kind === "module_ref" && bay.moduleId === engineId) w.segment[i] = { kind: "void" };
    }
    delete w.modules[engineId];
    // Všechny ostatní moduly na plné HP aby QM neřešil repair.
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    protocolTick(w);

    const build = w.tasks.find((t) => t.kind === "build");
    expect(build).toBeDefined();
    expect(build!.status).toBe("active");
  });
});
