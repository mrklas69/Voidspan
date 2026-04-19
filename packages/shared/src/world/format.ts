// Formátovače herního času + popisovače tasků.
// Žádný state — čisté funkce nad World/Task.

import type { World, Task } from "../model";
import { TICKS_PER_GAME_DAY, TICKS_PER_WALL_MINUTE } from "../tuning";

// Bez prefixu — formát "0.00:00" (day.hh:mm). Pro Top Bar header existuje
// `formatGameTime` s prefixem "T:" (drží sémantický rozdíl od běžných čísel).
//
// DVĚ ČASOVÉ OSY (FVP, S39):
//   - T: session elapsed — 16h „game day" (pace mechaniky, decay rate, flow window).
//   - date_cs kalendář (viz formatGameDateCs níže) — 24h, base 2387-04-25.09:24.
//
// Obě startují na tick=0, ale od prvního day rolu divergují (16h vs 24h). Nesoulad
// je očekávatelný — v persistent serveru (Osa 2 roadmap) bude datum nahrazeno
// reálným serverovým časem (zakládání kolonií v real-world time), T osa zmizí.
export function formatGameTimeShort(tick: number): string {
  const gameMin = Math.floor(tick / TICKS_PER_WALL_MINUTE);
  const day = Math.floor(gameMin / (16 * 60));
  const minInDay = gameMin % (16 * 60);
  const hh = String(Math.floor(minInDay / 60)).padStart(2, "0");
  const mm = String(minInDay % 60).padStart(2, "0");
  return `${day}.${hh}:${mm}`;
}

// Verze s prefixem "T:" — pro Top Bar header (kontextuální tag mezi version + adresa + čas).
export function formatGameTime(tick: number): string {
  return `T:${formatGameTimeShort(tick)}`;
}

// Kalendářní datum formátu "YYYY-MM-DD.HH:MM" pro milestone date_cs.
// Base = repairs seed (2387-04-25.09:24). Každý tick = 1 game minute
// (TIME_COMPRESSION 1×). Date API handle měsíc/den roll-over correctly.
//
// Pozn.: T (viz formatGameTimeShort) a tato kalendářová osa jsou **dvě různé
// časové osy** — 16h game day vs. 24h kalendář. V persistent serveru (Osa 2)
// bude kalendář nahrazen reálným serverovým časem (real-world datum kolonie).
const GAME_START_CALENDAR = {
  year: 2387,
  month: 4,   // April (1-indexed)
  day: 25,
  hour: 9,
  minute: 24,
};

export function formatGameDateCs(tick: number): string {
  const gameMin = Math.floor(tick / TICKS_PER_WALL_MINUTE);
  const baseMs = Date.UTC(
    GAME_START_CALENDAR.year,
    GAME_START_CALENDAR.month - 1, // Date API: 0-indexed month
    GAME_START_CALENDAR.day,
    GAME_START_CALENDAR.hour,
    GAME_START_CALENDAR.minute,
  );
  const d = new Date(baseMs + gameMin * 60_000);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${mo}-${dd}.${hh}:${mm}`;
}

// S24: ETA formát "12d14h12m" — herní dny/hodiny/minuty.
// 1 game minute = 1 wall minute (TIME_COMPRESSION 1×); 1 tick = TICKS_PER_WALL_MINUTE / 60 wall min.
// Přeloženo: 1 tick = 1/TICKS_PER_WALL_MINUTE wall min = 1/TICKS_PER_WALL_MINUTE game min.
export function formatEta(ticks: number): string {
  if (!Number.isFinite(ticks) || ticks <= 0) return "—";
  const gameMin = Math.floor(ticks / TICKS_PER_WALL_MINUTE);
  const days = Math.floor(gameMin / (16 * 60));
  const remMin = gameMin - days * 16 * 60;
  const hours = Math.floor(remMin / 60);
  const mins = remMin % 60;
  if (days > 0) return `${days}d${hours}h${mins}m`;
  if (hours > 0) return `${hours}h${mins}m`;
  return `${mins}m`;
}

// S24: ETA ticků pro task (zbývající WD / current power). ∞ (Infinity) když paused/no power.
export function taskEtaTicks(w: World, task: Task): number {
  if (task.status !== "active") return Infinity;
  let playerPower = 0;
  for (const aid of task.assigned) {
    const a = w.actors.find((x) => x.id === aid);
    if (a && a.state === "working") playerPower += a.work;
  }
  const dronePower = w.resources.energy > 0 ? w.drones : 0;
  const powerSum = playerPower + dronePower;
  if (powerSum <= 0) return Infinity;
  const remainingWd = Math.max(0, task.wd_total - task.wd_done);
  return (remainingWd * TICKS_PER_GAME_DAY) / powerSum;
}

// S24: lidský popis task targetu pro UI řádek.
// „SolarArray (m_solar_1)" / „Bay [1,3]" / „QuarterMaster v2.3 — Active" (eternal).
export function describeTaskTarget(w: World, task: Task): string {
  if (task.label) return task.label;
  if (task.kind === "service") return `Service ${task.id}`;
  if (task.target.moduleId !== undefined) {
    const mod = w.modules[task.target.moduleId];
    return mod ? `${mod.kind} (${mod.id})` : `Module ${task.target.moduleId}`;
  }
  if (task.target.bayIdx !== undefined) {
    const row = Math.floor(task.target.bayIdx / 8);
    const col = task.target.bayIdx % 8;
    return `Bay [${row},${col}]`;
  }
  if (task.target.buildSpec) return `Build ${task.target.buildSpec}`;
  return task.id;
}

// Substantivum ženského rodu — gramatickou shodu s gender-flexibilními
// prefixy (Zahájena/Pozastavena/Obnovena/Dokončena {noun}), všechny varianty
// v FVP (oprava/stavba/demolice) jsou ženské. Lokace (moduleId) je v [Kde]
// hlavičce eventu, text se neopakuje.
const TASK_NOUN_CS: Record<string, string> = {
  repair: "oprava",
  demolish: "demolice",
  build: "stavba",
  service: "sledování",
};

export function taskActionCs(task: Task): string {
  return TASK_NOUN_CS[task.kind] ?? task.kind;
}
