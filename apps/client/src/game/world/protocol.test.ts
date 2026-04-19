// Unit testy pro protocolPauseReason (S38) — jediný zdroj pravdy pro pause
// důvod (TASK:PAUSE emit text, eternal monitor label, task queue suffix).

import { describe, it, expect } from "vitest";
import { createInitialWorld } from "./init";
import { protocolPauseReason } from "./protocol";
import { enqueueRepairTask } from "./task";
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
