// QM Rule engine (S39) — minimal DSL v0.
//
// Aspirační text DSL (IDEAS Protocol DSL §S31, plný parser P2+):
//   if <subject>.<prop> == <value> then <target>.<method>(<args>)
//
// Příklad: `if engine_1.status == removed then Dock.build(seg042[6])`
//
// FVP POC: pravidla jako TS struktury se `when`/`then` closure. `dsl` string je
// dokumentace + budoucí input pro parser (text → closure). Evaluátor iteruje
// pravidla per tick v `protocolTick` a spouští `then`, když `when` platí.
//
// Side-effect disciplína: `then` volá enqueue* helpery (idempotent). Opakované
// vyhodnocení pravidla je safe — idempotent check v enqueue* guarduje.

import type { World } from "../model";
import { enqueueBuildTask } from "./task";

// QM rule — when/then pár.
// `id` = stabilní identifikátor (pro logy, UI, budoucí disable toggle).
// `dsl` = text reprezentace (aspirační syntax, dnes dokumentační, P2+ spustitelná).
export type QMRule = {
  id: string;
  dsl: string;
  when: (w: World) => boolean;
  then: (w: World) => void;
};

// FVP rules — výchozí pravidla kolonie. R2+: načteno z w.software.quartermaster.rules
// (per-colony konfigurace). Dnes hard-coded, aby Observer viděl scripted beats.
export const FVP_RULES: QMRule[] = [
  {
    id: "post-engine-demo-build-dock",
    dsl: "if engine_1.status == removed then Dock.build(seg042[6])",
    // Trigger: Engine demo flag je true (QM rozhodnul demolovat) a Engine modul
    // je skutečně odstraněn z w.modules (demo completion nastalo).
    when: (w) => w.engineDemoEnqueued && !w.modules["engine_1"],
    // Action: enqueue build Dock na rootIdx 6 (kde byl Engine). Idempotent guard
    // uvnitř enqueueBuildTask vrátí false při opakovaném volání.
    then: (w) => { enqueueBuildTask(w, "Dock", 6); },
  },
  {
    id: "post-dock-build-harvester",
    dsl: "if dock_1.status == online then AsteroidHarvester.build(seg042[0])",
    // Trigger: Dock dokončen (online) a ještě žádný Harvester neexistuje.
    when: (w) => {
      const dock = w.modules["dock_1"];
      if (!dock || dock.status !== "online") return false;
      return !Object.values(w.modules).some((m) => m.kind === "AsteroidHarvester");
    },
    // Action: enqueue build Harvester na rootIdx 0 (cello lodi, volný void).
    then: (w) => { enqueueBuildTask(w, "AsteroidHarvester", 0); },
  },
];

// Evaluate rules — volej once per tick. Spouští all matched when/then bez
// priority (pravidla jsou deklarativní fakta; pořadí v poli určuje tie-break).
export function evaluateRules(w: World, rules: QMRule[] = FVP_RULES): void {
  for (const rule of rules) {
    if (rule.when(w)) rule.then(w);
  }
}
