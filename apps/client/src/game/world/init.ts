// World factory — `createInitialWorld()`.
// Iniciální svět: cestovní minimalistická konfigurace (S36). Jediný 2×2 modul =
// Engine (záď). 8 drobných 1×1 modulů v body, 4 void na čele lodi (první
// zastavěné při probuzení kolonistů, R2). Deterministický layout (žádný shuffle),
// user learns anatomy.
//
//   Col:  0  1  2  3  4  5  6  7
//   Row0: .. .. So So St St En En   (energie + zásoby = backup systémy nahoře)
//   Row1: .. .. Hb Mc As CP En En   (obytné + utility dole)
//
// Logika: 2× Solar + 2× Storage = cestovní redundance (obrovské zásoby, záloha E).
// Čelo (cols 0-1) = void, místo pro expansion při příjezdu k cíli.
//
// Wear 85–100 % hp_max + 1 critical damage pro Observer start.

import type { World, Bay, Module, Actor, ModuleKind } from "../model";
import { MODULE_DEFS } from "../model";
import {
  SEED_SOLIDS,
  SEED_FLUIDS,
  SEED_COIN,
  SEED_CREW_CRYO,
  SEED_DRONES,
  FLOW_WINDOW_GAME_DAYS,
  ENERGY_SEED,
  ACTOR_HP_MAX,
  PROTOCOL_VERSION,
  QM_DRAW_W,
} from "../tuning";
import { appendEvent } from "../events";
import { applyLightWear, applyRandomDamages } from "./damage";
import { computeEnergyMax } from "./production";
import { recomputeStatus } from "./status";

export function createInitialWorld(): World {
  // 1) 16× void (prázdné sloty).
  const segment: Bay[] = Array.from({ length: 16 }, () => ({ kind: "void" }));

  const modules: Record<string, Module> = {};

  // Helper: vytvoří modul instance + obsadí bay(y) v segmentu.
  // Root bay = module_root, ostatní bays (multi-bay moduly) = module_ref.
  const placeModule = (id: string, kind: ModuleKind, rootIdx: number) => {
    const def = MODULE_DEFS[kind];
    // Engine startuje offline (nefunkční, k demontáži). Ostatní online.
    const status = kind === "Engine" ? "offline" : "online";
    modules[id] = {
      id,
      kind,
      rootIdx,
      status,
      hp: def.max_hp,
      hp_max: def.max_hp,
      progress_wd: 0,
    };
    const rootRow = Math.floor(rootIdx / 8);
    const rootCol = rootIdx % 8;
    for (let dy = 0; dy < def.h; dy++) {
      for (let dx = 0; dx < def.w; dx++) {
        const idx = (rootRow + dy) * 8 + (rootCol + dx);
        if (dx === 0 && dy === 0) {
          segment[idx] = { kind: "module_root", moduleId: id };
        } else {
          segment[idx] = { kind: "module_ref", moduleId: id, rootOffset: { dx, dy } };
        }
      }
    }
  };

  // 2) Deterministický cestovní layout — 9 modulů, 12 module bays + 4 void (čelo).
  // Tuple [id, kind, rootIdx]. Pořadí v poli nemá efekt na layout (rootIdx
  // určuje pozici), jen čitelnost pro review.
  const START_MODULES: Array<[string, ModuleKind, number]> = [
    ["engine_1",      "Engine",      6],  // záď 2×2 (cols 6-7, rows 0-1)
    ["solar_1",       "SolarArray",  2],  // top row
    ["solar_2",       "SolarArray",  3],
    ["storage_1",     "Storage",     4],
    ["storage_2",     "Storage",     5],
    ["habitat_1",     "Habitat",    10],  // bottom row
    ["medcore_1",     "MedCore",    11],
    ["assembler_1",   "Assembler",  12],
    ["commandpost_1", "CommandPost",13],
  ];
  for (const [id, kind, rootIdx] of START_MODULES) {
    placeModule(id, kind, rootIdx);
  }

  // 5) Lehké opotřebení — všechny moduly random 85–100 % hp_max.
  applyLightWear(segment, modules);

  // 6) Jeden critical damage pro Observer start — hned vidí, co opravit.
  applyRandomDamages(segment, modules);

  // Posádka — SEED_CREW_CRYO aktérů v cryo (vazba: MedCore 32 cryolůžek).
  // Hráč = id `player`, ostatní colonist_01..colonist_NN. Všichni start cryo;
  // wake-up přijde s mechanismem (IDEAS/TODO).
  const actors: Actor[] = [
    { id: "player", kind: "player", state: "cryo", hp: ACTOR_HP_MAX, hp_max: ACTOR_HP_MAX, work: 8 },
  ];
  for (let i = 1; i < SEED_CREW_CRYO; i++) {
    actors.push({
      id: `colonist_${String(i).padStart(2, "0")}`,
      kind: "player",
      state: "cryo",
      hp: ACTOR_HP_MAX,
      hp_max: ACTOR_HP_MAX,
      work: 8,
    });
  }

  const world: World = {
    tick: 0,
    phase: "running",
    resources: {
      energy: ENERGY_SEED,
      solids: SEED_SOLIDS,
      fluids: SEED_FLUIDS,
      coin: SEED_COIN,
    },
    flow: {
      solids: { inBuf: new Array(FLOW_WINDOW_GAME_DAYS).fill(0), outBuf: new Array(FLOW_WINDOW_GAME_DAYS).fill(0) },
      fluids: { inBuf: new Array(FLOW_WINDOW_GAME_DAYS).fill(0), outBuf: new Array(FLOW_WINDOW_GAME_DAYS).fill(0) },
      lastDay: 0,
      filled: 0, // roste do WINDOW s každým uzavřeným game day
    },
    segment,
    modules,
    actors,
    tasks: [],
    events: [],
    status: {
      overall: { pct: 100, level: "ok" },
      tier1: { pct: 100, level: "ok" },
      tier2: { pct: 100, level: "ok" },
      crew: { pct: 100, level: "ok" },
      base: { pct: 100, level: "ok" },
      supplies: { pct: 100, level: "ok" },
      integrity: { pct: 100, level: "ok" },
    },
    energyMax: 0, // přepočte se v recomputeStatus níže
    drones: SEED_DRONES,   // počet pracovních dronů — převodník E→WD
    next_task_id: 1,
    software: {
      quartermaster: {
        id: "quartermaster",
        name: "QuarterMaster",
        version: PROTOCOL_VERSION,
        draw_w: QM_DRAW_W,
        status: "running",
      },
    },
  };

  world.energyMax = computeEnergyMax(world);
  recomputeStatus(world); // seed reálný status, aby první tick neemitoval falešný STAT

  // S24 QuarterMaster — eternal service task (monitor autopilota).
  // Zůstává v seznamu vždy; label se přepisuje podle stavu v protocolTick.
  world.tasks.push({
    id: `task_${world.next_task_id++}`,
    kind: "service",
    target: {},
    wd_total: 0,
    wd_done: 0,
    assigned: [],
    priority: 0,
    status: "eternal",
    createdAt: 0,
    label: `QuarterMaster ${PROTOCOL_VERSION} — Idle`,
  });

  appendEvent(world, "SYST", { text: "Simulace spuštěna" });
  return world;
}
