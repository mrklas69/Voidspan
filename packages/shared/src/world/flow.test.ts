// Testy pro world/flow.ts — FlowRing rolling-window KPI (S26).

import { describe, it, expect, beforeEach } from "vitest";
import { recordFlow, advanceFlowDay, averageFlow } from "./flow";
import { createInitialWorld } from "./init";
import { TICKS_PER_GAME_DAY, FLOW_WINDOW_GAME_DAYS } from "../tuning";
import type { World } from "../model";

describe("flow — recordFlow", () => {
  let w: World;
  beforeEach(() => { w = createInitialWorld(); });

  it("zaznamená do partial today bucket (poslední index)", () => {
    recordFlow(w, "solids", "out", 5);
    const ring = w.flow.solids;
    expect(ring.outBuf[ring.outBuf.length - 1]).toBe(5);
  });

  it("akumuluje opakované zápisy", () => {
    recordFlow(w, "fluids", "in", 2);
    recordFlow(w, "fluids", "in", 3);
    const ring = w.flow.fluids;
    expect(ring.inBuf[ring.inBuf.length - 1]).toBe(5);
  });

  it("ignoruje nulu / zápor", () => {
    recordFlow(w, "solids", "in", 0);
    recordFlow(w, "solids", "in", -3);
    const ring = w.flow.solids;
    expect(ring.inBuf[ring.inBuf.length - 1]).toBe(0);
  });

  it("solids/fluids + in/out drží oddělené buckets", () => {
    recordFlow(w, "solids", "in", 1);
    recordFlow(w, "solids", "out", 2);
    recordFlow(w, "fluids", "in", 3);
    recordFlow(w, "fluids", "out", 4);
    const last = FLOW_WINDOW_GAME_DAYS - 1;
    expect(w.flow.solids.inBuf[last]).toBe(1);
    expect(w.flow.solids.outBuf[last]).toBe(2);
    expect(w.flow.fluids.inBuf[last]).toBe(3);
    expect(w.flow.fluids.outBuf[last]).toBe(4);
  });
});

describe("flow — advanceFlowDay", () => {
  let w: World;
  beforeEach(() => { w = createInitialWorld(); });

  it("ne-přechod (stále stejný den) → no-op", () => {
    recordFlow(w, "solids", "in", 5);
    advanceFlowDay(w);
    expect(w.flow.filled).toBe(0);
    expect(w.flow.solids.inBuf[FLOW_WINDOW_GAME_DAYS - 1]).toBe(5);
  });

  it("přechod přes 1 game day → shift, filled += 1", () => {
    recordFlow(w, "solids", "in", 7);
    w.tick = TICKS_PER_GAME_DAY;
    advanceFlowDay(w);
    expect(w.flow.filled).toBe(1);
    // 7 se shiftne z poslední pozice na předposlední (předchozí uzavřený den).
    expect(w.flow.solids.inBuf[FLOW_WINDOW_GAME_DAYS - 2]).toBe(7);
    expect(w.flow.solids.inBuf[FLOW_WINDOW_GAME_DAYS - 1]).toBe(0);
  });

  it("filled clamp na WINDOW (přechod přes hodně dnů)", () => {
    w.tick = TICKS_PER_GAME_DAY * (FLOW_WINDOW_GAME_DAYS + 5);
    advanceFlowDay(w);
    expect(w.flow.filled).toBe(FLOW_WINDOW_GAME_DAYS);
  });
});

describe("flow — averageFlow", () => {
  let w: World;
  beforeEach(() => { w = createInitialWorld(); });

  it("filled=0 → vrací 0 (nemáme data)", () => {
    recordFlow(w, "solids", "in", 100);
    expect(averageFlow(w, "solids", "in")).toBe(0);
  });

  it("po 1 uzavřeném dni vrátí ten den (ignorace partial today)", () => {
    recordFlow(w, "solids", "in", 10);
    w.tick = TICKS_PER_GAME_DAY;
    advanceFlowDay(w);
    // Po advance je 10 v zaplněném dni, partial today je 0.
    // averageFlow čte filled (1) zaplněných dnů → vrací 10/1 = 10.
    expect(averageFlow(w, "solids", "in")).toBe(10);
  });

  it("průměr přes víc dnů (nezahrne partial today)", () => {
    recordFlow(w, "solids", "in", 10);
    w.tick = TICKS_PER_GAME_DAY;
    advanceFlowDay(w);
    recordFlow(w, "solids", "in", 20);
    w.tick = TICKS_PER_GAME_DAY * 2;
    advanceFlowDay(w);
    recordFlow(w, "solids", "in", 999); // partial today — ignorováno
    expect(averageFlow(w, "solids", "in")).toBe(15); // (10+20)/2
  });
});
