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

import type { World } from "../model";
import { statusRating } from "../model";
import { PROTOCOL_VERSION, PROTOCOL_PAUSE_RATING, PROTOCOL_RESUME_RATING } from "../tuning";
import { appendEvent } from "../events";
import { firstMissingRecipeCategory } from "./recipe";
import { taskActionCs } from "./format";
import { enqueueRepairTask, taskLoc } from "./task";

// Vrátí první důvod, proč musí být repair tasky pauzované; null = vše OK.
// Jediný zdroj pravdy pro pause reasoning (sdílí TASK:PAUSE emit text,
// eternal monitor label a task queue suffix — izomorfismus, DRY).
// Pořadí check: offline autopilot → low E → no workers → chybějící materiál.
export function protocolPauseReason(w: World): string | null {
  const qm = w.software.quartermaster;
  if (!qm || qm.status === "offline") return "autopilot offline";
  const energyPct = w.energyMax > 0 ? (w.resources.energy / w.energyMax) * 100 : 0;
  if (statusRating(energyPct) <= PROTOCOL_PAUSE_RATING) return "low Energy";
  const droneCapable = w.drones > 0 && w.resources.energy > 0;
  const actorCapable = w.actors.some(
    (a) => a.state !== "dead" && a.state !== "cryo" && a.hp > 0,
  );
  if (!droneCapable && !actorCapable) return "no workers";
  const missing = firstMissingRecipeCategory(w);
  if (missing !== null) return `no ${missing}`;
  return null;
}

export function protocolTick(w: World): void {
  const qm = w.software.quartermaster;
  const qmOffline = !qm || qm.status === "offline";

  // Globální pause reason (null = vše OK, running)
  const reason = protocolPauseReason(w);
  const gated = reason !== null;

  // Resume gate: E rating ≥ RESUME práh (hystereze nad pause).
  // `!gated` už zahrnuje ne-offline + E > PAUSE + workers + materiál; zbývá jen
  // hysterezní hranice RESUME aby mezi PAUSE a RESUME zóna byla "Standby".
  const energyPct = w.energyMax > 0 ? (w.resources.energy / w.energyMax) * 100 : 0;
  const eRating = statusRating(energyPct);
  const ready = !gated && eRating >= PROTOCOL_RESUME_RATING;

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
          loc: taskLoc(t),
          target: t.id,
          item: t.kind,
          text: `${taskActionCs(t)} — ${reason}`,
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
          loc: taskLoc(t),
          target: t.id,
          item: t.kind,
          text: taskActionCs(t),
        });
      } else if (t.status === "pending") {
        t.status = "active";
        appendEvent(w, "TASK", {
          csq: "START",
          loc: taskLoc(t),
          target: t.id,
          item: t.kind,
          text: taskActionCs(t),
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
              loc: taskLoc(last),
              target: last.id,
              item: last.kind,
              text: taskActionCs(last),
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
    if (qmOffline) state = "OFFLINE — no power";
    else if (gated) state = `Paused — ${reason}`;
    else if (ready) {
      const hasActive = w.tasks.some((t) => t.kind === "repair" && t.status === "active");
      state = hasActive ? "Active" : "Idle — nothing to repair";
    } else state = "Standby"; // rating mezi PAUSE a RESUME (hystereze)
    const version = qm?.version ?? PROTOCOL_VERSION;
    monitor.label = `QuarterMaster ${version} — ${state}`;
  }
}

// Najdi modul s nejnižším HP ratio. Vrací bayIdx jeho rootu (input pro enqueueRepairTask).
// null = vše na max nebo žádné moduly.
function findMinHpRatioTarget(w: World): number | null {
  let bestIdx: number | null = null;
  let bestRatio = 1.0;

  for (let i = 0; i < w.segment.length; i++) {
    const bay = w.segment[i];
    if (!bay || bay.kind !== "module_root") continue;
    const mod = w.modules[bay.moduleId];
    if (!mod || mod.hp >= mod.hp_max) continue;
    const ratio = mod.hp / mod.hp_max;
    if (ratio < bestRatio) {
      bestRatio = ratio;
      bestIdx = i;
    }
  }
  return bestIdx;
}
