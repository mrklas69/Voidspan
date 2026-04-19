// Task engine — enqueue, assign, progress, cleanup, complete.

import type { World, Task, ActorKind, ModuleKind } from "../model";
import { TASK_DEFS, MODULE_DEFS } from "../model";
import {
  TICKS_PER_GAME_DAY,
  WD_PER_HP,
  TASK_AUTOCLEAN_TICKS,
  DEMOLISH_RECOVERY_RATIO,
} from "../tuning";
import { appendEvent } from "../events";
import { getTaskRecipe, whichResourceMissing, consumeResources, returnResources } from "./recipe";
import { taskActionCs } from "./format";

// Najde „živý" task pro daný modul — pending/active/paused. completed/failed/
// eternal ignoruje. Jediný hit (v praxi na modulu běží max jeden stavební task
// díky idempotent enqueue). Sdílený helper pro ship_render (pulse) +
// modules_panel (task_state) — izomorfismus row/bay (S36 rule-of-two extract).
export function findActiveTaskForModule(tasks: Task[], moduleId: string): Task | null {
  for (const t of tasks) {
    if (t.target.moduleId !== moduleId) continue;
    if (t.status === "pending" || t.status === "active" || t.status === "paused") return t;
  }
  return null;
}

// Stavební task = fyzicky mění HP modulu (repair/build/demolish). Service
// (eternal monitor QM) není stavební. Používá se v ship_renderu pro decision
// „má pulsovat outline?".
export function isConstructionTask(task: Task): boolean {
  return task.kind === "repair" || task.kind === "build" || task.kind === "demolish";
}

// Event loc pro task — preferuj moduleId, fallback na bay-index tag. Sdílí
// CMPL / TASK:{START|PAUSE|RESUME} / ASSN, aby byl [Kdy, Kde] header eventu
// konzistentně vyplněn pokud je lokace zřejmá (axiom „event = věta kdo/co/kdy/kde").
export function taskLoc(task: Task): string | undefined {
  return task.target.moduleId ?? (task.target.bayIdx !== undefined ? `bay${task.target.bayIdx}` : undefined);
}

// Enqueue repair task na daný bay. Cíl = modul pod bayem (po S28 jediná vrstva s HP).
// Idempotent — pokud už task existuje na stejný modul, vrátí false.
// Bay typu void = nic k opravě (true návrat false).
export function enqueueRepairTask(w: World, bayIdx: number): boolean {
  const bay = w.segment[bayIdx];
  if (!bay || bay.kind === "void") return false;

  const mod = w.modules[bay.moduleId];
  if (!mod) return false;
  if (mod.hp >= mod.hp_max) return false;
  const exists = w.tasks.some(
    (t) => t.kind === "repair" && t.target.moduleId === mod.id,
  );
  if (exists) return false;
  const wd_total = (mod.hp_max - mod.hp) * WD_PER_HP;
  w.tasks.push({
    id: `task_${w.next_task_id++}`,
    kind: "repair",
    target: { moduleId: mod.id },
    wd_total,
    wd_done: 0,
    assigned: [],
    priority: 1,
    status: "pending",
    createdAt: w.tick,
  });
  return true;
}

// Enqueue demolish task na modul. Cíl = modul (bay typu module_root).
// Idempotent — existuje-li už task na ten modul, vrátí false.
// wd_total bereme přímo z katalogu (wd_to_demolish) — KISS, lidsky čitelná
// celková práce per-kind. HP modulu klesá spojitě v progressTasks dle wd_done
// / wd_total (derivované, žádný state navíc).
export function enqueueDemolishTask(w: World, moduleId: string): boolean {
  const mod = w.modules[moduleId];
  if (!mod) return false;
  const exists = w.tasks.some(
    (t) => t.kind === "demolish" && t.target.moduleId === moduleId,
  );
  if (exists) return false;
  const def = MODULE_DEFS[mod.kind];
  w.tasks.push({
    id: `task_${w.next_task_id++}`,
    kind: "demolish",
    target: { moduleId: mod.id },
    wd_total: def.wd_to_demolish,
    wd_done: 0,
    assigned: [],
    priority: 1,
    status: "pending",
    createdAt: w.tick,
    initialHp: mod.hp, // HP v okamžiku enqueue — určuje recovery scale
  });
  return true;
}

// ID prefix konvence per kind (odpovídá init.ts seed tuples — engine_1, solar_1, …).
// SolarArray má zvláštní prefix „solar" (ne „solararray") — historický konsensus.
const KIND_ID_PREFIX: Record<ModuleKind, string> = {
  SolarArray: "solar",
  Engine: "engine",
  Dock: "dock",
  Habitat: "habitat",
  Storage: "storage",
  MedCore: "medcore",
  Assembler: "assembler",
  CommandPost: "commandpost",
  AsteroidHarvester: "harvester",
};

// Generuj unique moduleId per kind — iteruje "<prefix>_N" dokud nenajde volné.
// Gap-fill: po demolish může být index volný, znovupoužije se.
function generateModuleId(w: World, kind: ModuleKind): string {
  const prefix = KIND_ID_PREFIX[kind];
  let i = 1;
  while (w.modules[`${prefix}_${i}`]) i++;
  return `${prefix}_${i}`;
}

// Enqueue build task — vytvoří modul na zadaných bays (všechny musí být void),
// task typ "build" který progresses HP z 0 na hp_max. Modul instance vzniká
// HNED (status=building, hp=0), aby mohl být cílem dalších tasks a UI ho viděl.
// Completion: status="online", hp=hp_max.
//
// Idempotent — jestli už build task existuje na tyto bays, vrátí false.
// Validace: bays na rect [rootIdx, rootIdx+w×h] musí být všechny void + uvnitř segmentu.
export function enqueueBuildTask(w: World, kind: ModuleKind, rootIdx: number): boolean {
  const def = MODULE_DEFS[kind];
  const rootRow = Math.floor(rootIdx / 8);
  const rootCol = rootIdx % 8;
  // Out of bounds — modul přesahuje segment (2×8).
  if (rootRow + def.h > 2 || rootCol + def.w > 8) return false;
  // Všechny bays v rect musí být void.
  for (let dy = 0; dy < def.h; dy++) {
    for (let dx = 0; dx < def.w; dx++) {
      const idx = (rootRow + dy) * 8 + (rootCol + dx);
      if (w.segment[idx]?.kind !== "void") return false;
    }
  }
  // Idempotent — už existuje živý build task na tomto root?
  const exists = w.tasks.some(
    (t) => t.kind === "build" && t.target.bayIdx === rootIdx &&
      (t.status === "pending" || t.status === "active" || t.status === "paused"),
  );
  if (exists) return false;

  // Vytvoř modul instance s status=building, hp=0.
  const moduleId = generateModuleId(w, kind);
  w.modules[moduleId] = {
    id: moduleId,
    kind,
    rootIdx,
    status: "building",
    hp: 0,
    hp_max: def.max_hp,
    progress_wd: 0,
  };

  // Obsaď bays — root + refs.
  for (let dy = 0; dy < def.h; dy++) {
    for (let dx = 0; dx < def.w; dx++) {
      const idx = (rootRow + dy) * 8 + (rootCol + dx);
      if (dx === 0 && dy === 0) {
        w.segment[idx] = { kind: "module_root", moduleId };
      } else {
        w.segment[idx] = { kind: "module_ref", moduleId, rootOffset: { dx, dy } };
      }
    }
  }

  // Task wd_total = def.wd_to_build (celková práce z 0 na hp_max).
  w.tasks.push({
    id: `task_${w.next_task_id++}`,
    kind: "build",
    target: { moduleId, bayIdx: rootIdx, buildSpec: kind },
    wd_total: def.wd_to_build,
    wd_done: 0,
    assigned: [],
    priority: 1,
    status: "pending",
    createdAt: w.tick,
  });
  return true;
}

export function assignIdleActors(w: World): void {
  for (const actor of w.actors) {
    if (actor.state !== "idle") continue;
    // S24: přiřazuj jen na pending/active tasks (ne paused/completed/failed/eternal).
    const task = w.tasks.find((t) =>
      (t.status === "pending" || t.status === "active") &&
      TASK_DEFS[t.kind].allowed_actors.includes(actor.kind as ActorKind),
    );
    if (!task) continue;
    actor.state = "working";
    actor.taskId = task.id;
    task.assigned.push(actor.id);
    if (task.status === "pending") task.status = "active";
    appendEvent(w, "ASSN", { actor: actor.id, loc: taskLoc(task), item: task.kind, target: task.id, text: actor.id });
  }
}

// Posun progresu tasků + spojitá HP synchronizace vnější vrstvy.
// Hráči spotřebovávají HP prací. Drony spotřebovávají E. Repair čerpá Solids/Fluids
// per-target recipe (S25). Při deficitu kterékoli složky tick skip — next
// protocolTick pauzne task s důvodem „no <subtype>".
export function progressTasks(w: World): void {
  for (const task of w.tasks) {
    // S24: skip paused/completed/failed/eternal/pending bez assignu. Jen active.
    if (task.status !== "active") continue;
    if (task.assigned.length === 0 && w.drones === 0) continue;

    // Hráčský příspěvek — work = výkon ve W.
    let playerPower = 0;
    for (const aid of task.assigned) {
      const a = w.actors.find((x) => x.id === aid);
      if (a && a.state === "working") playerPower += a.work;
    }
    // Dronový příspěvek — 1 dron = 1 W, převodník E→WD, jen pokud je E.
    const dronePower = w.resources.energy > 0 ? w.drones : 0;
    const powerSum = playerPower + dronePower;
    const wd_delta = powerSum / TICKS_PER_GAME_DAY;

    if (task.kind === "repair") {
      const hp_delta = wd_delta / WD_PER_HP;
      const recipe = getTaskRecipe(w, task);
      if (recipe) {
        // Material gate per recipe: jakákoli chybějící složka → skip tick.
        if (whichResourceMissing(w, recipe, hp_delta) !== null) continue;
        consumeResources(w, recipe, hp_delta);
      }
      if (task.target.moduleId !== undefined) {
        const mod = w.modules[task.target.moduleId];
        if (mod) mod.hp = Math.min(mod.hp_max, mod.hp + hp_delta);
      }
    } else if (task.kind === "build") {
      // Build: HP roste z 0 k hp_max; konzumuje recipe jako repair (material gate).
      const hp_delta = wd_delta / WD_PER_HP;
      const recipe = getTaskRecipe(w, task);
      if (recipe) {
        if (whichResourceMissing(w, recipe, hp_delta) !== null) continue;
        consumeResources(w, recipe, hp_delta);
      }
      if (task.target.moduleId !== undefined) {
        const mod = w.modules[task.target.moduleId];
        if (mod) mod.hp = Math.min(mod.hp_max, mod.hp + hp_delta);
      }
    } else if (task.kind === "demolish") {
      // Demolish: HP klesá lineárně z initialHp (HP v okamžiku enqueue) k 0.
      // Žádná material konzumace; recovery se poskytuje při completion.
      // Žádný material gate (rozpojování nepotřebuje přísun).
      if (task.target.moduleId !== undefined) {
        const mod = w.modules[task.target.moduleId];
        if (mod) {
          const initialHp = task.initialHp ?? mod.hp_max;
          const progressRatio = Math.min(1, (task.wd_done + wd_delta) / task.wd_total);
          mod.hp = Math.max(0, initialHp * (1 - progressRatio));
          mod.status = "demolishing";
        }
      }
    }
    task.wd_done += wd_delta;

    if (task.wd_done >= task.wd_total) {
      completeTask(w, task);
      task.status = "completed";
      task.completedAt = w.tick;
      // Uvolni assignees.
      for (const aid of task.assigned) {
        const a = w.actors.find((x) => x.id === aid);
        if (a) { a.state = "idle"; a.taskId = undefined; }
      }
      task.assigned = [];
    }
  }
}

// S24: autoclean starších completed/failed tasks (po TASK_AUTOCLEAN_TICKS ≈ 1 h wall).
// Eternal + active/paused/pending zůstávají.
export function cleanupOldTasks(w: World): void {
  for (let i = w.tasks.length - 1; i >= 0; i--) {
    const task = w.tasks[i]!;
    if (task.status !== "completed" && task.status !== "failed") continue;
    if (task.completedAt === undefined) continue;
    if (w.tick - task.completedAt >= TASK_AUTOCLEAN_TICKS) {
      w.tasks.splice(i, 1);
    }
  }
}

function completeTask(w: World, task: Task): void {
  // Repair: HP se už spojitě synchronizovalo; na konci jen clamp na hp_max.
  if (task.kind === "repair" && task.target.moduleId !== undefined) {
    const mod = w.modules[task.target.moduleId];
    if (mod) mod.hp = mod.hp_max;
  }

  // Build: HP se už spojitě synchronizovalo (0 → hp_max); flip status → online.
  if (task.kind === "build" && task.target.moduleId !== undefined) {
    const mod = w.modules[task.target.moduleId];
    if (mod) {
      mod.hp = mod.hp_max;
      mod.status = "online";
    }
  }

  // Demolish: bay → void (root + všechny refs), modul odstranit z w.modules,
  // recovery zdrojů do skladu.
  // Vzorec: recovery = (initialHp / hp_max) × recipe × DEMOLISH_RECOVERY_RATIO.
  // Poškozený modul má míň materiálu k rozpojení (asteroid mezi tím = materiál
  // fly off do vesmíru, do recovery se nepočítá).
  if (task.kind === "demolish" && task.target.moduleId !== undefined) {
    const mod = w.modules[task.target.moduleId];
    if (mod) {
      const def = MODULE_DEFS[mod.kind];
      const initialHp = task.initialHp ?? mod.hp_max;
      const recoveryScale = (initialHp / mod.hp_max) * DEMOLISH_RECOVERY_RATIO;
      returnResources(w, def.recipe, recoveryScale);
      // Clear bays — najdi všechny bays s odkazem na tento modul a sleep → void.
      for (let i = 0; i < w.segment.length; i++) {
        const bay = w.segment[i];
        if (!bay) continue;
        if (bay.kind === "module_root" && bay.moduleId === mod.id) {
          w.segment[i] = { kind: "void" };
        } else if (bay.kind === "module_ref" && bay.moduleId === mod.id) {
          w.segment[i] = { kind: "void" };
        }
      }
      delete w.modules[mod.id];
    }
  }

  appendEvent(w, "CMPL", { csq: "OK", loc: taskLoc(task), item: task.kind, text: taskActionCs(task) });

  for (const aid of task.assigned) {
    const a = w.actors.find((x) => x.id === aid);
    if (a) {
      a.state = "idle";
      a.taskId = undefined;
    }
  }
}
