// Unit testy pro milestone auto-advance (S39).

import { describe, it, expect } from "vitest";
import { createInitialWorld } from "./init";
import { advanceMilestones, firstPendingAck } from "./milestone";

describe("advanceMilestones", () => {
  it("repairs current → done když všechny online moduly zdravé", () => {
    const w = createInitialWorld();
    // Všechny moduly plně zdravé.
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    advanceMilestones(w);

    const repairs = w.milestones.find((m) => m.id === "repairs")!;
    expect(repairs.status).toBe("done");
    expect(repairs.acked).toBe(false);
  });

  it("chain: repairs done → dock_build automaticky current", () => {
    const w = createInitialWorld();
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    advanceMilestones(w);

    const dock = w.milestones.find((m) => m.id === "dock_build")!;
    expect(dock.status).toBe("current");
  });

  it("emit SYST event při advance", () => {
    const w = createInitialWorld();
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    advanceMilestones(w);

    const syst = w.events.find((e) => e.verb === "SYST" && e.text?.includes("Milník splněn"));
    expect(syst).toBeDefined();
    expect(syst!.text).toContain("Oprava systémů");
  });

  it("žádný damaged online modul není podmínka → repairs zůstává current", () => {
    const w = createInitialWorld();
    // Ponech default wear — aspoň jeden modul < hp_max.
    const damaged = Object.values(w.modules).find((m) => m.hp < m.hp_max);
    expect(damaged).toBeDefined();

    advanceMilestones(w);

    const repairs = w.milestones.find((m) => m.id === "repairs")!;
    expect(repairs.status).toBe("current");
  });

  it("offline modul s damaged HP neblokuje repairs done (Engine)", () => {
    const w = createInitialWorld();
    for (const mod of Object.values(w.modules)) {
      mod.hp = mod.kind === "Engine" ? mod.hp_max * 0.2 : mod.hp_max;
    }

    advanceMilestones(w);

    const repairs = w.milestones.find((m) => m.id === "repairs")!;
    expect(repairs.status).toBe("done");
  });

  it("dock_build → done když dock_1 modul existuje + online", () => {
    const w = createInitialWorld();
    // Posuň repairs na done a dock_build na current manuálně.
    w.milestones.find((m) => m.id === "repairs")!.status = "done";
    w.milestones.find((m) => m.id === "repairs")!.acked = true;
    w.milestones.find((m) => m.id === "dock_build")!.status = "current";

    // Simuluj dokončený Dock build.
    w.modules["dock_1"] = {
      id: "dock_1",
      kind: "Dock",
      rootIdx: 6,
      status: "online",
      hp: 1000,
      hp_max: 1000,
      progress_wd: 0,
    };

    advanceMilestones(w);

    const dock = w.milestones.find((m) => m.id === "dock_build")!;
    expect(dock.status).toBe("done");
    // Chain: first_wake → current.
    const wake = w.milestones.find((m) => m.id === "first_wake")!;
    expect(wake.status).toBe("current");
  });

  it("idempotent — opakovaný advanceMilestones po done nedělá nic", () => {
    const w = createInitialWorld();
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;

    advanceMilestones(w);
    const eventsBefore = w.events.length;
    advanceMilestones(w);

    // Žádný nový event nepřibyl (repairs už je done, nestartuje druhý).
    expect(w.events.length).toBe(eventsBefore);
  });
});

describe("firstPendingAck", () => {
  it("žádný done modul unacked → null", () => {
    const w = createInitialWorld();
    expect(firstPendingAck(w)).toBeNull();
  });

  it("done + !acked → vrátí tenhle milestone", () => {
    const w = createInitialWorld();
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;
    advanceMilestones(w);

    const pending = firstPendingAck(w);
    expect(pending).not.toBeNull();
    expect(pending!.id).toBe("repairs");
  });

  it("po ack (acked=true) se přestane vracet", () => {
    const w = createInitialWorld();
    for (const mod of Object.values(w.modules)) mod.hp = mod.hp_max;
    advanceMilestones(w);

    const pending = firstPendingAck(w)!;
    pending.acked = true;

    expect(firstPendingAck(w)).toBeNull();
  });
});
