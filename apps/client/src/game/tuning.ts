// Voidspan tuning (S20) — centrální zdroj pravdy pro všechny laditelné parametry P1 POC.
// Axiom: jedno místo pro seed hodnoty, prahy, rozsahy, časování. Playtest kalibrace
// se řeší pouze tady. `world.ts` a další moduly importují z `tuning.ts`, nikdy
// nedefinují vlastní magic number.
//
// Struktura:
//   §1 Časování (tick, compression, pace)
//   §2 Zdroje — seedy a drain per-tick
//   §3 HP axiom (S18) — max HP vrstev, WD konverze
//   §4 Startovní wear + damages
//   §5 Energy (W/WD)
//
// Barvy/paleta mají vlastní zdroj pravdy v `palette.ts` (sémanticky odlišná osa).

// ============================================================================
// §1 Časování
// ============================================================================

// Logický tick herního engine — 4×/s. Render je na rAF, tick je pevný interval.
export const TICK_MS = 250;
export const TICKS_PER_SECOND = 1000 / TICK_MS;

// Herní den = 16 game hours (Q-Day-Length provisional). Ticků za game day drží
// pace mechaniky (drain rates). S18 CAL-T1: TIME_COMPRESSION 1× — 1 game min = 1 wall min.
// TICKS_PER_GAME_DAY zůstává jako "pace constant", ne calendar constant.
export const TICKS_PER_GAME_DAY = 960;

// Display tiká jen jednou za 60 s wall (viz formatGameTime). 240 ticků = 1 wall min.
export const TICKS_PER_WALL_MINUTE = TICKS_PER_SECOND * 60;

// ============================================================================
// §2 Zdroje — seedy a drain
// ============================================================================

// Startovní zdroje kolonie (Q-P1 CAL-B3).
export const SEED_FOOD = 40;        // slab.food — 8 osob × 5 game days
export const SEED_AIR = 100;        // flux.air — 100 % při startu
export const SEED_COIN = 20;        // Kredo — CAL-B2 dock cost budget

// ============================================================================
// §3 HP axiom (S18) — layered bay vrstvy a WD konverze
// ============================================================================

// HP_MAX v řádech stovek — monotónně vzestupně přes vrstvy (skeleton < covered < module).
// Module HP_MAX je v `model.ts` MODULE_DEFS tabulce (per module kind).
export const SKELETON_HP_MAX = 380;
export const COVERED_HP_MAX = 500;

// WD_PER_HP = kolik work-day jednotek stojí oprava 1 HP.
// Kalibrace P1: s HP_MAX v řádech stovek drží repair task desítky WD, což je
// řádově jednotky minut wall-time pro 1 Constructora (12 W). Playtest doladí.
export const WD_PER_HP = 0.05;

// ============================================================================
// §4 Startovní wear + damages (createInitialWorld)
// ============================================================================

// Lehké opotřebení všech komponent — HP ∈ [WEAR_MIN × hp_max, WEAR_MAX × hp_max].
export const WEAR_MIN = 0.85;
export const WEAR_MAX = 1.0;

// Kolik náhodných komponent dostane větší poškození při startu.
// Rozsahy níže musí mít stejnou délku, jinak damages over-/under-apply.
export const START_DAMAGES_COUNT = 3;

// HP rozsahy (poměr hp_max) pro tři poškození při startu. Index = severity:
//   0 → critical, 1 → medium, 2 → minor.
export const CRITICAL_RANGE: readonly [number, number] = [0.10, 0.20];
export const MEDIUM_RANGE: readonly [number, number]   = [0.40, 0.60];
export const MINOR_RANGE: readonly [number, number]    = [0.75, 0.90];

// ============================================================================
// §5 Energy (W/WD)
// ============================================================================

// Startovní energie (Wh). Solar Array dobíjí při světlu.
// Seed drží přeshraniční hru: 12 Wh ≈ 1 hodina provozu minimal crew.
// Kapacita baterie je dynamická — Σ capacity_wh online modulů (viz World.energyMax).
export const ENERGY_SEED = 12;

// ============================================================================
// §6 Decay — entropie (S21)
// ============================================================================

// HP drain per game day jako podíl hp_max. Všechny vrstvy (skeleton, covered, module).
// 0.01 = 1% hp_max per game day → SolarArray (500 HP) ztrácí 5 HP/den → 0 za ~100 dní.
export const DECAY_RATE_PER_GAME_DAY = 0.01;

// ============================================================================
// §7 Aktéři (S21)
// ============================================================================

// HP aktéra — baseline. 100 = plné zdraví.
export const ACTOR_HP_MAX = 100;

// HP drain per tick při nedostatku (air=0 nebo food=0).
// 100 HP / (1 game hour = 240 ticků) ≈ smrt za 1 herní hodinu bez zdrojů.
export const ACTOR_HP_DRAIN_PER_TICK = ACTOR_HP_MAX / (TICKS_PER_GAME_DAY / 16);

// ============================================================================
// §7 Status tree prahy (S20/S21)
// ============================================================================

// Dashboard semafor: pod CRIT = red, pod WARN = orange, nad = green.
// Sdíleno mezi Status tree (world.ts) a UI barvami (palette.ts).
export const THRESHOLD_CRIT_PCT = 15;
export const THRESHOLD_WARN_PCT = 40;

// ============================================================================
// §8 Event Log (S20)
// ============================================================================

// Ring buffer kapacita — max počet událostí v paměti. Přetečení = shift nejstarší.
export const EVENT_LOG_CAPACITY = 500;

// ============================================================================
// §9 Tooltip seznamy (S22)
// ============================================================================

// Max položek v tooltip rozpisech (Energie příjmy/výdaje, atd.).
// Delší seznamy se oříznou na N prvních + "... +M dalších".
export const TOOLTIP_LIST_MAX_ITEMS = 5;
