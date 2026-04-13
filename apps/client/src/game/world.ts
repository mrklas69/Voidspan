// World engine — POC_P1 §13–14.
// Čistá funkční logika: `createInitialWorld`, `stepWorld`, FSM přechody.
// Žádný Phaser import — testovatelné samostatně (budoucí unit testy).

import type { World, Tile, Phase, LossReason, Actor, Task, ActorKind, Module, ModuleKind } from "./model";
import { ACTOR_DEFS, TASK_DEFS, MODULE_DEFS } from "./model";

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

// 1 game day = 16 game hours × 15 s wall = 240 s = 960 ticků (viz FOOD_DRAIN výše).
// WD = "watt-day" = 1 W actor pracující 1 game day. Per-tick progress jednoho actora:
//   wd_per_tick = power_w * (1 / TICKS_PER_GAME_DAY)
// Příklad: Constructor (12 W) sám opraví 10 WD damaged tile za 800 ticků = 200 s wall ≈ 3.3 min
// (souhlasí s CAL-A1b optimum). Tři constructory dohromady ~67 s.
export const TICKS_PER_GAME_DAY = 960;

// Formát herního času — AXIOM: `T:D.HH:MM` (GLOSSARY → UI Layout).
// D = den od 0, HH 00–15 (16h den), MM 00–59. Sekundy nezobrazujeme —
// granularita tiku = 1 game minuta (1 tick = 60 game sec), SS by byl stále 00.
export function formatGameTime(tick: number): string {
  const gameMin = tick; // 1 tick = 1 game minuta
  const day = Math.floor(gameMin / (16 * 60));
  const minInDay = gameMin % (16 * 60);
  const hh = String(Math.floor(minInDay / 60)).padStart(2, "0");
  const mm = String(minInDay % 60).padStart(2, "0");
  return `T:${day}.${hh}:${mm}`;
}

// Predefinovaný index damaged tile při phase_a (§14 side-effect).
// S16: posunut z 5 → 12, protože idx 5 nyní obsazuje Storage modul mateřské lodi.
// Idx 12 = row 1 col 4, prostřední prázdný tile pod horní řadou modulů.
export const DAMAGED_TILE_IDX = 12;

// HP-unified damage axiom (S16).
// TILE_HP_MAX = 10 znamená "plně zdravý floor". Empty tile má hp=hp_max, damaged
// začíná hp=0 a oprava HP postupně doplňuje. 1 WD = 1 HP (P1 konverzní konstanta)
// — dává CAL-A1a == 10 WD na opravu fully damaged tile.
export const TILE_HP_MAX = 10;
export const WD_PER_HP = 1;

// Back-compat alias (CAL-A1a): DAMAGED_WD = plná oprava from hp=0 = hp_max × WD_PER_HP.
export const DAMAGED_WD = TILE_HP_MAX * WD_PER_HP;

// Energy (S16) — baterie pásu, jednotka Wh (watt-hour). Seed 12, UI cap 48.
// Produkce (SolarArray +24 W) a spotřeba (modul load, actor work) budou P2+.
// V P1 je Energy statická — hráč ji jen vidí, nesnižuje se, není spotřebovávána.
export const ENERGY_SEED = 12;
export const ENERGY_MAX = 48;

// === Factory ===

// Iniciální svět ve stavu `boot`. Kolonie startuje SEGMENTEM MATEŘSKÉ LODI (S16,
// dle POC_P1 §3). Layout 8×2:
//
//   idx:  0    1    2    3    4    5    6    7
//   row0: Hab  Sol  Med  Ass  CP   Sto  Eng  Eng
//   idx:  8    9    10   11   12   13   14   15
//   row1: __   __   __   __   Dmg  __   Eng  Eng
//
// Damaged (idx 12) přibyde až v startGame — krize spouštěcí phase_a.
// Engine 2×2 (root idx 6) bude demolován v phase_b → na jeho místě vznikne Dock.
export function createInitialWorld(): World {
  // Array.from s callbackem → 16× empty tile na plné HP. Nezávislé instance
  // (kdybychom dali `new Array(16).fill(...)`, sdílí se reference — past v TS).
  const segment: Tile[] = Array.from({ length: 16 }, () => ({
    kind: "empty",
    hp: TILE_HP_MAX,
    hp_max: TILE_HP_MAX,
  }));

  // === Mateřská loď — registr modulů + obsazení tiles ===
  // HP-unified axiom (S16): instance.hp_max = kopie z MODULE_DEFS[kind].max_hp.
  // Single-tile moduly + Engine 2×2. Status "offline" = pasivní v P1.
  const modules: Record<string, Module> = {};

  // Helper: vytvoří modul instance + obsadí tile(y) v segmentu.
  // Pro multi-tile (w×h) projde všechny offsety a každý tile označí jako module_ref.
  // rootIdx = top-left tile (= idx s rootOffset {0,0}).
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
        segment[idx] = { kind: "module_ref", moduleId: id, rootOffset: { dx, dy } };
      }
    }
  };

  // Row 0: 6× single-tile modul + Engine 2×2 zabírající idx 6,7,14,15.
  placeModule("habitat_1", "Habitat", 0);
  placeModule("solar_1", "SolarArray", 1);
  placeModule("medcore_1", "MedCore", 2);
  placeModule("assembler_1", "Assembler", 3);
  placeModule("commandpost_1", "CommandPost", 4);
  placeModule("storage_1", "Storage", 5);
  placeModule("engine_1", "Engine", 6); // 2×2 → obsadí 6,7,14,15

  // Actor pool §10: 3× Constructor + 2× Hauler + 1× Player. Všichni idle při bootu.
  // Pojmenování id čitelně (player/c1/c2/c3/h1/h2) — usnadní debug v Inspectoru/logu.
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
    // Resource Model v0.1 — viz model.ts komentář u World.resources.
    // P1 seed hodnoty (§10 + S16): energy=12 Wh, flux.air=100 %, slab.food=40, coin=20.
    resources: {
      energy: ENERGY_SEED,
      slab: { food: 40 },
      flux: { air: 100 },
      coin: 20,
    },
    segment,
    modules,
    actors,
    tasks: [],
    next_task_id: 1,
  };
}

// === Task engine ===

// Vytvoří repair task pro damaged tile. Idempotent — pokud už task existuje na ten samý
// tile, vrátí false a nic nepřidá (klikneš podruhé, nic se neduplikuje).
// Vrací true při úspěšném enqueue, false jinak (tile není damaged / už má task).
export function enqueueRepairTask(w: World, tileIdx: number): boolean {
  const tile = w.segment[tileIdx];
  if (!tile || tile.kind !== "damaged") return false;
  const exists = w.tasks.some(
    (t) => t.kind === "repair" && t.target.tileIdx === tileIdx
  );
  if (exists) return false;

  // HP-unified: wd_total odvozeno z chybějícího HP (1 WD = 1 HP pro P1).
  const wd_total = (tile.hp_max - tile.hp) * WD_PER_HP;

  w.tasks.push({
    id: `task_${w.next_task_id++}`,
    kind: "repair",
    target: { tileIdx },
    wd_total,
    wd_done: 0,
    assigned: [],
    priority: 1,
  });
  return true;
}

// Auto-assign: každý idle actor dostane první kompatibilní task. KISS — bez stropu
// počtu actors per task (saturace), bez priority sortu (zatím všechny priority = 1).
function assignIdleActors(w: World): void {
  for (const actor of w.actors) {
    if (actor.state !== "idle") continue;
    // Najdi první task, který tenhle actor kind smí dělat.
    const task = w.tasks.find((t) =>
      TASK_DEFS[t.kind].allowed_actors.includes(actor.kind as ActorKind)
    );
    if (!task) continue;
    actor.state = "working";
    actor.taskId = task.id;
    task.assigned.push(actor.id);
  }
}

// Drain WD per task podle Σ power_w přiřazených actors. Po dokončení aplikuj efekt.
// HP-unified: u repair task synchronizujeme tile.hp spojitě s wd_done — overlay
// pak plynule slábne jak oprava postupuje (ne až ve chvíli dokončení).
function progressTasks(w: World): void {
  // Procházíme přes index, abychom mohli bezpečně mazat hotové (iterate odzadu).
  for (let i = w.tasks.length - 1; i >= 0; i--) {
    const task = w.tasks[i]!;
    if (task.assigned.length === 0) continue;

    // Σ power_w přiřazených actors. Pokud actor zmizí (ne náš případ v P1), filtruj.
    let powerSum = 0;
    for (const aid of task.assigned) {
      const a = w.actors.find((x) => x.id === aid);
      if (a && a.state === "working") powerSum += ACTOR_DEFS[a.kind].power_w;
    }
    const wd_delta = powerSum / TICKS_PER_GAME_DAY;
    task.wd_done += wd_delta;

    // Spojitá HP synchronizace — 1 WD = 1 HP (WD_PER_HP=1).
    if (task.kind === "repair" && task.target.tileIdx !== undefined) {
      const tile = w.segment[task.target.tileIdx];
      if (tile && tile.kind === "damaged") {
        tile.hp = Math.min(tile.hp_max, tile.hp + wd_delta / WD_PER_HP);
      }
    }

    if (task.wd_done >= task.wd_total) {
      completeTask(w, task);
      w.tasks.splice(i, 1);
    }
  }
}

function completeTask(w: World, task: Task): void {
  // Aplikuj efekt podle kindu. P1: jen repair.
  if (task.kind === "repair" && task.target.tileIdx !== undefined) {
    // HP-unified: po opravě damaged → empty s plným HP. hp_max zachován z damaged.
    const old = w.segment[task.target.tileIdx];
    const hp_max = old?.kind === "damaged" ? old.hp_max : TILE_HP_MAX;
    w.segment[task.target.tileIdx] = { kind: "empty", hp: hp_max, hp_max };
  }
  // Uvolni actors zpět do idle.
  for (const aid of task.assigned) {
    const a = w.actors.find((x) => x.id === aid);
    if (a) {
      a.state = "idle";
      a.taskId = undefined;
    }
  }
}

// === FSM přechody ===

// boot → phase_a: vznikne damaged tile, air start 100 %.
export function startGame(w: World): void {
  if (w.phase !== "boot") return;
  // HP-unified: damaged = plně poškozený floor (hp=0), opravou se dostane do hp_max.
  w.segment[DAMAGED_TILE_IDX] = { kind: "damaged", hp: 0, hp_max: TILE_HP_MAX };
  w.resources.flux.air = 100;
  w.phase = "phase_a";
}

// phase_a → phase_b: damaged tile opraven (debug trigger v S9 přes R).
// Side-effect §14: tile → empty, air přestává klesat (regenerace TBD později).
export function repairDone(w: World): void {
  if (w.phase !== "phase_a") return;
  w.segment[DAMAGED_TILE_IDX] = { kind: "empty", hp: TILE_HP_MAX, hp_max: TILE_HP_MAX };
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

  // Task engine: nejprve přiřaď idle actors, pak posuň progress všech tasků.
  // Dokončené tasky aplikují efekt (např. damaged → empty) a uvolní actors.
  assignIdleActors(w);
  progressTasks(w);

  // Auto FSM: pokud jsme v phase_a a v segmentu už není žádný damaged tile,
  // přepni do phase_b. Nahrazuje (ale neruší) debug klávesu R.
  if (w.phase === "phase_a" && !w.segment.some((t) => t.kind === "damaged")) {
    w.phase = "phase_b";
  }

  // Air drain: od phase_a do phase_c (po phase_b by měla regenerovat, ale S9 KISS).
  // Pro teď: v phase_a klesá, v phase_b+ stagnuje (oprava drží). Odpovídá §14.
  if (w.phase === "phase_a") {
    w.resources.flux.air = Math.max(0, w.resources.flux.air - AIR_DRAIN_PER_TICK);
    if (w.resources.flux.air <= 0) {
      toLoss(w, "air");
      return;
    }
  }

  // Food drain: od phase_b dál.
  if (w.phase === "phase_b" || w.phase === "phase_c") {
    w.resources.slab.food = Math.max(0, w.resources.slab.food - FOOD_DRAIN_PER_TICK);
    if (w.resources.slab.food <= 0) {
      toLoss(w, "food");
      return;
    }
  }
}

// === Derived: Work (W) ===

// Work není zásoba, ale agregát z actors. DRY axiom (S16):
//   - max = Σ power_w všech aktérů (kolik W by mohl pool dát, kdyby všichni dřeli)
//   - current = Σ power_w aktérů ve state "working" (kolik W teče právě teď)
// HUD čte přes computeWork(world) — stejná funkce pro Top Bar i pro tooltip.
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
