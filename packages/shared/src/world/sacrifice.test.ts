// Unit testy pro deadlock detekci + sacrifice candidates + wake-up trigger (S39).

import { describe, it, expect } from "vitest";
import { createInitialWorld } from "./init";
import { getSacrificeCandidates, chooseSacrifice, isDeadlocked } from "./sacrifice";
import { protocolTick } from "./protocol";

describe("getSacrificeCandidates", () => {
  it("vylučuje blacklist (Habitat, MedCore, CommandPost)", () => {
    const w = createInitialWorld();
    const cand = getSacrificeCandidates(w);
    const kinds = new Set(cand.map((c) => c.kind));
    expect(kinds.has("Habitat")).toBe(false);
    expect(kinds.has("MedCore")).toBe(false);
    expect(kinds.has("CommandPost")).toBe(false);
  });

  it("vylučuje Engine (offline) a nabízí Solar / Storage / Assembler", () => {
    const w = createInitialWorld();
    const cand = getSacrificeCandidates(w);
    const kinds = new Set(cand.map((c) => c.kind));
    expect(kinds.has("Engine")).toBe(false);
    expect(kinds.has("SolarArray")).toBe(true);
    expect(kinds.has("Storage")).toBe(true);
    expect(kinds.has("Assembler")).toBe(true);
  });

  it("recovery estimate = (hp/hp_max) × recipe × DEMOLISH_RECOVERY_RATIO", () => {
    const w = createInitialWorld();
    // Normalize HP pro determinism.
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    const cand = getSacrificeCandidates(w);
    const solar = cand.find((c) => c.kind === "SolarArray")!;
    // Solar recipe: 40 Solids, 0 Fluids. Ratio 0.5 × 1.0 × 40 = 20.
    expect(solar.recoverySolids).toBeCloseTo(20, 1);
    expect(solar.recoveryFluids).toBe(0);
  });

  it("sort desc podle totalRecovery — Assembler před Solar/Storage", () => {
    const w = createInitialWorld();
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;
    const cand = getSacrificeCandidates(w);
    // Assembler recipe 94+17 → 47+8.5 = 55.5. Solar 20. Storage 18.
    expect(cand[0]!.kind).toBe("Assembler");
  });
});

describe("isDeadlocked", () => {
  it("materialReasonPresent=false → false (QM nezaseklý)", () => {
    const w = createInitialWorld();
    expect(isDeadlocked(w, false)).toBe(false);
  });

  it("engine demo ještě neproběhl → false (rescue je možný)", () => {
    const w = createInitialWorld();
    w.engineDemoEnqueued = false;
    expect(isDeadlocked(w, true)).toBe(false);
  });

  it("live demo běží → false (rescue právě probíhá)", () => {
    const w = createInitialWorld();
    w.engineDemoEnqueued = true;
    w.tasks.push({
      id: "demo_1", kind: "demolish", target: { moduleId: "x" },
      wd_total: 60, wd_done: 0, assigned: [], priority: 1,
      status: "active", createdAt: 0,
    });
    expect(isDeadlocked(w, true)).toBe(false);
  });

  it("deadlock — material missing + demo done + paused build existuje → true", () => {
    const w = createInitialWorld();
    w.engineDemoEnqueued = true;
    w.tasks.push({
      id: "build_1", kind: "build", target: { moduleId: "dock_1", bayIdx: 6, buildSpec: "Dock" },
      wd_total: 48, wd_done: 10, assigned: [], priority: 1,
      status: "paused", createdAt: 0,
    });
    expect(isDeadlocked(w, true)).toBe(true);
  });
});

describe("chooseSacrifice", () => {
  it("obětování → enqueue demo task + clear pendingDecision + SYST event", () => {
    const w = createInitialWorld();
    w.pendingDecision = "sacrifice-for-build";
    const victim = Object.values(w.modules).find((m) => m.kind === "SolarArray")!;
    const ok = chooseSacrifice(w, victim.id);
    expect(ok).toBe(true);
    expect(w.pendingDecision).toBeNull();
    const demo = w.tasks.find((t) => t.kind === "demolish" && t.target.moduleId === victim.id);
    expect(demo).toBeDefined();
    const syst = w.events.find((e) => e.verb === "SYST" && e.actor === "player");
    expect(syst).toBeDefined();
  });

  it("neznámý moduleId → false", () => {
    const w = createInitialWorld();
    expect(chooseSacrifice(w, "nonexistent")).toBe(false);
  });
});

describe("protocolTick — wake-up trigger", () => {
  it("deadlock → captainAwake flip + pendingDecision set + WAKE event", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    w.engineDemoEnqueued = true;

    // Umělé fixture: build task pending, solids=0 → material gate po tick.
    // Přímo vytvořím paused build task + simuluju že materialReason bude true.
    // Aby materialPauseReason vrátil "no Solids", potřebuju repair task
    // (materialPauseReason iteruje repair). Vytvořím repair task manuálně.
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;
    // 1 damaged modul pro repair task hook.
    const solar = Object.values(w.modules).find((m) => m.kind === "SolarArray")!;
    solar.hp = solar.hp_max * 0.5; // damaged
    w.tasks.push({
      id: "repair_1", kind: "repair", target: { moduleId: solar.id },
      wd_total: 10, wd_done: 0, assigned: [], priority: 1,
      status: "paused", createdAt: 0,
    });
    // Build task (paused) čekající na Solids.
    w.tasks.push({
      id: "build_1", kind: "build", target: { moduleId: "dock_1", bayIdx: 6, buildSpec: "Dock" },
      wd_total: 48, wd_done: 10, assigned: [], priority: 1,
      status: "paused", createdAt: 0,
    });
    w.resources.solids = 0;

    expect(w.captainAwake).toBe(false);
    protocolTick(w);

    expect(w.captainAwake).toBe(true);
    expect(w.pendingDecision).toBe("sacrifice-for-build");
    const wake = w.events.find((e) => e.verb === "SYST" && e.csq === "CRIT" && e.text?.includes("Kapitán"));
    expect(wake).toBeDefined();
    // Player actor přepnut z cryo na idle.
    const player = w.actors.find((a) => a.id === "player");
    expect(player?.state).toBe("idle");
  });

  it("opakovaný deadlock po vyřešení → pendingDecision re-set, ale captainAwake už ne flip", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    w.engineDemoEnqueued = true;
    w.captainAwake = true; // už probuzen
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;
    const solar = Object.values(w.modules).find((m) => m.kind === "SolarArray")!;
    solar.hp = solar.hp_max * 0.5;
    w.tasks.push({
      id: "repair_1", kind: "repair", target: { moduleId: solar.id },
      wd_total: 10, wd_done: 0, assigned: [], priority: 1,
      status: "paused", createdAt: 0,
    });
    w.tasks.push({
      id: "build_1", kind: "build", target: { moduleId: "dock_1", bayIdx: 6, buildSpec: "Dock" },
      wd_total: 48, wd_done: 10, assigned: [], priority: 1,
      status: "paused", createdAt: 0,
    });
    w.resources.solids = 0;

    protocolTick(w);

    expect(w.pendingDecision).toBe("sacrifice-for-build");
    // Druhá zpráva stylu „Další rozhodnutí…" bez opětovného probuzení.
    const second = w.events.find((e) => e.verb === "SYST" && e.text?.includes("Další rozhodnutí"));
    expect(second).toBeDefined();
  });
});
