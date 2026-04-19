// QuarterMaster runtime (S24, GLOSSARY §Protocol).
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

import type { World, Task } from "../model";
import { statusRating } from "../model";
import {
  PROTOCOL_VERSION,
  PROTOCOL_PAUSE_RATING,
  PROTOCOL_RESUME_RATING,
  QM_CRIT_REPAIR_PCT,
  QM_FULL_HP_TOLERANCE_PCT,
} from "../tuning";
import { appendEvent } from "../events";
import { firstMissingRecipeCategory } from "./recipe";
import { taskActionCs } from "./format";
import { enqueueRepairTask, enqueueDemolishTask, taskLoc } from "./task";
import { evaluateRules } from "./rules";
import { isDeadlocked } from "./sacrifice";
import { advanceMilestones } from "./milestone";

// Globální pauza — pauzne VŠECHNY construction tasky (repair + demolish).
// Pokrývá důvody, kdy QM prostě nemůže nic stavět: offline, málo E, žádní
// workers. Pořadí check: autopilot offline → low E → no workers.
function globalPauseReason(w: World): string | null {
  const qm = w.software.quartermaster;
  if (!qm || qm.status === "offline") return "autopilot offline";
  const energyPct = w.energyMax > 0 ? (w.resources.energy / w.energyMax) * 100 : 0;
  if (statusRating(energyPct) <= PROTOCOL_PAUSE_RATING) return "low Energy";
  const droneCapable = w.drones > 0 && w.resources.energy > 0;
  const actorCapable = w.actors.some(
    (a) => a.state !== "dead" && a.state !== "cryo" && a.hp > 0,
  );
  if (!droneCapable && !actorCapable) return "no workers";
  return null;
}

// Material pauza — pauzne JEN repair tasky. Demo může běžet (nepotřebuje
// zdroje, naopak recovery doplní sklad → rescue scenario S39).
// Chybějící Solids/Fluids per repair recipe.
function materialPauseReason(w: World): string | null {
  const missing = firstMissingRecipeCategory(w);
  if (missing !== null) return `no ${missing}`;
  return null;
}

// Combined reason — global má prioritu před material (pokud je QM offline,
// material je irelevantní). API-compatible s pre-S39 konzumenty (task_queue
// suffix, monitor label, TASK:PAUSE event text).
export function protocolPauseReason(w: World): string | null {
  return globalPauseReason(w) ?? materialPauseReason(w);
}

// Priority target kandidát — diskriminovaný union podle typu akce.
// Smart priority engine (S39): CRIT repair > live repair > live build >
// live demo > new demo > normal repair. Build/repair skip pod material gate.
type Target =
  | { type: "repair-crit"; moduleId: string; bayIdx: number }
  | { type: "repair-normal"; moduleId: string; bayIdx: number }
  | { type: "build"; taskId: string }
  | { type: "demolish-engine"; moduleId: string };

export function protocolTick(w: World): void {
  const qm = w.software.quartermaster;
  const qmOffline = !qm || qm.status === "offline";

  // Dvoufázový gate:
  //   - Global (offline / low E / no workers) → pauzne repair + demolish
  //   - Material (no Solids / Fluids) → pauzne jen repair; demo může běžet
  //     a recovery-rescue naplní sklad (S39 smart autopilot).
  const globalReason = globalPauseReason(w);
  const materialReason = materialPauseReason(w);

  const energyPct = w.energyMax > 0 ? (w.resources.energy / w.energyMax) * 100 : 0;
  const eRating = statusRating(energyPct);
  const ready = globalReason === null && eRating >= PROTOCOL_RESUME_RATING;

  if (globalReason !== null) {
    // Globální — pauzne VŠECHNY construction tasky (repair + demolish).
    for (const t of w.tasks) {
      if (t.kind !== "repair" && t.kind !== "demolish") continue;
      if (t.status === "active" || t.status === "pending") {
        pauseTask(w, t, globalReason);
      }
    }
  } else if (ready) {
    // Material gate: pauzne repair + build (oba potřebují recipe). Demo ne.
    if (materialReason !== null) {
      for (const t of w.tasks) {
        if (t.kind !== "repair" && t.kind !== "build") continue;
        if (t.status === "active" || t.status === "pending") {
          pauseTask(w, t, materialReason);
        }
      }
    }
    // Posun milestonů — trigger-based advance (repairs done → chain dock_build current, …).
    // Side-effects: milestone.status flip + SYST event; modal UI čte unacked done.
    advanceMilestones(w);
    // Vyhodnoť QM pravidla — scripted beats (post-demo build Dock, …).
    // Side-effects: enqueue tasks; idempotent guard uvnitř enqueue*.
    evaluateRules(w);
    // Deadlock detekce — QM je zaseklý, rozhoduje kapitán (wake-up).
    if (w.pendingDecision === null && isDeadlocked(w, materialReason !== null)) {
      triggerCaptainDecision(w);
    }
    // Priority pick — materialGated informace sníží priority pro repair/build
    // větve a povýší demo (rescue trigger) pokud je damaged modul čekající na
    // zablokovanou opravu.
    const target = pickNextTarget(w, materialReason !== null);
    ensureTarget(w, target);
  }

  // Update eternal monitor task label.
  const monitor = w.tasks.find((t) => t.kind === "service" && t.status === "eternal");
  if (monitor) {
    let state: string;
    if (qmOffline) state = "OFFLINE — no power";
    else if (globalReason !== null) state = `Paused — ${globalReason}`;
    else if (ready) {
      const activeCons = w.tasks.find(
        (t) => (t.kind === "repair" || t.kind === "demolish") && t.status === "active",
      );
      if (activeCons) {
        const modId = activeCons.target.moduleId ?? "?";
        if (activeCons.kind === "demolish") {
          state = materialReason !== null
            ? `Demoluji ${modId} — rescue (${materialReason})`
            : `Demoluji ${modId}`;
        } else if (activeCons.kind === "build") {
          state = `Stavím ${modId}`;
        } else {
          state = `Opravuji ${modId}`;
        }
      } else if (materialReason !== null) {
        state = `Paused — ${materialReason}`;
      } else {
        state = "Idle — nothing to do";
      }
    } else state = "Standby"; // rating mezi PAUSE a RESUME (hystereze)
    const version = qm?.version ?? PROTOCOL_VERSION;
    monitor.label = `QuarterMaster ${version} — ${state}`;
  }
}

// Priority engine — vrátí, co má QM teď dělat.
//
// materialGated = true znamená že repair/build jsou pozastaveny kvůli
// chybějícímu materiálu. QM chytře přepne na demo (rescue přinese zdroje).
//
// Pořadí (normal = materialGated false):
//   1. CRIT repair (rate-1 semafor)
//   2. Live repair task — pokračuj
//   3. Live build task — pokračuj (scripted beat z QM rules)
//   4. Live demolish task — pokračuj (po preemptu/pauze)
//   5. Nové Engine demo — trigger: flag false + no damaged
//   6. Normal repair — cold start bez existing task
//
// Pod material gate (repair/build nemohou čerpat zdroje):
//   4. Live demolish task — pokračuj
//   5'. Nové Engine demo — rescue trigger: flag false + damaged existuje
//   null — nejde nic (demo už proběhl, repair/build gated)
function pickNextTarget(w: World, materialGated: boolean): Target | null {
  // 1. CRIT repair — nemůže běžet bez materiálu.
  if (!materialGated) {
    const critTarget = findMinHpTarget(w, QM_CRIT_REPAIR_PCT);
    if (critTarget !== null) {
      return { type: "repair-crit", moduleId: critTarget.moduleId, bayIdx: critTarget.bayIdx };
    }
  }

  // 2. Existující live repair task — pokračuj, jen pokud jde (material dostupný).
  if (!materialGated) {
    const liveRepair = findLiveTask(w, "repair");
    if (liveRepair && liveRepair.target.moduleId !== undefined) {
      const bayIdx = findBayIdxForModule(w, liveRepair.target.moduleId);
      if (bayIdx !== null) {
        return { type: "repair-normal", moduleId: liveRepair.target.moduleId, bayIdx };
      }
    }
  }

  // 3. Existující live build task — pokračuj (scripted beat z QM rules).
  if (!materialGated) {
    const liveBuild = findLiveTask(w, "build");
    if (liveBuild) {
      return { type: "build", taskId: liveBuild.id };
    }
  }

  // 4. Existující live demolish task — pokračuj (demo nepotřebuje zdroje).
  const liveDemo = findLiveTask(w, "demolish");
  if (liveDemo && liveDemo.target.moduleId !== undefined) {
    return { type: "demolish-engine", moduleId: liveDemo.target.moduleId };
  }

  // 5. Nové Engine demo — dvě větve:
  //    (a) normal: flag false + no damaged (standard trigger po opravách)
  //    (b) rescue: flag false + materialGated (zdroje dojdou, rozeber motor)
  if (!w.engineDemoEnqueued) {
    const engineMod = findEngineModule(w);
    if (engineMod !== null && (materialGated || !anyDamagedModule(w))) {
      return { type: "demolish-engine", moduleId: engineMod };
    }
  }

  // 6. Normal repair — cold start. Nemůže běžet pod material gate.
  if (!materialGated) {
    const normalTarget = findMinHpTarget(w, 100);
    if (normalTarget !== null) {
      return { type: "repair-normal", moduleId: normalTarget.moduleId, bayIdx: normalTarget.bayIdx };
    }
  }
  return null;
}

// Najdi první task daného kindu s live statusem (pending/paused/active).
// Jediný zdroj pravdy pro „live task" predikát napříč priority engine.
function findLiveTask(w: World, kind: "repair" | "demolish" | "build"): Task | null {
  for (const t of w.tasks) {
    if (t.kind !== kind) continue;
    if (t.status === "pending" || t.status === "paused" || t.status === "active") return t;
  }
  return null;
}

// True = existuje modul s HP pod tolerance-adjusted prahem. Trigger guard pro
// Engine demo (spustí se až po dokončení oprav). Vyloučeno jsou non-online
// moduly + sub-procentní decay drift (QM_FULL_HP_TOLERANCE_PCT) — bez tolerance
// by decay busy loop (modul repair → 100% → next tick decay → repair znovu)
// QM nikdy nepustil z priority „normal repair" na priority „Engine demo".
function anyDamagedModule(w: World): boolean {
  const fullyHealthyThreshold = (100 - QM_FULL_HP_TOLERANCE_PCT) / 100;
  for (const mod of Object.values(w.modules)) {
    if (mod.status !== "online") continue;
    const ratio = mod.hp / mod.hp_max;
    if (ratio < fullyHealthyThreshold) return true;
  }
  return false;
}

// Najde bayIdx root baye pro modul — potřebné pro enqueueRepairTask signaturu.
// null = modul neexistuje v segmentu (shouldn't happen, ale safeguard).
function findBayIdxForModule(w: World, moduleId: string): number | null {
  for (let i = 0; i < w.segment.length; i++) {
    const bay = w.segment[i];
    if (bay?.kind === "module_root" && bay.moduleId === moduleId) return i;
  }
  return null;
}

// All-or-nothing swap: pokud aktuální active construction task ≠ požadovaný cíl,
// pauzni ho (zachová wd_done); ensure cíl je active (nebo ho vytvoř).
// Identifikace targetu: pro build je to `taskId` (jednotlivý task), pro ostatní
// je to `kind + moduleId` (jedna úloha per modul).
function ensureTarget(w: World, target: Target | null): void {
  const targetTaskId = target?.type === "build" ? target.taskId : null;
  const targetModuleId = target && target.type !== "build" ? target.moduleId : null;
  const targetKind: "repair" | "demolish" | "build" | null = target
    ? (target.type === "demolish-engine" ? "demolish"
       : target.type === "build" ? "build"
       : "repair")
    : null;

  // Pauzni všechny active/pending construction tasky, které nejsou cíl.
  for (const t of w.tasks) {
    if (t.kind !== "repair" && t.kind !== "demolish" && t.kind !== "build") continue;
    if (t.status !== "active" && t.status !== "pending") continue;
    const isTarget = targetTaskId !== null
      ? t.id === targetTaskId
      : (targetModuleId !== null && t.kind === targetKind && t.target.moduleId === targetModuleId);
    if (!isTarget) {
      pauseTask(w, t, "priority switch");
    }
  }

  if (target === null) return;

  // Build — task už existuje (rule ho enqueuel). Najdi podle taskId.
  if (target.type === "build") {
    const existing = w.tasks.find((t) => t.id === target.taskId);
    if (!existing) return;
    if (existing.status === "paused") {
      existing.status = "active";
      appendEvent(w, "TASK", {
        csq: "RESUME", loc: taskLoc(existing), target: existing.id,
        item: existing.kind, text: taskActionCs(existing),
      });
    } else if (existing.status === "pending") {
      existing.status = "active";
      appendEvent(w, "TASK", {
        csq: "START", loc: taskLoc(existing), target: existing.id,
        item: existing.kind, text: taskActionCs(existing),
      });
    }
    return;
  }

  // Repair / demolish — najdi existující task pro cíl podle moduleId + kind.
  const existing = w.tasks.find(
    (t) => t.kind === targetKind && t.target.moduleId === targetModuleId &&
      (t.status === "paused" || t.status === "pending" || t.status === "active"),
  );
  if (existing) {
    if (existing.status === "paused") {
      existing.status = "active";
      appendEvent(w, "TASK", {
        csq: "RESUME", loc: taskLoc(existing), target: existing.id,
        item: existing.kind, text: taskActionCs(existing),
      });
    } else if (existing.status === "pending") {
      existing.status = "active";
      appendEvent(w, "TASK", {
        csq: "START", loc: taskLoc(existing), target: existing.id,
        item: existing.kind, text: taskActionCs(existing),
      });
    }
    return;
  }

  // Nový task (jen pro repair / demolish — build se enqueuje přes QM rules).
  let created = false;
  if (target.type === "demolish-engine") {
    created = enqueueDemolishTask(w, target.moduleId);
    if (created) w.engineDemoEnqueued = true;
  } else {
    created = enqueueRepairTask(w, target.bayIdx);
  }
  if (!created) return;
  const last = w.tasks[w.tasks.length - 1];
  if (!last) return;
  last.status = "active";
  appendEvent(w, "TASK", {
    csq: "START", loc: taskLoc(last), target: last.id,
    item: last.kind, text: taskActionCs(last),
  });
}

// Trigger wake-up kapitána (S39 deadlock). Set pendingDecision flag, first-time
// budí z cryo + emit SYST:CRIT event (epitaph-styl, narativní drama). Modal UI
// čte `pendingDecision` a otevře se automaticky.
function triggerCaptainDecision(w: World): void {
  w.pendingDecision = "sacrifice-for-build";
  if (!w.captainAwake) {
    w.captainAwake = true;
    const player = w.actors.find((a) => a.id === "player");
    if (player && player.state === "cryo") player.state = "idle";
    appendEvent(w, "SYST", {
      csq: "CRIT",
      actor: "player",
      text: "Kapitán probuzen — Protokol uvízl, rozhoduje kapitán.",
    });
  } else {
    // Opakovaný deadlock — nový decision cyklus bez re-probuzení.
    appendEvent(w, "SYST", {
      csq: "CRIT",
      text: "Další rozhodnutí kapitána — Protokol čeká.",
    });
  }
}

// Pauzni jeden task + uvolni jeho assigned actors + emit TASK:PAUSE.
// Sdílený helper mezi gated branch a priority switch branch — jediný zdroj
// pravdy pro „jak se pauzuje construction task".
function pauseTask(w: World, t: Task, reason: string): void {
  t.status = "paused";
  for (const aid of t.assigned) {
    const a = w.actors.find((x) => x.id === aid);
    if (a) { a.state = "idle"; a.taskId = undefined; }
  }
  t.assigned = [];
  appendEvent(w, "TASK", {
    csq: "PAUSE",
    loc: taskLoc(t),
    target: t.id,
    item: t.kind,
    text: `${taskActionCs(t)} — ${reason}`,
  });
}

// Najdi modul s nejnižším HP ratio pod daným prahem (pct 0..100).
// `maxPct = 100` = jakýkoli damaged. `maxPct = 15` = jen CRIT.
// Vrací { moduleId, bayIdx } nebo null. Vylučuje non-online moduly:
//   - offline: QM neopravuje (nefunkční modul, Engine seed / power-out)
//   - building: modul ve výstavbě, HP roste přes build task (ne repair)
//   - demolishing: modul v rozpadu, HP klesá (ne kandidát na opravu)
// + ignoruje sub-procentní decay drift (QM_FULL_HP_TOLERANCE_PCT, viz tuning).
function findMinHpTarget(w: World, maxPct: number): { moduleId: string; bayIdx: number } | null {
  let bestIdx: number | null = null;
  let bestId: string | null = null;
  let bestRatio = maxPct / 100;
  const fullyHealthyThreshold = (100 - QM_FULL_HP_TOLERANCE_PCT) / 100;
  for (let i = 0; i < w.segment.length; i++) {
    const bay = w.segment[i];
    if (!bay || bay.kind !== "module_root") continue;
    const mod = w.modules[bay.moduleId];
    if (!mod) continue;
    if (mod.status !== "online") continue;
    const ratio = mod.hp / mod.hp_max;
    if (ratio >= fullyHealthyThreshold) continue;
    if (ratio < bestRatio) {
      bestRatio = ratio;
      bestIdx = i;
      bestId = mod.id;
    }
  }
  if (bestIdx === null || bestId === null) return null;
  return { moduleId: bestId, bayIdx: bestIdx };
}

// Najdi moduleId prvního Engine modulu (FVP má jen jeden). null = žádný
// (Engine už byl demolished nebo nikdy nebyl).
function findEngineModule(w: World): string | null {
  for (const mod of Object.values(w.modules)) {
    if (mod.kind === "Engine") return mod.id;
  }
  return null;
}
