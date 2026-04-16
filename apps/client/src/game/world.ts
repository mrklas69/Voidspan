// World engine — layered bay axiom (S18).
// Čistá funkční logika: `createInitialWorld`, `stepWorld`, FSM přechody.
// Žádný Phaser import — testovatelné samostatně.

import type { World, Bay, Actor, Task, ActorKind, Module, ModuleKind, CoverVariant, StatusLevel, StatusNode } from "./model";
import { TASK_DEFS, MODULE_DEFS, STATUS_LABELS, statusRating } from "./model";
import { appendEvent } from "./events";
import {
  TICK_MS,
  TICKS_PER_SECOND,
  TICKS_PER_GAME_DAY,
  TICKS_PER_WALL_MINUTE,
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
  DECAY_RATE_PER_GAME_DAY,
  ACTOR_HP_MAX,
  ACTOR_HP_DRAIN_PER_TICK,
  THRESHOLD_CRIT_PCT,
  THRESHOLD_WARN_PCT,
  PROTOCOL_VERSION,
  PROTOCOL_RESUME_RATING,
  PROTOCOL_PAUSE_RATING,
  TASK_AUTOCLEAN_TICKS,
} from "./tuning";

// Re-export tuning konstant — drží stabilní API pro stávající konzumenty
// (GameScene, header, testy). Logiku vlastní `tuning.ts`, tady jen průchod.
export {
  TICK_MS,
  TICKS_PER_SECOND,
  TICKS_PER_GAME_DAY,
  TICKS_PER_WALL_MINUTE,
  SKELETON_HP_MAX,
  COVERED_HP_MAX,
  WD_PER_HP,
  ENERGY_SEED,
};

export function formatGameTime(tick: number): string {
  const gameMin = Math.floor(tick / TICKS_PER_WALL_MINUTE);
  const day = Math.floor(gameMin / (16 * 60));
  const minInDay = gameMin % (16 * 60);
  const hh = String(Math.floor(minInDay / 60)).padStart(2, "0");
  const mm = String(minInDay % 60).padStart(2, "0");
  return `T:${day}.${hh}:${mm}`;
}

// S24: ETA formát "12d14h12m" — herní dny/hodiny/minuty.
// 1 game minute = 1 wall minute (TIME_COMPRESSION 1×); 1 tick = TICKS_PER_WALL_MINUTE / 60 wall min.
// Přeloženo: 1 tick = 1/TICKS_PER_WALL_MINUTE wall min = 1/TICKS_PER_WALL_MINUTE game min.
export function formatEta(ticks: number): string {
  if (!Number.isFinite(ticks) || ticks <= 0) return "—";
  const gameMin = Math.floor(ticks / TICKS_PER_WALL_MINUTE);
  const days = Math.floor(gameMin / (16 * 60));
  const remMin = gameMin - days * 16 * 60;
  const hours = Math.floor(remMin / 60);
  const mins = remMin % 60;
  if (days > 0) return `${days}d${hours}h${mins}m`;
  if (hours > 0) return `${hours}h${mins}m`;
  return `${mins}m`;
}

// S24: ETA ticků pro task (zbývající WD / current power). ∞ (Infinity) když paused/no power.
export function taskEtaTicks(w: World, task: Task): number {
  if (task.status !== "active") return Infinity;
  let playerPower = 0;
  for (const aid of task.assigned) {
    const a = w.actors.find((x) => x.id === aid);
    if (a && a.state === "working") playerPower += a.work;
  }
  const dronePower = w.resources.energy > 0 ? w.drones : 0;
  const powerSum = playerPower + dronePower;
  if (powerSum <= 0) return Infinity;
  const remainingWd = Math.max(0, task.wd_total - task.wd_done);
  return (remainingWd * TICKS_PER_GAME_DAY) / powerSum;
}

// S24: lidský popis task targetu pro UI řádek.
// „SolarArray (m_solar_1)" / „Bay [1,3]" / „QuarterMaster v2.3 — Active" (eternal).
export function describeTaskTarget(w: World, task: Task): string {
  if (task.label) return task.label;
  if (task.kind === "service") return `Service ${task.id}`;
  if (task.target.moduleId !== undefined) {
    const mod = w.modules[task.target.moduleId];
    return mod ? `${mod.kind} (${mod.id})` : `Module ${task.target.moduleId}`;
  }
  if (task.target.bayIdx !== undefined) {
    const row = Math.floor(task.target.bayIdx / 8);
    const col = task.target.bayIdx % 8;
    return `Bay [${row},${col}]`;
  }
  if (task.target.buildSpec) return `Build ${task.target.buildSpec}`;
  return task.id;
}

// S24: český infinitiv slovesa pro task kind — do event textu.
const TASK_VERB_CS: Record<string, string> = {
  repair: "Opravit",
  demolish: "Demolovat",
  build: "Postavit",
  service: "Sledovat",
};
function taskActionCs(task: Task): string {
  return TASK_VERB_CS[task.kind] ?? task.kind;
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
    { id: "player", kind: "player", state: "cryo", hp: ACTOR_HP_MAX, hp_max: ACTOR_HP_MAX, work: 8 },
  ];

  const world: World = {
    tick: 0,
    phase: "running",
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
    protocolVersion: PROTOCOL_VERSION,
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
      status: "pending",
      createdAt: w.tick,
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
    status: "pending",
    createdAt: w.tick,
  });
  return true;
}

function assignIdleActors(w: World): void {
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
    appendEvent(w, "ASSN", { actor: actor.id, item: task.kind, target: task.id, text: `${actor.id} přiřazen k ${task.kind} (${task.id})` });
  }
}

// Posun progresu tasků + spojitá HP synchronizace vnější vrstvy.
// Hráči spotřebovávají HP prací. Drony spotřebovávají E.
function progressTasks(w: World): void {
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
function cleanupOldTasks(w: World): void {
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

  const loc = task.target.moduleId ?? (task.target.bayIdx !== undefined ? `bay${task.target.bayIdx}` : undefined);
  appendEvent(w, "CMPL", { csq: "OK", loc, item: task.kind, text: `${task.kind} ${task.id} dokončen` });

  for (const aid of task.assigned) {
    const a = w.actors.find((x) => x.id === aid);
    if (a) {
      a.state = "idle";
      a.taskId = undefined;
    }
  }
}


// === Simulation loop — Perpetual Observer Simulation axiom (kandidát, IDEAS S20) ===
//
// Axiom: svět žije nepřetržitě. Simulace nekončí WIN/LOSS, končí jen vypnutím serveru.
// Observer perspektiva = bez GAME_OVER. Player perspektiva (P2+) má GAME_OVER per hráč.
//
// Pipeline sloty (některé dnes no-op, dolaďují se iterativně — viz TODO
// „Perpetual Observer — full implementation"). Axiom-level pořadí je kánon,
// i když těla funkcí budou prázdná do implementace jednotlivých kusů:
//
//   1) decayTick           — entropie snižuje HP nerepaired vrstev (per game-day)
//   2) resourceDrain       — spotřeba per-capita (TODO: n_alive × per_actor_rate)
//   3) autoEnqueueTasks    — priority queue (critical HP → repair, chybějící zásoba → produce)
//   4) assignIdleActors    — volné drony → task dle allowed_actors + priority
//   5) progressTasks       — WD delta, HP/resource sync, completion
//   6) actorLifeTick       — HP drain aktérů při nedostatku; HP=0 → state="dead" (ne LOSS!)
//   7) productionTick      — SolarArray → E, Greenhouse → food, MedCore → heal
//   8) arrivalsTick        — kapsle na orbitu, Network Arc signály
//   9) scheduledEvents     — scripted events bank (SCENARIO §5)
//  10) recomputeStatus     — agregace Status tree (I–IV) pro Observer UI
//  11) appendEventLog      — telemetrie (deaths, births, arrivals, milestones)
//
// win/loss retirováno (S21). Phase scénář retirován (S23).

export function stepWorld(w: World): void {
  w.tick += 1;

  decayTick(w);           // slot 1
  resourceDrain(w);       // slot 2 — TODO: per-capita drain
  protocolTick(w);        // slot 3a (S24) — QuarterMaster: gate + enqueue repairs
  autoEnqueueTasks(w);    // slot 3 — no-op; dnes řeší protocolTick
  assignIdleActors(w);    // slot 4
  progressTasks(w);       // slot 5
  cleanupOldTasks(w);     // slot 5b (S24) — autoclean completed/failed po TASK_AUTOCLEAN_TICKS
  actorLifeTick(w);       // slot 6 — no-op do implementace actor HP
  productionTick(w);      // slot 7 — no-op
  arrivalsTick(w);        // slot 8 — no-op
  scheduledEvents(w);     // slot 9 — no-op
  recomputeStatus(w);     // slot 10 — no-op
  appendEventLog(w);      // slot 11 — no-op
}

// === Pipeline sloty (stuby + legacy wrap) ===

// Slot 2 — per-capita resource drain (TODO: n_alive × per_actor_rate).
// Zatím no-op — retirovaná phase_a/b/c mechanika odstraněna v S23.
function resourceDrain(_w: World): void { /* TODO: per-capita drain */ }

// Sloty 1, 3, 6–11 — no-op stuby. Pořadí a podpis zafixované axiomem, těla
// postupně naplníme. Podpis `(w: World): void` drží uniformitu pipeline.
// Slot 1 — entropie. Všechny vrstvy ztrácejí HP konstantním dripem.
// Rate = DECAY_RATE_PER_GAME_DAY * hp_max / TICKS_PER_GAME_DAY per tick.
// Modul s HP=0 přechází na offline. DECY event při přechodu na offline.
function decayTick(w: World): void {
  // Bay vrstvy (skeleton, covered).
  for (const bay of w.segment) {
    if (bay.kind === "skeleton" || bay.kind === "covered") {
      const drain = (bay.hp_max * DECAY_RATE_PER_GAME_DAY) / TICKS_PER_GAME_DAY;
      bay.hp = Math.max(0, bay.hp - drain);
    }
  }
  // Moduly.
  for (const mod of Object.values(w.modules)) {
    if (mod.hp <= 0) continue;
    const drain = (mod.hp_max * DECAY_RATE_PER_GAME_DAY) / TICKS_PER_GAME_DAY;
    mod.hp = Math.max(0, mod.hp - drain);
    if (mod.hp <= 0 && mod.status === "online") {
      mod.status = "offline";
      appendEvent(w, "DECY", { csq: "CRIT", loc: mod.id, item: mod.kind, text: `${mod.kind} zničen rozpadem` });
    }
  }
}
function autoEnqueueTasks(_w: World): void { /* TODO: priority-based task enqueue — dnes řeší protocolTick */ }

// === QuarterMaster runtime (S24, GLOSSARY §Protocol) =======================
//
// Jednoduchý autopilot kolonie. Runtime Protokolu, verze PROTOCOL_VERSION.
//
// Gate logic (S24 Censure fix):
//   Protocol používá **kapacitní** check (ne semaforový W rating), aby se zabránilo
//   flappingu. W rating semaforu teď reflektuje availability (0/23 = červená), ale
//   ta by způsobila cyklus: active → 0 avail → pause → 100 avail → resume → …
//   Místo toho Protocol kontroluje: je E dostupná + máme fyzicky kdo pracovat?
//   1) Gate ready: E rating ≥ RESUME && (drony online nebo alive aktéři)
//   2) Gate paused: E rating ≤ PAUSE || nic nemůže pracovat
//   3) Hystereze drží hranice pause ≤ 2 vs. resume ≥ 3.

function protocolTick(w: World): void {
  const energyPct = w.energyMax > 0 ? (w.resources.energy / w.energyMax) * 100 : 0;
  const eRating = statusRating(energyPct);

  // Kapacitní check: je kdo pracovat?
  const droneCapable = w.drones > 0 && w.resources.energy > 0;
  const actorCapable = w.actors.some(
    (a) => a.state !== "dead" && a.state !== "cryo" && a.hp > 0,
  );
  const hasWorkers = droneCapable || actorCapable;

  const gated = eRating <= PROTOCOL_PAUSE_RATING || !hasWorkers;
  const ready = eRating >= PROTOCOL_RESUME_RATING && hasWorkers;

  const reason = eRating <= PROTOCOL_PAUSE_RATING ? "low Energy" : "no workers";

  if (gated) {
    // Pause všechny active/pending repair tasks. Emit TASK:PAUSE.
    for (const t of w.tasks) {
      if (t.kind !== "repair") continue;
      if (t.status === "active" || t.status === "pending") {
        t.status = "paused";
        for (const aid of t.assigned) {
          const a = w.actors.find((x) => x.id === aid);
          if (a) { a.state = "idle"; a.taskId = undefined; }
        }
        t.assigned = [];
        appendEvent(w, "TASK", {
          csq: "PAUSE",
          target: t.id,
          item: t.kind,
          text: `Pozastaveno: ${taskActionCs(t)} ${describeTaskTarget(w, t)} — ${reason}`,
        });
      }
    }
  } else if (ready) {
    // Resume/activate: paused i pending repair → active. Drony automaticky progresují.
    for (const t of w.tasks) {
      if (t.kind !== "repair") continue;
      if (t.status === "paused") {
        t.status = "active";
        appendEvent(w, "TASK", {
          csq: "RESUME",
          target: t.id,
          item: t.kind,
          text: `Obnoveno: ${taskActionCs(t)} ${describeTaskTarget(w, t)}`,
        });
      } else if (t.status === "pending") {
        t.status = "active";
        appendEvent(w, "TASK", {
          csq: "START",
          target: t.id,
          item: t.kind,
          text: `Zahájeno: ${taskActionCs(t)} ${describeTaskTarget(w, t)}`,
        });
      }
    }
    // Enqueue repair pro min-HP-ratio target, pokud žádný active nečeká.
    const hasActiveRepair = w.tasks.some(
      (t) => t.kind === "repair" && t.status === "active",
    );
    if (!hasActiveRepair) {
      const target = findMinHpRatioTarget(w);
      if (target !== null) {
        if (enqueueRepairTask(w, target)) {
          // Nový task byl pending — rovnou aktivuj.
          const last = w.tasks[w.tasks.length - 1];
          if (last && last.kind === "repair") {
            last.status = "active";
            appendEvent(w, "TASK", {
              csq: "START",
              target: last.id,
              item: last.kind,
              text: `Zahájeno: ${taskActionCs(last)} ${describeTaskTarget(w, last)}`,
            });
          }
        }
      }
    }
  }

  // Update eternal monitor task label.
  const monitor = w.tasks.find((t) => t.kind === "service" && t.status === "eternal");
  if (monitor) {
    let state: string;
    if (gated) state = eRating <= PROTOCOL_PAUSE_RATING ? "Paused — low Energy" : "Paused — no workers";
    else if (ready) {
      const hasActive = w.tasks.some((t) => t.kind === "repair" && t.status === "active");
      state = hasActive ? "Active" : "Idle — nothing to repair";
    } else state = "Standby"; // rating mezi PAUSE a RESUME (hystereze)
    monitor.label = `QuarterMaster ${w.protocolVersion} — ${state}`;
  }
}

// Najdi bay / modul s nejnižším HP ratio (HP/HP_MAX). null = vše na max.
// Vrací bayIdx (pro enqueueRepairTask, který si sám odvodí typ targetu).
function findMinHpRatioTarget(w: World): number | null {
  let bestIdx: number | null = null;
  let bestRatio = 1.0;

  // Bays (skeleton/covered) — vnější vrstva s HP.
  for (let i = 0; i < w.segment.length; i++) {
    const bay = w.segment[i];
    if (!bay) continue;
    let ratio = 1.0;
    if (bay.kind === "skeleton" || bay.kind === "covered") {
      if (bay.hp < bay.hp_max) ratio = bay.hp / bay.hp_max;
    } else if (bay.kind === "module_root") {
      const mod = w.modules[bay.moduleId];
      if (mod && mod.hp < mod.hp_max) ratio = mod.hp / mod.hp_max;
    } else {
      continue; // void, module_ref (skryté)
    }
    if (ratio < bestRatio) {
      bestRatio = ratio;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function actorLifeTick(w: World): void {
  const airZero = w.resources.flux.air <= 0;
  const foodZero = w.resources.slab.food <= 0;
  if (!airZero && !foodZero) return;

  for (const a of w.actors) {
    if (a.state === "cryo" || a.state === "dead") continue;
    a.hp = Math.max(0, a.hp - ACTOR_HP_DRAIN_PER_TICK);
    if (a.hp <= 0) {
      a.state = "dead";
      if (a.taskId) {
        const task = w.tasks.find((t) => t.id === a.taskId);
        if (task) task.assigned = task.assigned.filter((id) => id !== a.id);
        a.taskId = undefined;
      }
      appendEvent(w, "DEAD", { actor: a.id, text: `${a.id} zemřel — ${airZero ? "udušení" : "hlad"}` });
    }
  }
}
// Dynamická kapacita baterie — Σ capacity_wh online modulů.
// Exportováno pro UI (header, info_panel).
// HP ratio axiom: kapacita × HP/HP_MAX (poškozená baterie drží míň).
export function computeEnergyMax(w: World): number {
  let cap = 0;
  for (const mod of Object.values(w.modules)) {
    if (mod.status !== "online") continue;
    const hpRatio = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
    cap += (MODULE_DEFS[mod.kind].capacity_wh ?? 0) * hpRatio;
  }
  return Math.round(cap);
}

// Slot 7 — energy bilance per tick.
// Online moduly: power_w > 0 = produkce, power_w < 0 = spotřeba.
// Axiom: výkon je násoben koeficientem HP/HP_MAX (100% jen bezvadný modul).
// Energie se akumuluje do w.resources.energy, clamp [0, energyMax].
// Při dosažení 0 se emituje DRN:CRIT jednorázově.
function productionTick(w: World): void {
  // Přepočítej kapacitu (modul může jít offline decay → kapacita klesne).
  w.energyMax = computeEnergyMax(w);

  let netPower = 0;
  for (const mod of Object.values(w.modules)) {
    if (mod.status !== "online") continue;
    const hpRatio = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
    netPower += MODULE_DEFS[mod.kind].power_w * hpRatio;
  }
  // W → Wh per tick: energy_delta = netPower / ticks_per_game_hour.
  // 1 game hour = TICKS_PER_GAME_DAY / 16 ticků.
  const ticksPerHour = TICKS_PER_GAME_DAY / 16;
  const delta = netPower / ticksPerHour;
  const before = w.resources.energy;
  w.resources.energy = Math.max(0, Math.min(w.energyMax, w.resources.energy + delta));
  if (before > 0 && w.resources.energy <= 0) {
    appendEvent(w, "DRN", { csq: "CRIT", item: "energy", text: "Energie vyčerpána" });
  }
}
function arrivalsTick(_w: World): void { /* TODO: kapsle / Network Arc signály */ }
function scheduledEvents(_w: World): void { /* TODO: events bank trigger */ }
// Slot 10 — Pyramida vitality (Maslow axiom S20, S21).
//   I.  Aktuální stav    ×8   crew=I.1, base=I.2
//   II. Udržitelnost     ×4   supplies=II.1, integrity=II.2
//   III. Rozvoj          ×2   [P2+ pahýl = 100%]
//   IV. Společnost       ×1   [P2+ pahýl = 100%]
// Patro = min(children). Overall = vážený průměr (I×8 + II×4 + III×2 + IV×1) / 15.
function recomputeStatus(w: World): void {
  const toLevel = (pct: number): StatusLevel =>
    pct < THRESHOLD_CRIT_PCT ? "crit" : pct < THRESHOLD_WARN_PCT ? "warn" : "ok";

  // I.1 Crew — alive (cryo + idle + working) / total.
  const totalActors = w.actors.length;
  const aliveActors = w.actors.filter((a) => a.state !== "dead").length;
  const crewPct = totalActors > 0 ? (aliveActors / totalActors) * 100 : 0;

  // I.2 Base — avg HP% modulů.
  const mods = Object.values(w.modules);
  let baseSum = 0;
  let baseCount = 0;
  for (const mod of mods) {
    if (mod.hp_max <= 0) continue;
    baseSum += (mod.hp / mod.hp_max) * 100;
    baseCount++;
  }
  const basePct = baseCount > 0 ? baseSum / baseCount : 0;

  // II.1 Supplies — min(food%, air%).
  const foodPct = w.resources.slab.food;
  const airPct = w.resources.flux.air;
  const suppliesPct = Math.min(foodPct, airPct);

  // II.2 Integrity — avg HP% všech vrstev (bays + moduly).
  // Energie je samostatná osa (E bar) — nemíchat do integrity.
  // TODO (v budoucnu): přepsat na rate (Δ HP / game day) — repair vs. decay trajektorie.
  let hpSum = 0;
  let hpCount = 0;
  for (const bay of w.segment) {
    if (bay.kind === "skeleton" || bay.kind === "covered") {
      hpSum += (bay.hp / bay.hp_max) * 100;
      hpCount++;
    }
  }
  for (const mod of mods) {
    if (mod.hp_max <= 0) continue;
    hpSum += (mod.hp / mod.hp_max) * 100;
    hpCount++;
  }
  const integrityPct = hpCount > 0 ? hpSum / hpCount : 0;

  // Patra — worst child uvnitř patra.
  const tier1Pct = Math.min(crewPct, basePct);
  const tier2Pct = Math.min(suppliesPct, integrityPct);
  const tier3Pct = 100; // P2+ pahýl
  const tier4Pct = 100; // P2+ pahýl

  // Overall — vážený průměr pyramid.
  const overallPct = (tier1Pct * 8 + tier2Pct * 4 + tier3Pct * 2 + tier4Pct * 1) / 15;

  // Detekce změn level — SIGN event pro každou osu, která změní rating.
  // Skip v boot phase (init, startGame — stav se ustaluje).
  // Text = lidská věta: KDO ↑/↓ ODKUD → KAM (KOLIK%) — PROČ (axiom S22).
  const AXIS_CS: Record<string, string> = {
    crew: "Posádka", base: "Základna", supplies: "Zásoby",
    integrity: "Integrita", overall: "Celkový stav",
  };
  const emitSign = (name: string, prev: StatusNode, pct: number, detail?: string, displayName?: string) => {
    const newLevel = toLevel(pct);
    if (w.tick > 0 && prev.level !== newLevel) {
      const prevR = statusRating(prev.pct);
      const newR = statusRating(pct);
      const prevLabel = STATUS_LABELS[prevR].cs;
      const newLabel = STATUS_LABELS[newR].cs;
      const dir = pct > prev.pct ? "↑" : "↓";
      const cs = displayName ?? AXIS_CS[name] ?? name;
      const extra = detail ? ` — ${detail}` : "";
      appendEvent(w, "SIGN", {
        item: name,
        amount: Math.round(pct),
        text: `${cs} ${dir} ${prevLabel} → ${newLabel} (${Math.round(pct)}%)${extra}`,
      });
    }
  };

  // Supplies: zobraz konkrétní zdroj (Air/Food), ne abstraktní „Zásoby".
  const suppliesDriver = foodPct <= airPct ? "food" : "air";
  const driverLabel = suppliesDriver === "air" ? "Air" : "Food";
  emitSign("crew", w.status.crew, crewPct, `${aliveActors}/${totalActors} alive`);
  emitSign("base", w.status.base, basePct, `avg HP ${Math.round(basePct)}%`);
  emitSign("supplies", w.status.supplies, suppliesPct, undefined, driverLabel);
  emitSign("integrity", w.status.integrity, integrityPct);
  emitSign("overall", w.status.overall, overallPct);

  w.status.crew = { pct: crewPct, level: toLevel(crewPct) };
  w.status.base = { pct: basePct, level: toLevel(basePct) };
  w.status.supplies = { pct: suppliesPct, level: toLevel(suppliesPct) };
  w.status.integrity = { pct: integrityPct, level: toLevel(integrityPct) };
  w.status.tier1 = { pct: tier1Pct, level: toLevel(tier1Pct) };
  w.status.tier2 = { pct: tier2Pct, level: toLevel(tier2Pct) };
  w.status.overall = { pct: overallPct, level: toLevel(overallPct) };
}
function appendEventLog(_w: World): void { /* Events se emitují in-place přes appendEvent(). Slot zachován pro axiom pipeline pořadí. */ }

// === Derived: Work (W) ===

// Work: dvě osy — kapacita (Wh, jak dlouho vydržíme) a výkon (W, jak rychle).
// Hráči: kapacita = HP, výkon = actor.work.
// Drony: kapacita = E základny, výkon = 1 W/dron. Funkční jen pokud E > 0.
//
// S24 ladění: powerAvailable/Used/Total — aktuálně disponibilní vs. čerpaný výkon.
// Top Bar W ukazuje „available / total" (kolik právě mám / kolik celkem) — 0/23
// při plně pracujících dronech, 23/23 když nepracují.
export function computeWork(w: World): {
  capMax: number; capPlayer: number; capDrone: number;
  powerMax: number; powerPlayer: number; powerDrone: number;
  powerUsed: number; powerAvailable: number;
} {
  let capPlayer = 0;
  let powerPlayer = 0;
  for (const a of w.actors) {
    if (a.state === "dead" || a.state === "cryo") continue;
    capPlayer += a.hp;
    powerPlayer += a.work;
  }
  const droneOnline = w.resources.energy > 0;
  const capDrone = droneOnline ? w.drones : 0;
  const powerDrone = droneOnline ? w.drones : 0;
  const powerMax = Math.round(powerPlayer + powerDrone);

  // Kolik W se reálně čerpá na aktivních tascích.
  // Hráčský příspěvek: actors ve state "working". Dronový: w.drones pokud E > 0
  // a existuje aspoň jeden active task (FVP: jeden active task čerpá celou kapacitu 23 W).
  let playerUsed = 0;
  for (const a of w.actors) {
    if (a.state === "working") playerUsed += a.work;
  }
  const hasActiveTask = w.tasks.some((t) => t.status === "active" && t.kind !== "service");
  const droneUsed = droneOnline && hasActiveTask ? w.drones : 0;
  const powerUsed = playerUsed + droneUsed;
  const powerAvailable = Math.max(0, powerMax - powerUsed);

  return {
    capMax: Math.round(capPlayer + capDrone),
    capPlayer: Math.round(capPlayer),
    capDrone,
    powerMax,
    powerPlayer: Math.round(powerPlayer),
    powerDrone,
    powerUsed,
    powerAvailable,
  };
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
