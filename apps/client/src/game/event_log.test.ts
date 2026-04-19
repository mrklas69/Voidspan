// Smoke testy pro lazy filter chips LS persist (S29).
// Mock localStorage přes globalThis (stejný pattern jako panel_helpers.test.ts).

import { describe, it, expect, beforeEach } from "vitest";
import type { EventVerb } from "@voidspan/shared";
import { loadVerbFilters, saveVerbFilters, FILTER_LS_KEY } from "./event_log";

type LSStub = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

function mockLocalStorage(): LSStub {
  // Uzavřený store per mock (beforeEach) — izolované testy.
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
  };
}

function brokenLocalStorage(): LSStub {
  return {
    getItem: () => { throw new Error("denied (incognito)"); },
    setItem: () => { throw new Error("denied (incognito)"); },
  };
}

type LSGlobal = { localStorage: LSStub };
const setLS = (s: LSStub): void => { (globalThis as unknown as LSGlobal).localStorage = s; };

describe("event_log — lazy filter chips LS persist", () => {
  beforeEach(() => {
    setLS(mockLocalStorage());
  });

  it("první spuštění (prázdné LS) → všechny verbs default ON (prázdná mapa)", () => {
    const filters = loadVerbFilters();
    expect(filters.size).toBe(0);
    expect(filters.has("ASSN")).toBe(false); // absence = default ON
    expect(filters.has("DMG")).toBe(false);
  });

  it("save + load roundtrip zachová OFF stavy", () => {
    const f = new Map<EventVerb, boolean>();
    f.set("ASSN", false);
    f.set("DMG", false);
    saveVerbFilters(f);

    const loaded = loadVerbFilters();
    expect(loaded.get("ASSN")).toBe(false);
    expect(loaded.get("DMG")).toBe(false);
  });

  it("save prázdné mapy → load prázdné (žádné OFF stavy)", () => {
    saveVerbFilters(new Map());
    const loaded = loadVerbFilters();
    expect(loaded.size).toBe(0);
  });

  it("ON stavy se neukládají (default ON = absence klíče)", () => {
    const f = new Map<EventVerb, boolean>();
    f.set("ASSN", true);  // ON — neukládat
    f.set("DMG", false);  // OFF — uložit
    saveVerbFilters(f);

    const raw = (globalThis as unknown as LSGlobal).localStorage.getItem(FILTER_LS_KEY);
    expect(raw).toBe(JSON.stringify(["DMG"]));
  });

  it("broken JSON v LS → fallback prázdná mapa (všechny ON)", () => {
    const ls = mockLocalStorage();
    ls.setItem(FILTER_LS_KEY, "not-valid-json");
    setLS(ls);
    const filters = loadVerbFilters();
    expect(filters.size).toBe(0);
  });

  it("incognito (getItem throws) → fallback prázdná mapa (všechny ON)", () => {
    setLS(brokenLocalStorage());
    const filters = loadVerbFilters();
    expect(filters.size).toBe(0);
  });

  it("incognito (setItem throws) → save nehází", () => {
    setLS(brokenLocalStorage());
    const f = new Map<EventVerb, boolean>();
    f.set("DMG", false);
    expect(() => saveVerbFilters(f)).not.toThrow();
  });
});
