// World engine — perpetual observer simulation (S20/S21 axiom).
//
// Orchestrátor + re-exporty. Detail logiky v sourozencích (`task.ts`,
// `protocol.ts`, `decay.ts`, `production.ts`, `status.ts`, …).
// Žádný Phaser import — testovatelné samostatně.

import type { World } from "../model";
import { appendEvent } from "../events";
import { decayTick } from "./decay";
import { protocolTick } from "./protocol";
import { assignIdleActors, progressTasks, cleanupOldTasks } from "./task";
import { productionTick } from "./production";
import { recomputeStatus } from "./status";
import { advanceFlowDay } from "./flow";
import { scheduledEvents } from "./scheduled";

// === Re-exporty pro stávající konzumenty (UI, testy) ===

export { createInitialWorld } from "./init";
export { formatGameTime, formatGameTimeShort, formatEta, taskEtaTicks, describeTaskTarget } from "./format";
export { getOuterHP, getBayTrajectory, type OuterHP, type Trajectory } from "./bay";
export { averageFlow, type FlowCategory, type FlowDirection } from "./flow";
export { enqueueRepairTask } from "./task";
export { computeWork } from "./work";
export { computeEnergyMax } from "./production";

// Re-export tuning konstant — drží stabilní API pro stávající konzumenty
// (GameScene, header, testy). Logiku vlastní `tuning.ts`, tady jen průchod.
export {
  TICK_MS,
  TICKS_PER_SECOND,
  TICKS_PER_GAME_DAY,
  TICKS_PER_WALL_MINUTE,
  WD_PER_HP,
  ENERGY_SEED,
  SOLIDS_MAX,
  FLUIDS_MAX,
  FLOW_WINDOW_GAME_DAYS,
} from "../tuning";

// === Simulation loop — Perpetual Observer Simulation axiom ===
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
  productionTick(w);      // slot 7
  arrivalsTick(w);        // slot 8 — no-op
  scheduledEvents(w);     // slot 9 — no-op
  recomputeStatus(w);     // slot 10
  appendEventLog(w);      // slot 11 — no-op
  advanceFlowDay(w);      // slot 12 (S26) — rotace rolling-window KPI bufferu
}

// === No-op pipeline sloty — kontrakt zachován, těla doplnit po jednom kuse ===

// Slot 2 — per-capita resource drain.
// S25 KISS retire: air + food odstraněny — žádný drain v FVP. Stovky sezení
// crew spí v cryo, atmosféra je 24th-cent recyklovaná. Až přijde wake-up +
// item registr s edible attributem, doplnit drain edible bucketu (water?).
function resourceDrain(_w: World): void { /* no-op v FVP */ }

function autoEnqueueTasks(_w: World): void { /* TODO: priority-based task enqueue — dnes řeší protocolTick */ }

function actorLifeTick(w: World): void {
  // S29 cryo failure: MedCore drží life-support cryo lůžek. Pokud všechny
  // MedCore instance mají hp ≤ 0, crew v cryo nemá jak přežít → hromadná smrt.
  // Jednorázový event; po něm je cryoAlive.length = 0 a funkce už nic nedělá.
  //
  // Rationale: FVP endgame bez interakce = S/F dojdou → QM nemůže opravovat →
  // asteroid → MedCore HP=0 → crew dies. „Kus šrotu bez života doslova."
  // Wake-up mechanismus (probuzení při E=0, HOMELESS drain atd.) = Release 2.

  const cryoAlive = w.actors.filter((a) => a.state === "cryo");
  if (cryoAlive.length === 0) return;

  const medcores = Object.values(w.modules).filter((m) => m.kind === "MedCore");
  if (medcores.some((m) => m.hp > 0)) return; // aspoň 1 MedCore žije → OK

  // Katastrofa: všechny MedCore padly. Hromadný DEAD:CRIT event (1 řádek v
  // logu) + per-actor state flip (ne 32 events — zahltilo by log).
  for (const a of cryoAlive) a.state = "dead";
  appendEvent(w, "DEAD", {
    csq: "CRIT",
    amount: cryoAlive.length,
    loc: medcores[0]?.id,
    text: `MedCore zničen — ${cryoAlive.length} kolonistů zemřelo v cryo (life-support kolaps)`,
  });
}

function arrivalsTick(_w: World): void { /* TODO: kapsle / Network Arc signály */ }
function appendEventLog(_w: World): void { /* Events se emitují in-place přes appendEvent(). Slot zachován pro axiom pipeline pořadí. */ }
