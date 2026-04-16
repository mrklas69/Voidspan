// Production tick — energy bilance per tick (slot 7).
// Online moduly: power_w > 0 = produkce, power_w < 0 = spotřeba.
// Axiom: výkon je násoben koeficientem HP/HP_MAX (100% jen bezvadný modul).
// Drony spotřebovávají E (1 dron = 1 W) při práci na productive tasku — symetrie
// E↔W (S23 work eureka). Instalované SW (QuarterMaster, …) mají kontinuální
// příkon bez ohledu na tasky. Při E=0 drony i SW přechází offline → feedback
// loop: drony/SW → E drain → E=0 → offline → recovery → boot.
// Energie se akumuluje do w.resources.energy, clamp [0, energyMax].
// Při dosažení 0 se emituje DRN:CRIT jednorázově + všechny running SW → offline.

import type { World } from "../model";
import { MODULE_DEFS, isProductiveTask } from "../model";
import { TICKS_PER_GAME_DAY } from "../tuning";
import { appendEvent } from "../events";

// Dynamická kapacita baterie — Σ capacity_wh online modulů.
// Exportováno pro UI (header, info_panel).
// HP ratio axiom: kapacita × HP/HP_MAX (poškozená baterie drží míň).
export function computeEnergyMax(w: World): number {
  let cap = 0;
  for (const mod of Object.values(w.modules)) {
    if (mod.status !== "online") continue;
    const hpRatio = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
    cap += (MODULE_DEFS[mod.kind].capacity_wh ?? 0) * hpRatio;
  }
  return Math.round(cap);
}

export function productionTick(w: World): void {
  // Přepočítej kapacitu (modul může jít offline decay → kapacita klesne).
  w.energyMax = computeEnergyMax(w);

  let netPower = 0;
  for (const mod of Object.values(w.modules)) {
    if (mod.status !== "online") continue;
    const hpRatio = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
    netPower += MODULE_DEFS[mod.kind].power_w * hpRatio;
  }
  const hasEnergy = w.resources.energy > 0;
  const droneDraw = hasEnergy && w.tasks.some(isProductiveTask) ? w.drones : 0;
  // Software load — každý running SW čerpá svůj draw_w (kontinuálně).
  let softwareDraw = 0;
  if (hasEnergy) {
    for (const sw of Object.values(w.software)) {
      if (sw.status === "running") softwareDraw += sw.draw_w;
    }
  }
  // W → Wh per tick: energy_delta = netPower / ticks_per_game_hour.
  // 1 game hour = TICKS_PER_GAME_DAY / 16 ticků.
  const ticksPerHour = TICKS_PER_GAME_DAY / 16;
  const delta = (netPower - droneDraw - softwareDraw) / ticksPerHour;
  const before = w.resources.energy;
  w.resources.energy = Math.max(0, Math.min(w.energyMax, w.resources.energy + delta));

  // E→0 blackout event (jednorázově při transition pro Event Log čitelnost).
  if (before > 0 && w.resources.energy <= 0) {
    appendEvent(w, "DRN", { csq: "CRIT", item: "energy", text: "Energie vyčerpána" });
  }
  // SW state sync — state-based, ne transition-based. Offline když E=0,
  // running když E>0. Emituje event jen při změně, aby Event Log nespamoval.
  const powered = w.resources.energy > 0;
  for (const sw of Object.values(w.software)) {
    if (!powered && sw.status === "running") {
      sw.status = "offline";
      appendEvent(w, "DRN", {
        csq: "CRIT",
        item: sw.id,
        text: `${sw.name} ${sw.version}: kritické selhání — autopilot offline`,
      });
    } else if (powered && sw.status === "offline") {
      sw.status = "running";
      appendEvent(w, "BOOT", {
        item: sw.id,
        text: `${sw.name} ${sw.version}: napájení obnoveno — boot`,
      });
    }
  }
}
