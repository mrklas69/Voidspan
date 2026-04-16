// Work model — derived view (S23 work eureka).
//
// Work: dvě osy — kapacita (Wh, jak dlouho vydržíme) a výkon (W, jak rychle).
// Hráči: kapacita = HP, výkon = actor.work.
// Drony: kapacita = E základny, výkon = 1 W/dron. Funkční jen pokud E > 0.
//
// S24 ladění: powerAvailable/Used/Total — aktuálně disponibilní vs. čerpaný výkon.
// Top Bar W ukazuje „available / total" (kolik právě mám / kolik celkem) — 0/23
// při plně pracujících dronech, 23/23 když nepracují.

import type { World } from "../model";
import { isProductiveTask } from "../model";

export function computeWork(w: World): {
  capMax: number; capPlayer: number; capDrone: number;
  powerMax: number; powerPlayer: number; powerDrone: number;
  powerUsed: number; powerAvailable: number;
} {
  let capPlayer = 0;
  let powerPlayer = 0;
  for (const a of w.actors) {
    if (a.state === "dead" || a.state === "cryo") continue;
    capPlayer += a.hp;
    powerPlayer += a.work;
  }
  const droneOnline = w.resources.energy > 0;
  const capDrone = droneOnline ? w.drones : 0;
  const powerDrone = droneOnline ? w.drones : 0;
  const powerMax = Math.round(powerPlayer + powerDrone);

  // Kolik W se reálně čerpá na aktivních tascích.
  // Hráčský příspěvek: actors ve state "working". Dronový: w.drones pokud E > 0
  // a existuje aspoň jeden active task (FVP: jeden active task čerpá celou kapacitu 23 W).
  let playerUsed = 0;
  for (const a of w.actors) {
    if (a.state === "working") playerUsed += a.work;
  }
  const droneUsed = droneOnline && w.tasks.some(isProductiveTask) ? w.drones : 0;
  const powerUsed = playerUsed + droneUsed;
  const powerAvailable = Math.max(0, powerMax - powerUsed);

  return {
    capMax: Math.round(capPlayer + capDrone),
    capPlayer: Math.round(capPlayer),
    capDrone,
    powerMax,
    powerPlayer: Math.round(powerPlayer),
    powerDrone,
    powerUsed,
    powerAvailable,
  };
}
