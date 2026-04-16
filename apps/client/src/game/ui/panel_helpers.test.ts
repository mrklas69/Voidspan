// Smoke testy pro panel_helpers — LS pref save/load + incognito fallback.
// Mock localStorage přes globalThis assignment (žádný jsdom potřeba).

import { describe, it, expect, beforeEach } from "vitest";
import { loadPanelOpenPref, savePanelOpenPref } from "./panel_helpers";

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
