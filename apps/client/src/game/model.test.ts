// Sanity testy pro statický katalog (MODULE_DEFS / ACTOR_DEFS / TASK_DEFS).
// Chytá typos: nesoulad kind vs klíč, prázdné asset, nesmyslné HP/WD, chybějící popis.
// Levné — běží za ~10 ms, drží invarianty při editaci katalogu.

import { describe, it, expect } from "vitest";
import { MODULE_DEFS, ACTOR_DEFS, TASK_DEFS } from "./model";

describe("MODULE_DEFS catalog invariants", () => {
  it("klíč v mapě se rovná .kind v definici (FK konzistence)", () => {
    for (const [key, def] of Object.entries(MODULE_DEFS)) {
      expect(def.kind).toBe(key);
    }
  });

  it("každý modul má neprázdné label, asset, description", () => {
    for (const def of Object.values(MODULE_DEFS)) {
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.asset.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });

  it("asset filename je lowercase snake_case + .png (konvence)", () => {
    const rx = /^[a-z0-9_]+\.png$/;
    for (const def of Object.values(MODULE_DEFS)) {
      expect(def.asset).toMatch(rx);
    }
  });

  it("rozměry w×h jsou kladné a ≤ 2 (segment je 2 řady)", () => {
    for (const def of Object.values(MODULE_DEFS)) {
      expect(def.w).toBeGreaterThan(0);
      expect(def.h).toBeGreaterThan(0);
      expect(def.h).toBeLessThanOrEqual(2);
    }
  });

  it("HP + WD jsou nezáporné a max_hp > 0", () => {
    for (const def of Object.values(MODULE_DEFS)) {
      expect(def.max_hp).toBeGreaterThan(0);
      expect(def.wd_to_build).toBeGreaterThanOrEqual(0);
      expect(def.wd_to_demolish).toBeGreaterThanOrEqual(0);
    }
  });

  it("P1 obsahuje alespoň SolarArray, Engine, Dock (scénář §7)", () => {
    expect(MODULE_DEFS.SolarArray).toBeDefined();
    expect(MODULE_DEFS.Engine).toBeDefined();
    expect(MODULE_DEFS.Dock).toBeDefined();
  });
});

describe("ACTOR_DEFS catalog invariants", () => {
  it("klíč v mapě se rovná .kind v definici", () => {
    for (const [key, def] of Object.entries(ACTOR_DEFS)) {
      expect(def.kind).toBe(key);
    }
  });

  it("má přesně 1 roli: player", () => {
    expect(Object.keys(ACTOR_DEFS).sort()).toEqual(["player"]);
  });

  it("power_w hodnoty odpovídají seed kalibraci", () => {
    expect(ACTOR_DEFS.player.power_w).toBe(8);
  });
});

describe("TASK_DEFS catalog invariants", () => {
  it("klíč v mapě se rovná .kind v definici", () => {
    for (const [key, def] of Object.entries(TASK_DEFS)) {
      expect(def.kind).toBe(key);
    }
  });

  it("každý task (kromě service) má alespoň jednoho povoleného aktéra", () => {
    for (const def of Object.values(TASK_DEFS)) {
      if (def.kind === "service") continue; // S24: eternal monitor, neběží na aktérech
      expect(def.allowed_actors.length).toBeGreaterThan(0);
    }
  });

});
