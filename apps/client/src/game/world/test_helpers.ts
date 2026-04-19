// Sdílené testovací utility — důvod extrakce je DRY, helpery by měly žít
// mimo per-file suite. Re-export jen z test souborů, ne z produkčního kódu.

import type { World } from "../model";

// Vrátí root bay index prvního poškozeného modulu v FVP init světe.
// `applyRandomDamages` v init.ts deterministicky poškodí 1× — test helper
// ho najde bez tvrdého indexu (modul name se může změnit při renames).
export function findDamagedRootIdx(w: World): number {
  const damaged = Object.values(w.modules).find((m) => m.hp < m.hp_max);
  if (!damaged) throw new Error("FVP init musí mít 1 damaged modul");
  const rootIdx = w.segment.findIndex(
    (b) => b.kind === "module_root" && b.moduleId === damaged.id,
  );
  if (rootIdx < 0) throw new Error("damaged modul nemá root bay");
  return rootIdx;
}
