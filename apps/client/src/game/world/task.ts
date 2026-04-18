// Task engine — enqueue, assign, progress, cleanup, complete.

import type { World, Task, ActorKind } from "../model";
import { TASK_DEFS } from "../model";
import { TICKS_PER_GAME_DAY, WD_PER_HP, TASK_AUTOCLEAN_TICKS } from "../tuning";
import { appendEvent } from "../events";
import { getTaskRecipe, whichResourceMissing, consumeResources } from "./recipe";
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

  appendEvent(w, "CMPL", { csq: "OK", loc: taskLoc(task), item: task.kind, text: taskActionCs(task) });

  for (const aid of task.assigned) {
    const a = w.actors.find((x) => x.id === aid);
    if (a) {
      a.state = "idle";
      a.taskId = undefined;
    }
  }
}
