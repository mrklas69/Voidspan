// Read-only dotazy nad bay vrstvou — outer HP + trajectory pro UI.
// Po S28 retire layered bay: HP žije výhradně na Module (module_root/ref).

import type { World } from "../model";

// === Outer HP helper — čte HP modulu pod indexem (pokud tam je) ===

export type OuterHP = { hp: number; hp_max: number; label: string } | null;

export function getOuterHP(w: World, bayIdx: number): OuterHP {
  const bay = w.segment[bayIdx];
  if (!bay) return null;
  if (bay.kind === "void") return null;
  const mod = w.modules[bay.moduleId];
  if (!mod) return null;
  return { hp: mod.hp, hp_max: mod.hp_max, label: mod.kind };
}

// === Task trajectory helper — pro render (orange/green/red overlay) ===

export type Trajectory = "rising" | "falling" | "static";

// Zjistí trajektorii HP modulu pod bayem na základě aktivních tasků.
//   repair/build task s assigned actors → rising (HP roste)
//   demolish task s assigned → falling (HP klesá)
//   void nebo žádný task → static
export function getBayTrajectory(w: World, bayIdx: number): Trajectory {
  const bay = w.segment[bayIdx];
  if (!bay || bay.kind === "void") return "static";

  const moduleId = bay.moduleId;
  for (const task of w.tasks) {
    if (task.assigned.length === 0) continue;
    if (task.target.moduleId !== moduleId) continue;
    if (task.kind === "repair" || task.kind === "build") return "rising";
    if (task.kind === "demolish") return "falling";
  }
  return "static";
}
