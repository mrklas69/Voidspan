// Damage utility (init time) — wear + 1 critical damage.
// Volá se z createInitialWorld; čisté funkce nad segmentem + modules.

import type { Bay, Module } from "../model";
import { WEAR_MIN, WEAR_MAX, START_DAMAGE_HP_RATIO } from "../tuning";
import { randFloat, shuffleInPlace } from "./random";

// Aplikuje random wear na všechny moduly. Bay vrstvy (void) nemají HP.
export function applyLightWear(_segment: Bay[], modules: Record<string, Module>): void {
  for (const mod of Object.values(modules)) {
    mod.hp = Math.round(mod.hp_max * randFloat(WEAR_MIN, WEAR_MAX));
  }
}

// Vybere 1 náhodný modul a aplikuje critical poškození (10–20 % HP).
// Cíl: Observer hned při startu vidí, co opravit; autopilot reaguje.
export function applyRandomDamages(_segment: Bay[], modules: Record<string, Module>): void {
  const modIds = Object.keys(modules);
  if (modIds.length === 0) return;
  shuffleInPlace(modIds);
  const mod = modules[modIds[0]!];
  if (!mod) return;
  const [lo, hi] = START_DAMAGE_HP_RATIO;
  const pct = randFloat(lo, hi);
  mod.hp = Math.round(mod.hp_max * pct);
}
