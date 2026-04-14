// World engine — layered bay axiom (S18).
// Čistá funkční logika: `createInitialWorld`, `stepWorld`, FSM přechody.
// Žádný Phaser import — testovatelné samostatně.

import type { World, Bay, Phase, LossReason, Actor, Task, ActorKind, Module, ModuleKind, CoverVariant } from "./model";
import { ACTOR_DEFS, TASK_DEFS, MODULE_DEFS } from "./model";
import {
  TICK_MS,
  TICKS_PER_SECOND,
  TICKS_PER_GAME_DAY,
  TICKS_PER_WALL_MINUTE,
  AIR_TIMEOUT_TICKS,
  AIR_DRAIN_PER_TICK,
  FOOD_DRAIN_PER_TICK,
  SEED_FOOD,
  SEED_AIR,
  SEED_COIN,
  SKELETON_HP_MAX,
  COVERED_HP_MAX,
  WD_PER_HP,
  WEAR_MIN,
  WEAR_MAX,
  START_DAMAGES_COUNT,
  CRITICAL_RANGE,
  MEDIUM_RANGE,
  MINOR_RANGE,
  ENERGY_SEED,
  ENERGY_MAX,
} from "./tuning";

// Re-export tuning konstant — drží stabilní API pro stávající konzumenty
// (GameScene, header, testy). Logiku vlastní `tuning.ts`, tady jen průchod.
export {
  TICK_MS,
  TICKS_PER_SECOND,
  TICKS_PER_GAME_DAY,
  TICKS_PER_WALL_MINUTE,
  AIR_TIMEOUT_TICKS,
  AIR_DRAIN_PER_TICK,
  FOOD_DRAIN_PER_TICK,
  SKELETON_HP_MAX,
  COVERED_HP_MAX,
  WD_PER_HP,
  ENERGY_SEED,
  ENERGY_MAX,
};

export function formatGameTime(tick: number): string {
  const gameMin = Math.floor(tick / TICKS_PER_WALL_MINUTE);
  const day = Math.floor(gameMin / (16 * 60));
  const minInDay = gameMin % (16 * 60);
  const hh = String(Math.floor(minInDay / 60)).padStart(2, "0");
  const mm = String(minInDay % 60).padStart(2, "0");
  return `T:${day}.${hh}:${mm}`;
}

// === Random helpers (lokální — Math.random, deterministic seed P2+) ===

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  // inkluzivní min i max
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randCoverVariant(): CoverVariant {
  return randInt(1, 5) as CoverVariant;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

// === Factory ===

// Iniciální svět — mateřská loď s náhodným layoutem.
// Axiom S18: Engine 2×2 (pevná pozice) + 12 skeletonů, pak random:
//   - 6 skeletonů → module (Hab/Sol/Med/Ass/CP/Sto)
//   - 2–3 skeletonů → covered (vzduchotěsné, připraveno pro budoucí stavbu)
//   - zbytek (3–4) zůstává skeleton
// Každá komponenta má random HP v rozsahu 85–100 % hp_max. Následně 3 náhodné
// komponenty dostanou poškození (critical / medium / minor).
export function createInitialWorld(): World {
  // 1) 16× skeleton na plné HP.
  const segment: Bay[] = Array.from({ length: 16 }, () => ({
    kind: "skeleton",
    hp: SKELETON_HP_MAX,
    hp_max: SKELETON_HP_MAX,
  }));

  const modules: Record<string, Module> = {};

  // Helper: vytvoří modul instance + obsadí bay(y) v segmentu.
  // Root bay = module_root, ostatní bays = module_ref. Každý bay dostane
  // náhodnou cover variantu (pamatuje si cover pod modulem pro demolish reveal).
  const placeModule = (id: string, kind: ModuleKind, rootIdx: number) => {
    const def = MODULE_DEFS[kind];
    modules[id] = {
      id,
      kind,
      rootIdx,
      status: "offline",
      hp: def.max_hp,
      hp_max: def.max_hp,
      progress_wd: 0,
    };
    const rootRow = Math.floor(rootIdx / 8);
    const rootCol = rootIdx % 8;
    for (let dy = 0; dy < def.h; dy++) {
      for (let dx = 0; dx < def.w; dx++) {
        const idx = (rootRow + dy) * 8 + (rootCol + dx);
        const coverVariant = randCoverVariant();
        if (dx === 0 && dy === 0) {
          segment[idx] = { kind: "module_root", moduleId: id, coverVariant };
        } else {
          segment[idx] = { kind: "module_ref", moduleId: id, rootOffset: { dx, dy }, coverVariant };
        }
      }
    }
  };

  // 2) Engine 2×2 na fixní pozici — kotevní bod (idx 6 → obsadí 6,7,14,15).
  placeModule("engine_1", "Engine", 6);

  // 3) Volné bay indexy (12 skeletonů): všechny kromě Engine bays.
  const ENGINE_IDXS = new Set([6, 7, 14, 15]);
  const freeIdxs: number[] = [];
  for (let i = 0; i < 16; i++) if (!ENGINE_IDXS.has(i)) freeIdxs.push(i);
  shuffleInPlace(freeIdxs);

  // 4) Prvních 6 free bays → moduly (random pořadí z free bays × fixní pořadí modulů).
  const START_MODULES: Array<[string, ModuleKind]> = [
    ["habitat_1", "Habitat"],
    ["solar_1", "SolarArray"],
    ["medcore_1", "MedCore"],
    ["assembler_1", "Assembler"],
    ["commandpost_1", "CommandPost"],
    ["storage_1", "Storage"],
  ];
  for (let i = 0; i < START_MODULES.length; i++) {
    const [id, kind] = START_MODULES[i]!;
    placeModule(id, kind, freeIdxs[i]!);
  }

  // 5) 2–3 covered bays (random count) z dalších free idxs.
  const coveredCount = randInt(2, 3);
  for (let i = 0; i < coveredCount; i++) {
    const idx = freeIdxs[START_MODULES.length + i];
    if (idx === undefined) break;
    segment[idx] = {
      kind: "covered",
      hp: COVERED_HP_MAX,
      hp_max: COVERED_HP_MAX,
      variant: randCoverVariant(),
    };
  }
  // Zbytek (START_MODULES.length + coveredCount .. end) zůstává skeleton.

  // 6) Lehké opotřebení — všechny komponenty random 85–100 % hp_max.
  applyLightWear(segment, modules);

  // 7) Tři random poškození — critical / medium / minor na tři různé komponenty.
  applyRandomDamages(segment, modules);

  const actors: Actor[] = [
    { id: "player", kind: "player", state: "idle" },
    { id: "c1", kind: "constructor", state: "idle" },
    { id: "c2", kind: "constructor", state: "idle" },
    { id: "c3", kind: "constructor", state: "idle" },
    { id: "h1", kind: "hauler", state: "idle" },
    { id: "h2", kind: "hauler", state: "idle" },
  ];

  return {
    tick: 0,
    phase: "boot",
    resources: {
      energy: ENERGY_SEED,
      slab: { food: SEED_FOOD },
      flux: { air: SEED_AIR },
      coin: SEED_COIN,
    },
    segment,
    modules,
    actors,
    tasks: [],
    next_task_id: 1,
  };
}

// Aplikuje random wear na všechny komponenty s HP.
function applyLightWear(segment: Bay[], modules: Record<string, Module>): void {
  for (const bay of segment) {
    if (bay.kind === "skeleton" || bay.kind === "covered") {
      bay.hp = Math.round(bay.hp_max * randFloat(WEAR_MIN, WEAR_MAX));
    }
  }
  for (const mod of Object.values(modules)) {
    mod.hp = Math.round(mod.hp_max * randFloat(WEAR_MIN, WEAR_MAX));
  }
}

// Seznam "damageable" komponent = outer layer bearing HP.
// Bay: skeleton / covered / module_root (pro root vracíme odkaz na module).
// module_ref neřešíme samostatně — HP modulu se přiřadí přes root.
type DamageTarget =
  | { kind: "bay"; bayIdx: number }
  | { kind: "module"; moduleId: string };

function collectDamageTargets(segment: Bay[]): DamageTarget[] {
  const targets: DamageTarget[] = [];
  const seenModules = new Set<string>();
  for (let i = 0; i < segment.length; i++) {
    const t = segment[i]!;
    if (t.kind === "skeleton" || t.kind === "covered") {
      targets.push({ kind: "bay", bayIdx: i });
    } else if (t.kind === "module_root") {
      if (!seenModules.has(t.moduleId)) {
        seenModules.add(t.moduleId);
        targets.push({ kind: "module", moduleId: t.moduleId });
      }
    }
  }
  return targets;
}

// Vybere 3 náhodné různé komponenty a aplikuje critical/medium/minor poškození.
function applyRandomDamages(segment: Bay[], modules: Record<string, Module>): void {
  const pool = collectDamageTargets(segment);
  shuffleInPlace(pool);
  const picks = pool.slice(0, START_DAMAGES_COUNT);
  // Rozsahy musí mít délku = START_DAMAGES_COUNT (viz tuning.ts §4 komentář).
  const ranges: ReadonlyArray<readonly [number, number]> = [CRITICAL_RANGE, MEDIUM_RANGE, MINOR_RANGE];
  for (let i = 0; i < picks.length; i++) {
    const t = picks[i]!;
    const [lo, hi] = ranges[i]!;
    const pct = randFloat(lo, hi);
    if (t.kind === "bay") {
      const bay = segment[t.bayIdx]!;
      if (bay.kind === "skeleton" || bay.kind === "covered") {
        bay.hp = Math.round(bay.hp_max * pct);
      }
    } else {
      const mod = modules[t.moduleId]!;
      mod.hp = Math.round(mod.hp_max * pct);
    }
  }
}

// === Outer-layer HP helpers — čte HP vnější vrstvy nad indexem ===

export type OuterHP = { hp: number; hp_max: number; label: string } | null;

// Vrátí HP vnější vrstvy pro daný bay. module_ref deleguje na root module.
export function getOuterHP(w: World, bayIdx: number): OuterHP {
  const bay = w.segment[bayIdx];
  if (!bay) return null;
  if (bay.kind === "void") return null;
  if (bay.kind === "skeleton") return { hp: bay.hp, hp_max: bay.hp_max, label: "skeleton" };
  if (bay.kind === "covered") return { hp: bay.hp, hp_max: bay.hp_max, label: `cover${bay.variant}` };
  // module_root / module_ref → HP modulu
  const mod = w.modules[bay.moduleId];
  if (!mod) return null;
  return { hp: mod.hp, hp_max: mod.hp_max, label: mod.kind };
}

// === Task engine ===

// Enqueue repair task na daný bay. Cíl = vnější vrstva (skeleton / covered / modul).
// Idempotent — pokud už task existuje na stejný target, vrátí false.
// Pro module_ref se normalizuje na root (task target = moduleId, ne bay).
export function enqueueRepairTask(w: World, bayIdx: number): boolean {
  const bay = w.segment[bayIdx];
  if (!bay) return false;
  if (bay.kind === "void") return false;

  // Normalizace: module_root i module_ref → target = module (moduleId).
  if (bay.kind === "module_root" || bay.kind === "module_ref") {
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
    });
    return true;
  }

  // skeleton / covered → target = bay idx.
  if (bay.hp >= bay.hp_max) return false;
  const exists = w.tasks.some(
    (t) => t.kind === "repair" && t.target.bayIdx === bayIdx,
  );
  if (exists) return false;
  const wd_total = (bay.hp_max - bay.hp) * WD_PER_HP;
  w.tasks.push({
    id: `task_${w.next_task_id++}`,
    kind: "repair",
    target: { bayIdx },
    wd_total,
    wd_done: 0,
    assigned: [],
    priority: 1,
  });
  return true;
}

function assignIdleActors(w: World): void {
  for (const actor of w.actors) {
    if (actor.state !== "idle") continue;
    const task = w.tasks.find((t) =>
      TASK_DEFS[t.kind].allowed_actors.includes(actor.kind as ActorKind),
    );
    if (!task) continue;
    actor.state = "working";
    actor.taskId = task.id;
    task.assigned.push(actor.id);
  }
}

// Posun progresu tasků + spojitá HP synchronizace vnější vrstvy.
function progressTasks(w: World): void {
  for (let i = w.tasks.length - 1; i >= 0; i--) {
    const task = w.tasks[i]!;
    if (task.assigned.length === 0) continue;

    let powerSum = 0;
    for (const aid of task.assigned) {
      const a = w.actors.find((x) => x.id === aid);
      if (a && a.state === "working") powerSum += ACTOR_DEFS[a.kind].power_w;
    }
    const wd_delta = powerSum / TICKS_PER_GAME_DAY;
    task.wd_done += wd_delta;

    if (task.kind === "repair") {
      const hp_delta = wd_delta / WD_PER_HP;
      if (task.target.bayIdx !== undefined) {
        const bay = w.segment[task.target.bayIdx];
        if (bay && (bay.kind === "skeleton" || bay.kind === "covered")) {
          bay.hp = Math.min(bay.hp_max, bay.hp + hp_delta);
        }
      } else if (task.target.moduleId !== undefined) {
        const mod = w.modules[task.target.moduleId];
        if (mod) mod.hp = Math.min(mod.hp_max, mod.hp + hp_delta);
      }
    }

    if (task.wd_done >= task.wd_total) {
      completeTask(w, task);
      w.tasks.splice(i, 1);
    }
  }
}

function completeTask(w: World, task: Task): void {
  // Repair: HP se už spojitě synchronizovalo; na konci jen clamp na hp_max.
  if (task.kind === "repair") {
    if (task.target.bayIdx !== undefined) {
      const bay = w.segment[task.target.bayIdx];
      if (bay && (bay.kind === "skeleton" || bay.kind === "covered")) {
        bay.hp = bay.hp_max;
      }
    } else if (task.target.moduleId !== undefined) {
      const mod = w.modules[task.target.moduleId];
      if (mod) mod.hp = mod.hp_max;
    }
  }
  for (const aid of task.assigned) {
    const a = w.actors.find((x) => x.id === aid);
    if (a) {
      a.state = "idle";
      a.taskId = undefined;
    }
  }
}

// === FSM přechody ===

// boot → phase_a. Damages jsou už v segmentu z createInitialWorld.
export function startGame(w: World): void {
  if (w.phase !== "boot") return;
  w.resources.flux.air = 100;
  w.phase = "phase_a";
}

// phase_a → phase_b (debug/manual přechod, build UX přijde později).
export function repairDone(w: World): void {
  if (w.phase !== "phase_a") return;
  w.phase = "phase_b";
}

export function dockComplete(w: World): void {
  if (w.phase !== "phase_b") return;
  w.phase = "phase_c";
}

export function endDay(w: World): void {
  if (w.phase !== "phase_c") return;
  w.phase = "win";
}

function toLoss(w: World, reason: LossReason): void {
  w.phase = "loss";
  w.loss_reason = reason;
  for (const a of w.actors) if (a.state === "working") a.state = "idle";
}

// === Tick step ===

export function stepWorld(w: World): void {
  if (w.phase === "win" || w.phase === "loss" || w.phase === "boot") return;

  w.tick += 1;

  assignIdleActors(w);
  progressTasks(w);

  if (w.phase === "phase_a") {
    w.resources.flux.air = Math.max(0, w.resources.flux.air - AIR_DRAIN_PER_TICK);
    if (w.resources.flux.air <= 0) {
      toLoss(w, "air");
      return;
    }
  }

  if (w.phase === "phase_b" || w.phase === "phase_c") {
    w.resources.slab.food = Math.max(0, w.resources.slab.food - FOOD_DRAIN_PER_TICK);
    if (w.resources.slab.food <= 0) {
      toLoss(w, "food");
      return;
    }
  }
}

// === Derived: Work (W) ===

export function computeWork(w: World): { current: number; max: number } {
  let current = 0;
  let max = 0;
  for (const a of w.actors) {
    const pw = ACTOR_DEFS[a.kind].power_w;
    max += pw;
    if (a.state === "working") current += pw;
  }
  return { current, max };
}

export function phaseLabel(phase: Phase): string {
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

// === Task trajectory helpers — pro render (orange/green/red overlay) ===

export type Trajectory = "rising" | "falling" | "static";

// Zjistí trajektorii HP vnější vrstvy daného bay na základě aktivních tasků.
//   repair task s assigned actors → rising (HP roste)
//   demolish task s assigned actors → falling (HP klesá)
//   jinak → static
export function getBayTrajectory(w: World, bayIdx: number): Trajectory {
  const bay = w.segment[bayIdx];
  if (!bay || bay.kind === "void") return "static";

  // Normalizace: module_root/ref → hledáme task na moduleId.
  const moduleId =
    bay.kind === "module_root" || bay.kind === "module_ref" ? bay.moduleId : undefined;

  for (const task of w.tasks) {
    if (task.assigned.length === 0) continue;
    const hitsBay =
      moduleId === undefined && task.target.bayIdx === bayIdx;
    const hitsModule =
      moduleId !== undefined && task.target.moduleId === moduleId;
    if (!hitsBay && !hitsModule) continue;
    if (task.kind === "repair" || task.kind === "build") return "rising";
    if (task.kind === "demolish") return "falling";
  }
  return "static";
}
