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
import { taskActionCs, describeTaskTarget } from "./format";
import { enqueueRepairTask } from "./task";

export function protocolTick(w: World): void {
  const qm = w.software.quartermaster;
  const qmOffline = !qm || qm.status === "offline";
  const energyPct = w.energyMax > 0 ? (w.resources.energy / w.energyMax) * 100 : 0;
  const eRating = statusRating(energyPct);

  // Kapacitní check: je kdo pracovat?
  const droneCapable = w.drones > 0 && w.resources.energy > 0;
  const actorCapable = w.actors.some(
    (a) => a.state !== "dead" && a.state !== "cryo" && a.hp > 0,
  );
  const hasWorkers = droneCapable || actorCapable;

  // Material gate (S25): kterákoli existující repair task vyžaduje recipe složky.
  // Pokud Solids/Fluids chybí → pause s důvodem podle kategorie.
  const missingMaterial = firstMissingRecipeCategory(w);
  const noMaterial = missingMaterial !== null;

  // QM offline → gate force pause a žádné resume/enqueue.
  const gated = qmOffline || eRating <= PROTOCOL_PAUSE_RATING || !hasWorkers || noMaterial;
  const ready = !qmOffline && eRating >= PROTOCOL_RESUME_RATING && hasWorkers && !noMaterial;

  const reason = qmOffline
    ? "autopilot offline"
    : eRating <= PROTOCOL_PAUSE_RATING
      ? "low Energy"
      : !hasWorkers
        ? "no workers"
        : `no ${missingMaterial}`;

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
    if (qmOffline) state = "OFFLINE — no power";
    else if (gated) {
      if (eRating <= PROTOCOL_PAUSE_RATING) state = "Paused — low Energy";
      else if (!hasWorkers) state = "Paused — no workers";
      else state = `Paused — no ${missingMaterial}`;
    }
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
