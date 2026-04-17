// Smoke testy pro panel_helpers — LS pref save/load + incognito fallback.
// Mock localStorage přes globalThis assignment (žádný jsdom potřeba).

import { describe, it, expect, beforeEach } from "vitest";
import { loadPanelOpenPref, savePanelOpenPref, ellipsizePrefix } from "./panel_helpers";

type LSStub = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

function mockLocalStorage(): LSStub {
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

// Cast přes neutral wrapper — lib.dom.d.ts má Storage typ, my chceme partial mock.
// Real production kód používá jen getItem/setItem — partial mock pokrývá vše potřebné.
type LSGlobal = { localStorage: LSStub };
const setLS = (s: LSStub): void => { (globalThis as unknown as LSGlobal).localStorage = s; };

describe("panel_helpers — LS pref", () => {
  beforeEach(() => {
    setLS(mockLocalStorage());
  });

  it("default je false (klíč neexistuje)", () => {
    expect(loadPanelOpenPref("foo")).toBe(false);
  });

  it("save true → load true", () => {
    savePanelOpenPref("voidspan.test.open", true);
    expect(loadPanelOpenPref("voidspan.test.open")).toBe(true);
  });

  it("save false → load false", () => {
    savePanelOpenPref("voidspan.test.open", true);
    savePanelOpenPref("voidspan.test.open", false);
    expect(loadPanelOpenPref("voidspan.test.open")).toBe(false);
  });

  it("různé klíče se neovlivňují", () => {
    savePanelOpenPref("a", true);
    savePanelOpenPref("b", false);
    expect(loadPanelOpenPref("a")).toBe(true);
    expect(loadPanelOpenPref("b")).toBe(false);
  });

  it("incognito mode: getItem throws → load = false", () => {
    setLS(brokenLocalStorage());
    expect(loadPanelOpenPref("foo")).toBe(false);
  });

  it("incognito mode: setItem throws → save nehází", () => {
    setLS(brokenLocalStorage());
    expect(() => savePanelOpenPref("foo", true)).not.toThrow();
  });
});

describe("panel_helpers — ellipsizePrefix (pure logic)", () => {
  // Mock měřicí funkce: každý znak 10 px (hrubá aproximace monospace).
  const measureEach10 = (s: string) => s.length * 10;

  it("text se vejde → vrátí beze změny", () => {
    expect(ellipsizePrefix("short", 100, measureEach10)).toBe("short");
  });

  it("prázdný text → beze změny", () => {
    expect(ellipsizePrefix("", 10, measureEach10)).toBe("");
  });

  it("přesně hraniční šířka → beze změny (≤ maxW)", () => {
    // "abc" = 3 znaky × 10 = 30 px, maxW = 30 → fits exactly.
    expect(ellipsizePrefix("abc", 30, measureEach10)).toBe("abc");
  });

  it("přeteká → oříznuto s ellipsis", () => {
    // "CommandPost" = 11 × 10 = 110 px, maxW = 100.
    // Ellipsis "…" je 1 unicode code unit (U+2026), takže length = 1.
    // Binary search najde nejdelší prefix + "…" ≤ 100 px.
    // "CommandPo…" = 9 prefix + 1 ellipsis = 10 chars × 10 = 100 px ✓ (nejdelší fit).
    const result = ellipsizePrefix("CommandPost", 100, measureEach10);
    expect(result.endsWith("…")).toBe(true);
    expect(measureEach10(result)).toBeLessThanOrEqual(100);
    expect(result).toBe("CommandPo…");
  });

  it("extrémně úzké maxW → jen ellipsis", () => {
    // maxW = 10 → "…" samo (1 × 10 = 10 ≤ 10), žádný prefix.
    const result = ellipsizePrefix("CommandPost", 10, measureEach10);
    expect(result).toBe("…");
  });

  it("unicode v textu — zachází po JS znacích (code units)", () => {
    // České znaky = stejně jako ASCII v UTF-16 code units (1 per char).
    const result = ellipsizePrefix("Žluťoučký kůň", 100, measureEach10);
    expect(result.endsWith("…")).toBe(true);
    expect(measureEach10(result)).toBeLessThanOrEqual(100);
  });
});
