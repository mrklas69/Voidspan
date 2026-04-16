// Status tree (Maslow axiom S20, S21) — slot 10.
//   I.  Aktuální stav    ×8   crew=I.1, base=I.2
//   II. Udržitelnost     ×4   supplies=II.1, integrity=II.2
//   III. Rozvoj          ×2   [P2+ pahýl = 100%]
//   IV. Společnost       ×1   [P2+ pahýl = 100%]
// Patro = min(children). Overall = vážený průměr (I×8 + II×4 + III×2 + IV×1) / 15.

import type { World, StatusLevel, StatusNode } from "../model";
import { STATUS_LABELS, statusRating } from "../model";
import { THRESHOLD_CRIT_PCT, THRESHOLD_WARN_PCT } from "../tuning";
import { appendEvent } from "../events";

export function recomputeStatus(w: World): void {
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

  // II.1 Supplies — worst-of(Solids, Fluids).
  // S26 FVP KISS: bez subtypů, ploché S/F jako runway proxy.
  const r = w.resources;
  const suppliesPct = Math.min(r.solids, r.fluids);

  // II.2 Integrity — avg HP% modulů (po S28 layered bay retire = totéž jako base).
  // Energie je samostatná osa (E bar) — nemíchat do integrity.
  // TODO (v budoucnu): přepsat na rate (Δ HP / game day) — repair vs. decay trajektorie.
  // Po S28 redundantní s base; ponecháno jako Status tree axiom — P2+ rozliší
  // (base = funkčnost online/offline, integrity = HP trajectory).
  const integrityPct = basePct;

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
        text: `${cs} ${dir} ${prevLabel} > ${newLabel} (${Math.round(pct)}%)${extra}`,
      });
    }
  };

  // Supplies: zobraz worst kategorii (Solids/Fluids). FVP KISS bez subtypů.
  const driverLabel = r.solids <= r.fluids ? "Solids" : "Fluids";
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
