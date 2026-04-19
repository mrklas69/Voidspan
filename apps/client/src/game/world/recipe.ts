// Recipe helpers (S25) — modulové recepty pro repair/build.
// FVP KISS (S26): bez subtypů, ploché Solids/Fluids.
// S28: bay-layered recepty (BAY_DEFS skeleton/covered) retirovány s layered bay axiomem.
// S29: katalog drží TOTAL hodnoty (full build cost), runtime API nadále pracuje
//      s per-HP rate × scale (hp_delta). Převod total → per-HP = total / hp_max.

import type { World, Task, ResourceRecipe } from "../model";
import { MODULE_DEFS } from "../model";
import { RECIPE_MIN_HP_EPSILON, TICKS_PER_GAME_DAY, WD_PER_HP, SOLIDS_MAX, FLUIDS_MAX } from "../tuning";
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

// Vrať recipe × scale do skladu (clamp SOLIDS_MAX / FLUIDS_MAX) + zaznamenej
// flow jako „in". Opak consumeResources — používá demolish completion pro
// resource recovery. Overflow se ztratí (žádný sklad navíc nemáme).
export function returnResources(w: World, recipe: ResourceRecipe, scale: number): void {
  if (recipe.solids) {
    const amount = recipe.solids * scale;
    const added = Math.min(SOLIDS_MAX - w.resources.solids, amount);
    w.resources.solids = Math.min(SOLIDS_MAX, w.resources.solids + amount);
    recordFlow(w, "solids", "in", Math.max(0, added));
  }
  if (recipe.fluids) {
    const amount = recipe.fluids * scale;
    const added = Math.min(FLUIDS_MAX - w.resources.fluids, amount);
    w.resources.fluids = Math.min(FLUIDS_MAX, w.resources.fluids + amount);
    recordFlow(w, "fluids", "in", Math.max(0, added));
  }
}

// Odhad reálné HP delty per tick, kterou by repair task získal při aktuálním
// workforce poolu (drony × E + alive actors × work). Sdílí logiku s
// progressTasks — jediný zdroj pravdy pro "kolik materiálu tick sežere".
// Floor = RECIPE_MIN_HP_EPSILON (safety při powerSum=0 — drží protokol
// konzistentní i v degenerovaném stavu, kdy by gate jinak vracel 0 missing).
export function estimateRepairHpDeltaPerTick(w: World): number {
  const droneW = w.resources.energy > 0 ? w.drones : 0;
  let actorW = 0;
  for (const a of w.actors) {
    if (a.state === "dead" || a.state === "cryo") continue;
    if (a.hp <= 0) continue;
    actorW += a.work;
  }
  const powerSum = droneW + actorW;
  if (powerSum <= 0) return RECIPE_MIN_HP_EPSILON;
  const wd_delta = powerSum / TICKS_PER_GAME_DAY;
  return Math.max(wd_delta / WD_PER_HP, RECIPE_MIN_HP_EPSILON);
}

// Najde první chybějící kategorii napříč všemi non-finished repair tasky. null = vše OK.
// Slouží protocolTicku pro globální material gate + monitor label důvod.
// Scale = reálná hp_delta per tick, aby protokol a progressTasks používaly stejný
// práh (dřív EPSILON=0.01 vs. skutečné ~0.48 → pauza neproběhla, ale progress
// stál → "tichý zámek", bar vypadal aktivní).
export function firstMissingRecipeCategory(w: World): string | null {
  const scale = estimateRepairHpDeltaPerTick(w);
  for (const t of w.tasks) {
    if (t.kind !== "repair") continue;
    if (t.status === "completed" || t.status === "failed") continue;
    const recipe = getTaskRecipe(w, t);
    if (!recipe) continue;
    const missing = whichResourceMissing(w, recipe, scale);
    if (missing) return missing;
  }
  return null;
}
