// World factory — `createInitialWorld()`.
// Iniciální svět: kompaktní mateřská loď (S28 KISS — void ↔ module).
//   - Engine 2×2 fix v zadní části (idx 6 → 6,7,14,15)
//   - 8 modulů (Hab + 2× Sol + Med + Ass + CP + 2× Sto) přilepených k motoru
//     ve 4-sloupcovém pásu (cols 2-5 → idx 2,3,4,5,10,11,12,13). Random pořadí.
//   - Zbylé 4 bays vlevo (cols 0-1) = void — místo pro budoucí expanzi.
// Wear 85–100 % hp_max + 1 critical damage pro Observer start.

import type { World, Bay, Module, Actor, ModuleKind } from "../model";
import { MODULE_DEFS } from "../model";
import {
  SEED_SOLIDS,
  SEED_FLUIDS,
  SEED_COIN,
  SEED_CREW_CRYO,
  FLOW_WINDOW_GAME_DAYS,
  ENERGY_SEED,
  ACTOR_HP_MAX,
  PROTOCOL_VERSION,
  QM_DRAW_W,
} from "../tuning";
import { appendEvent } from "../events";
import { shuffleInPlace } from "./random";
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

  // 2) Engine 2×2 na fixní pozici — kotevní bod (idx 6 → obsadí 6,7,14,15).
  placeModule("engine_1", "Engine", 6);

  // 3) Tělo lodi — 8 bays přilepených k motoru (cols 2-5, rows 0-1).
  // Random pořadí drží variaci, ale layout zůstává kompaktní (žádné odlepené moduly).
  // Zbytek (cols 0-1 = idx 0,1,8,9) zůstává void — místo pro budoucí expanzi.
  const BODY_IDXS = [2, 3, 4, 5, 10, 11, 12, 13];
  shuffleInPlace(BODY_IDXS);

  // 4) 8 modulů na BODY_IDXS — Habitat + 2× SolarArray + MedCore + Assembler + CommandPost + 2× Storage.
  const START_MODULES: Array<[string, ModuleKind]> = [
    ["habitat_1", "Habitat"],
    ["solar_1", "SolarArray"],
    ["solar_2", "SolarArray"],
    ["medcore_1", "MedCore"],
    ["assembler_1", "Assembler"],
    ["commandpost_1", "CommandPost"],
    ["storage_1", "Storage"],
    ["storage_2", "Storage"],
  ];
  for (let i = 0; i < START_MODULES.length; i++) {
    const [id, kind] = START_MODULES[i]!;
    placeModule(id, kind, BODY_IDXS[i]!);
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
    drones: 23,   // počet pracovních dronů — převodník E→WD
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

  appendEvent(world, "BOOT", { text: "Simulace spuštěna" });
  return world;
}
