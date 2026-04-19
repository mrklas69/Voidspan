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
import { harvesterTick } from "./harvester";
import { recomputeStatus } from "./status";
import { advanceFlowDay } from "./flow";
import { scheduledEvents } from "./scheduled";
import { collapseTick } from "./collapse";

// === Re-exporty pro stávající konzumenty (UI, testy) ===

export { createInitialWorld } from "./init";
export { formatGameTime, formatGameTimeShort, formatEta, taskEtaTicks, describeTaskTarget } from "./format";
export { getOuterHP, getBayTrajectory, type OuterHP, type Trajectory } from "./bay";
export { averageFlow, currentDayRate, type FlowCategory, type FlowDirection } from "./flow";
export { enqueueRepairTask, enqueueDemolishTask, enqueueBuildTask, findActiveTaskForModule, isConstructionTask } from "./task";
export { protocolPauseReason } from "./protocol";
export { getSacrificeCandidates, chooseSacrifice, isDeadlocked, type SacrificeCandidate } from "./sacrifice";
export { advanceMilestones, firstPendingAck } from "./milestone";
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
// Pipeline sloty. Axiom-level pořadí je kánon; některé sloty jsou dnes
// prázdné stuby a naplní se postupně (viz TODO „Perpetual Observer — full
// implementation"):
//
//   1) decayTick           — entropie snižuje HP (per game-day)
//   2) resourceDrain       — per-capita drain (R2, wake-up + edible items)
//   3a) protocolTick       — QuarterMaster gate + enqueue repairs (S24)
//   3b) autoEnqueueTasks   — priority queue (critical HP → repair, chybějící zásoba → produce; R2)
//   4) assignIdleActors    — volné aktéry → task dle allowed_actors + priority
//   5) progressTasks       — WD delta, HP/resource sync, completion
//   5b) cleanupOldTasks    — autoclean completed/failed po TASK_AUTOCLEAN_TICKS (S24)
//   6) actorLifeTick       — cryo failure (MedCore HP=0 → 32× DEAD, S30);
//                            R2: HP drain probuzených + HOMELESS logika
//   7) productionTick      — SolarArray → E, software draw, drone charge
//   8) arrivalsTick        — kapsle na orbitu, Network Arc signály (R2)
//   6b) collapseTick       — terminal epitaph (all actors dead → 1× SYST:CRIT)
//   9) scheduledEvents     — scripted events bank (asteroid hit, SCENARIO §5)
//  10) recomputeStatus     — agregace Status tree (I–IV) pro Observer UI
//  11) advanceFlowDay      — rotace rolling-window KPI bufferu (S26)
//
// Events se emitují **in-place** přes `appendEvent()` v místě, kde vzniká
// signál (nikoli v dedikovaném batch slotu). Původní slot 11 „appendEventLog"
// retirován v S32 auditu — in-place přístup je data-driven pravda.
//
// win/loss retirováno (S21). Phase scénář retirován (S23).
export function stepWorld(w: World): void {
  w.tick += 1;

  decayTick(w);           // slot 1
  resourceDrain(w);       // slot 2 — stub (R2 per-capita drain)
  protocolTick(w);        // slot 3a (S24)
  autoEnqueueTasks(w);    // slot 3b — stub (dnes řeší protocolTick)
  assignIdleActors(w);    // slot 4
  progressTasks(w);       // slot 5
  cleanupOldTasks(w);     // slot 5b (S24)
  actorLifeTick(w);       // slot 6 — S30 cryo failure
  collapseTick(w);        // slot 6b — terminal epitaph (one-shot)
  productionTick(w);      // slot 7
  harvesterTick(w);       // slot 7b — S39 AsteroidHarvester per-hour Poisson
  arrivalsTick(w);        // slot 8 — stub (R2 kapsle)
  scheduledEvents(w);     // slot 9 — S30 asteroid
  recomputeStatus(w);     // slot 10
  advanceFlowDay(w);      // slot 11 (S26) — rotace rolling-window KPI bufferu
}

// === Stub sloty — kontrakt zachován, těla doplnit s příslušnou mechanikou ===

// Slot 2 — per-capita resource drain. V FVP no-op (crew v cryo, atmosféra
// 24th-cent recyklovaná, food/air retired S25). Naplní se v R2 s wake-up +
// item registrem (edible bucketu — water?).
function resourceDrain(_w: World): void { /* R2 */ }

function autoEnqueueTasks(_w: World): void { /* R2: priority queue — dnes řeší protocolTick */ }

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

function arrivalsTick(_w: World): void { /* R2: kapsle / Network Arc signály */ }
