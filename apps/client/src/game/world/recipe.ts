// Recipe helpers (S25) — modulové recepty pro repair/build.
// FVP KISS (S26): bez subtypů, ploché Solids/Fluids.
// S28: bay-layered recepty (BAY_DEFS skeleton/covered) retirovány s layered bay axiomem.
// S29: katalog drží TOTAL hodnoty (full build cost), runtime API nadále pracuje
//      s per-HP rate × scale (hp_delta). Převod total → per-HP = total / hp_max.

import type { World, Task, ResourceRecipe } from "../model";
import { MODULE_DEFS } from "../model";
import { RECIPE_MIN_HP_EPSILON } from "../tuning";
import { recordFlow } from "./flow";

// Vrátí per-HP recipe pro target tasku (modul). null = no recipe (eternal/service
// nebo neznámý target). Převádí katalog total → per-HP = total / hp_max.
export function getTaskRecipe(w: World, task: Task): ResourceRecipe | null {
  if (task.target.moduleId === undefined) return null;
  const mod = w.modules[task.target.moduleId];
  if (!mod) return null;
  const def = MODULE_DEFS[mod.kind];
  if (def.max_hp <= 0) return null;
  return {
    solids: (def.recipe.solids ?? 0) / def.max_hp,
    fluids: (def.recipe.fluids ?? 0) / def.max_hp,
  };
}

// Vrátí jméno první chybějící kategorie ("Solids" / "Fluids") nebo null.
// S26 FVP KISS: dvě ploché suroviny, bez subtypů.
export function whichResourceMissing(w: World, recipe: ResourceRecipe, scale: number): string | null {
  if ((recipe.solids ?? 0) * scale > w.resources.solids) return "Solids";
  if ((recipe.fluids ?? 0) * scale > w.resources.fluids) return "Fluids";
  return null;
}

// Spotřebuj recipe × scale ze zdrojů (clamp 0+) + zaznamenej do flow history.
export function consumeResources(w: World, recipe: ResourceRecipe, scale: number): void {
  if (recipe.solids) {
    const amount = recipe.solids * scale;
    const taken = Math.min(w.resources.solids, amount);
    w.resources.solids = Math.max(0, w.resources.solids - amount);
    recordFlow(w, "solids", "out", taken);
  }
  if (recipe.fluids) {
    const amount = recipe.fluids * scale;
    const taken = Math.min(w.resources.fluids, amount);
    w.resources.fluids = Math.max(0, w.resources.fluids - amount);
    recordFlow(w, "fluids", "out", taken);
  }
}

// Najde první chybějící kategorii napříč všemi non-finished repair tasky. null = vše OK.
// Slouží protocolTicku pro globální material gate + monitor label důvod.
export function firstMissingRecipeCategory(w: World): string | null {
  for (const t of w.tasks) {
    if (t.kind !== "repair") continue;
    if (t.status === "completed" || t.status === "failed") continue;
    const recipe = getTaskRecipe(w, t);
    if (!recipe) continue;
    const missing = whichResourceMissing(w, recipe, RECIPE_MIN_HP_EPSILON);
    if (missing) return missing;
  }
  return null;
}
