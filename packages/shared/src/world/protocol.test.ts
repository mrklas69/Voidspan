// Unit testy pro protocolPauseReason (S38) — jediný zdroj pravdy pro pause
// důvod (TASK:PAUSE emit text, eternal monitor label, task queue suffix).
// + S39: priority chain (CRIT preempt demo, demo one-shot guard, demo trigger).

import { describe, it, expect } from "vitest";
import { createInitialWorld } from "./init";
import { protocolPauseReason, protocolTick } from "./protocol";
import { enqueueRepairTask } from "./task";
import { stepWorld } from "./index";
import { findDamagedRootIdx } from "./test_helpers";

describe("protocolPauseReason", () => {
  it("plná E + QM running + workers + žádný task → null (ready state)", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax; // plná E nad RESUME threshold
    // Žádný repair task → firstMissingRecipeCategory null.
    // QM running + drony + E plná → null.
    expect(protocolPauseReason(w)).toBeNull();
  });

  it("QM offline → 'autopilot offline' (první v priority chain)", () => {
    const w = createInitialWorld();
    w.software.quartermaster!.status = "offline";
    expect(protocolPauseReason(w)).toBe("autopilot offline");
  });

  it("E=0 → 'low Energy' (QM online, ale E pod PAUSE threshold)", () => {
    const w = createInitialWorld();
    w.resources.energy = 0;
    expect(protocolPauseReason(w)).toBe("low Energy");
  });

  it("drones=0 + vše cryo → 'no workers'", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax; // plná E aby to neoznačilo low Energy
    w.drones = 0;
    // Všichni actors v cryo → no alive workers.
    expect(protocolPauseReason(w)).toBe("no workers");
  });

  it("enqueue repair + solids=0 → 'no Solids'", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax; // plná E
    enqueueRepairTask(w, findDamagedRootIdx(w));
    w.resources.solids = 0;
    expect(protocolPauseReason(w)).toBe("no Solids");
  });

  it("priority chain — QM offline má přednost před low E", () => {
    const w = createInitialWorld();
    w.software.quartermaster!.status = "offline";
    w.resources.energy = 0; // i při low E
    // Offline je první check → první reason.
    expect(protocolPauseReason(w)).toBe("autopilot offline");
  });

  it("priority chain — low E má přednost před no workers", () => {
    const w = createInitialWorld();
    w.resources.energy = 0;
    w.drones = 0;
    // E check před workers check.
    expect(protocolPauseReason(w)).toBe("low Energy");
  });
});

// === S39: QM smart priority engine (CRIT > live repair > live demo > new demo > repair cold) ===

describe("protocolTick priority chain (S39)", () => {
  it("damaged modul existuje → QM nezařadí demo (repair má přednost)", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    stepWorld(w);
    // Init má jeden damaged modul — QM pustí repair, ne demo.
    expect(w.tasks.some((t) => t.kind === "demolish")).toBe(false);
    expect(w.tasks.some((t) => t.kind === "repair" && t.status === "active")).toBe(true);
  });

  it("po opravě damaged modulů QM zařadí Engine demo (jednou, flag guard)", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;

    // Dotáhni všechny moduly na plné HP (simuluj dokončené opravy).
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    expect(w.engineDemoEnqueued).toBe(false);
    protocolTick(w);

    const demo = w.tasks.find((t) => t.kind === "demolish");
    expect(demo).toBeDefined();
    expect(w.engineDemoEnqueued).toBe(true);

    // Druhý tick nevytvoří další (idempotent + flag).
    protocolTick(w);
    expect(w.tasks.filter((t) => t.kind === "demolish")).toHaveLength(1);
  });

  it("CRIT poškození preempne Engine demo — demo paused, repair active", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    // Spusť demo + aktivuj.
    protocolTick(w);
    const demo = w.tasks.find((t) => t.kind === "demolish")!;
    expect(demo.status).toBe("active");

    // Asteroid — prvni non-Engine modul zmlátím na CRIT (< 15 % HP).
    const victim = Object.values(w.modules).find((m) => m.kind !== "Engine")!;
    victim.hp = victim.hp_max * 0.05;

    // Protocol musí přepnout.
    protocolTick(w);
    expect(demo.status).toBe("paused");
    const repair = w.tasks.find((t) => t.kind === "repair" && t.status === "active");
    expect(repair).toBeDefined();
    expect(repair!.target.moduleId).toBe(victim.id);
  });

  it("po dokončení CRIT repair QM resume-uje Engine demo (live task pokračuje)", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    protocolTick(w);
    const demo = w.tasks.find((t) => t.kind === "demolish")!;

    // Asteroid → CRIT preempt.
    const victim = Object.values(w.modules).find((m) => m.kind !== "Engine")!;
    victim.hp = victim.hp_max * 0.05;
    protocolTick(w);
    expect(demo.status).toBe("paused");

    // Repair doběhne — obnov HP.
    victim.hp = victim.hp_max;
    // Dokonči repair task ručně (completed).
    const repair = w.tasks.find((t) => t.kind === "repair")!;
    repair.status = "completed";
    repair.completedAt = w.tick;

    // Další tick — QM vrátí k demo.
    protocolTick(w);
    expect(demo.status).toBe("active");
  });

  it("rescue demo — material shortage pauzne repair, QM chytře spustí demo Engine", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;

    // Tick 1: QM enqueue + spustí repair na damaged modul.
    protocolTick(w);
    const repair = w.tasks.find((t) => t.kind === "repair");
    expect(repair).toBeDefined();

    // Solids dojdou — dalším tick QM detekuje material gate.
    w.resources.solids = 0;
    protocolTick(w);

    // Repair paused, ale QM nepauzuje vše — spustí rescue demo.
    expect(repair!.status).toBe("paused");
    const demo = w.tasks.find((t) => t.kind === "demolish");
    expect(demo).toBeDefined();
    expect(demo!.status).toBe("active");
    expect(w.engineDemoEnqueued).toBe(true);
  });

  it("flag engineDemoEnqueued brání re-enqueue po completion (one-shot)", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    protocolTick(w);
    const demo = w.tasks.find((t) => t.kind === "demolish")!;
    expect(w.engineDemoEnqueued).toBe(true);

    // Simuluj completion: demo dokončen + Engine modul smazán.
    demo.status = "completed";
    demo.completedAt = w.tick;
    const engineMod = Object.values(w.modules).find((m) => m.kind === "Engine")!;
    delete w.modules[engineMod.id];

    // Další tick — flag drží, nový demo se nevytvoří.
    protocolTick(w);
    const liveDemos = w.tasks.filter(
      (t) => t.kind === "demolish" && t.status !== "completed" && t.status !== "failed",
    );
    expect(liveDemos).toHaveLength(0);
  });
});
