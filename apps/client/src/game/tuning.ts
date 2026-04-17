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
// S26 FVP KISS: subtypy (metal/components/water/coolant) odloženy na P2+.
// FVP drží ploché Solids/Fluids — dvě generické suroviny pokrývají celou osu.
// Kalibrace: SEED_SOLIDS = dřívější metal+components; SEED_FLUIDS = water+coolant.
export const SEED_SOLIDS = 90;      // ploché Solids (repair/build material)
export const SEED_FLUIDS = 50;      // ploché Fluids (chladicí/provozní média)
export const SEED_COIN = 20;        // Coin (◎) — CAL-B2 dock cost budget

// Max kapacita S/F — FVP fix 100 (KISS). P2+ Storage-based (Σ capacity_s modulů).
export const SOLIDS_MAX = 100;
export const FLUIDS_MAX = 100;

// Rolling window pro KPI flow metriky (Příjmy/Výdaje/Bilance) — počet game days
// nazad, ze kterých se průměruje. Denní ring buffer: 1 bucket per game day,
// shift při přechodu game day, avg = sum(filled buckets) / count (ignoruje
// ještě nezaplněné dny — viz @THINK A4). Obecný flow pattern, platí pro S/F
// i budoucí Coin/population/XP metriky.
export const FLOW_WINDOW_GAME_DAYS = 10;

// ============================================================================
// §3 HP axiom (S28 KISS — void ↔ module, retire S18 layered bay)
// ============================================================================

// Module HP_MAX je v `model.ts` MODULE_DEFS tabulce (per module kind).
// Bay vrstvy (skeleton/covered) retirovány v S28 — void se staví rovnou na modul.
// HP žije výhradně na Module instanci.

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

// Při startu jeden critical hit — Observer hned vidí, co opravit (autopilot reaguje).
// Medium/minor severity dropnuty (S28 KISS) — wear (85–100 %) drží přirozenou variaci HP.
export const START_DAMAGE_HP_RATIO: readonly [number, number] = [0.10, 0.20];

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

// HP drain per game day jako podíl hp_max.
// S29: 150× zpomaleno (z 0.01 na 0.0000667) — continuous decay drží pouze pozadí
// (~1 % HP / 10 h wall), reálné poškození přichází vzácnými asteroid hity
// (scheduledEvents slot 9). Axiom: entropie v kosmu existuje, ale je dominována
// diskrétními událostmi, ne monotónním drainem.
export const DECAY_RATE_PER_GAME_DAY = 0.0000667;

// Asteroid scripted event — rate + damage range. Rate = pravděpodobnost per tick.
// 1× / 10 h wall = 1× / 144 000 ticků (při TICK_MS 250, 960 ticků/game day,
// 150 game days = 10 h wall). Stochastické — nevyžaduje per-tick cooldown state.
export const ASTEROID_HIT_PROB_PER_TICK = 1 / 144_000;
// HP ratio damage: uniform random v rozsahu [min, max] × hp_max.
export const ASTEROID_DAMAGE_HP_RATIO: readonly [number, number] = [0.05, 0.20];
// Vizuální flash na postiženém modulu (segment renderer) — 600 ms wall = 3 ticky.
export const ASTEROID_FLASH_TICKS = 3;

// ============================================================================
// §7 Aktéři (S21)
// ============================================================================

// HP aktéra — baseline. 100 = plné zdraví.
export const ACTOR_HP_MAX = 100;

// HP drain per tick při nedostatku (wake-up + HOMELESS mechanika, R2).
// 100 HP / (1 game hour = 240 ticků) ≈ smrt za 1 herní hodinu bez zázemí.
// V FVP nepoužito (posádka drží cryo) — seed pro R2 kalibraci.
export const ACTOR_HP_DRAIN_PER_TICK = ACTOR_HP_MAX / (TICKS_PER_GAME_DAY / 16);

// Počet členů posádky v cryo na startu (S26). Vazba: kapacita MedCore = 32
// cryolůžek. FVP drží všech 32 v cryo, hráč = jeden z nich (id=`player`),
// ostatních 31 jako `colonist_01..31`. Probuzení přijde s wake-up mechanismem.
export const SEED_CREW_CRYO = 32;

// Počet pracovních dronů (fixní číslo, nemá HP). Drones = převodník E→WD,
// 1 drone = 1 W při práci na productive tasku. Seed držíme na 23, aby QM
// zvládal typický repair backlog (1-2 aktivní tasky paralelně).
export const SEED_DRONES = 23;

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

// ============================================================================
// §10 QuarterMaster (S24) — autopilot kolonie
// ============================================================================

// Startovní verze Protokolu. Upgrade přes výzkum (P2+).
export const PROTOCOL_VERSION = "v2.3";

// Příkon QuarterMaster v2.3 — kontinuální odběr v W (nezávisle na aktivních
// úkolech). Budoucí verze budou mít jinou spotřebu (v3.x Integrated Defense
// pravděpodobně dražší, v4.x Energy-aware balancing pravděpodobně úspornější).
export const QM_DRAW_W = 0.86;

// Per-HP resource cost (S25 → recipes): retirováno. Spotřeba opravy je teď
// per-target rate definovaný v `ModuleDef.recipe` / `BAY_DEFS[*].recipe`
// (model.ts). Repair task drénuje `recipe × hp_delta` z příslušných subtypů
// Solids/Fluids; protocolTick gate-uje na disponibilitě recipe komponent.
//
// Epsilon pro „can-progress" check v protocolTick — minimální HP delta,
// pro kterou musí být materiál k dispozici (jinak pauza).
export const RECIPE_MIN_HP_EPSILON = 0.01;

// Per-capita drain (S25): air + food retirovány v KISS pass — žádný drain v FVP.
// Mechanism slot 2 zůstává prázdný stub. Až přijde wake-up + jídlo jako item
// registr (P2+), zde přidat per-actor consumption rate edible bucketu (water?).

// Rating prahy pro Protokol gate.
// Pause:  E rating ≤ PROTOCOL_PAUSE_RATING (= 2 Slabá, < 40%) — orange/red zóna.
// Resume: E rating ≥ PROTOCOL_RESUME_RATING (= 4 Dobrá, ≥ 60%) — cyan/green zóna.
// Reálná hystereze 40–60% (amber pásmo): při PAUSE zůstává paused dokud E
// nedosáhne ≥60%; při RESUME zůstává active dokud E neklesne <40%. Zabrání
// flappingu na hraně rating bucketu (S25 — drony čerpají E v productionTick,
// bez hystereze cyklus drone-on → E drop → drone-off → E rise → ...).
export const PROTOCOL_RESUME_RATING = 4;
export const PROTOCOL_PAUSE_RATING = 2;

// Autoclean completed/failed tasks — 1 h wall = 14400 ticků (při TICK_MS 250).
export const TASK_AUTOCLEAN_TICKS = TICKS_PER_SECOND * 3600;
