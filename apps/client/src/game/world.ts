// World engine — POC_P1 §13–14.
// Čistá funkční logika: `createInitialWorld`, `stepWorld`, FSM přechody.
// Žádný Phaser import — testovatelné samostatně (budoucí unit testy).

import type { World, Tile, Phase, LossReason } from "./types";

// === Konstanty (§10 seed hodnoty) ===

// Tick: 4×/s = 250 ms. TIME_COMPRESSION 240× → 1 game hour = 15 s wall = 60 ticků.
export const TICK_MS = 250;
export const TICKS_PER_SECOND = 1000 / TICK_MS; // 4

// CAL-A1c: timeout úniku vzduchu ~6,5 min wall = 390 s = 1560 ticků.
// Air klesá lineárně ze 100 na 0 za tuto dobu.
export const AIR_TIMEOUT_TICKS = 1560;
export const AIR_DRAIN_PER_TICK = 100 / AIR_TIMEOUT_TICKS;

// CAL-B3a/b: food 40 start, 8 osob × 1 jídlo / game day.
// 1 game day = 16 game hours × 15 s wall = 240 s = 960 ticků.
// Úbytek: 8 jídla / 960 ticků = 1/120 za tick.
export const FOOD_DRAIN_PER_TICK = 8 / 960;

// Predefinovaný index damaged tile při phase_a (§14 side-effect).
// Zvolíme T6 (row 0, col 5) — mimo centrum, aby šlo vidět vizuálně.
export const DAMAGED_TILE_IDX = 5;
export const DAMAGED_WD = 10; // CAL-A1a

// === Factory ===

// Iniciální svět ve stavu `boot`. Žádné moduly, prázdný segment — detaily rozložení
// řeší phase_a onward. Pro S9 smoke test stačí tohle + damaged tile po Startu.
export function createInitialWorld(): World {
  // Array.from s callbackem → 16× `{ kind: "empty" }`. Nezávislé instance
  // (kdybychom dali `new Array(16).fill(...)`, sdílí se reference — past v TS).
  const segment: Tile[] = Array.from({ length: 16 }, () => ({ kind: "empty" }));

  return {
    tick: 0,
    phase: "boot",
    resources: {
      air: 100,
      food: 40,
      kredo: 20,
    },
    segment,
    modules: {},
    actors: [],
    tasks: [],
  };
}

// === FSM přechody ===

// boot → phase_a: vznikne damaged tile, air start 100 %.
export function startGame(w: World): void {
  if (w.phase !== "boot") return;
  w.segment[DAMAGED_TILE_IDX] = { kind: "damaged", wd_to_repair: DAMAGED_WD };
  w.resources.air = 100;
  w.phase = "phase_a";
}

// phase_a → phase_b: damaged tile opraven (debug trigger v S9 přes R).
// Side-effect §14: tile → empty, air přestává klesat (regenerace TBD později).
export function repairDone(w: World): void {
  if (w.phase !== "phase_a") return;
  w.segment[DAMAGED_TILE_IDX] = { kind: "empty" };
  w.phase = "phase_b";
}

// phase_b → phase_c: Dock online & ≥1 modul flotily připojen (debug trigger E).
export function dockComplete(w: World): void {
  if (w.phase !== "phase_b") return;
  w.phase = "phase_c";
}

// phase_c → win: hráč ukončí den (debug trigger W).
export function endDay(w: World): void {
  if (w.phase !== "phase_c") return;
  w.phase = "win";
}

// Obecný přechod na loss se zapsáním důvodu.
function toLoss(w: World, reason: LossReason): void {
  w.phase = "loss";
  w.loss_reason = reason;
  // Všichni aktéři halt (§14). Zatím pool prázdný, ale pro konzistenci.
  for (const a of w.actors) if (a.state === "working") a.state = "idle";
}

// === Tick step ===

// Jeden logický krok světa (~250 ms real-time). Čistá funkce nad mutable state —
// volaná z GameScene akumulátorem. Zjednodušeně pro S9:
//  - phase_a: air klesá
//  - phase_b+: food klesá
//  - phase_c: air i food klesají (kritická kontrola)
export function stepWorld(w: World): void {
  // Terminální stavy se neprogresují.
  if (w.phase === "win" || w.phase === "loss" || w.phase === "boot") return;

  w.tick += 1;

  // Air drain: od phase_a do phase_c (po phase_b by měla regenerovat, ale S9 KISS).
  // Pro teď: v phase_a klesá, v phase_b+ stagnuje (oprava drží). Odpovídá §14.
  if (w.phase === "phase_a") {
    w.resources.air = Math.max(0, w.resources.air - AIR_DRAIN_PER_TICK);
    if (w.resources.air <= 0) {
      toLoss(w, "air");
      return;
    }
  }

  // Food drain: od phase_b dál.
  if (w.phase === "phase_b" || w.phase === "phase_c") {
    w.resources.food = Math.max(0, w.resources.food - FOOD_DRAIN_PER_TICK);
    if (w.resources.food <= 0) {
      toLoss(w, "food");
      return;
    }
  }
}

// === Helpers pro debug HUD ===

export function phaseLabel(phase: Phase): string {
  // Mapa pro čitelný HUD. U `loss` se důvod doplňuje mimo.
  const map: Record<Phase, string> = {
    boot: "BOOT",
    phase_a: "PHASE A — HULL BREACH",
    phase_b: "PHASE B — ENGINE→DOCK",
    phase_c: "PHASE C — BONUS",
    win: "WIN",
    loss: "LOSS",
  };
  return map[phase];
}
