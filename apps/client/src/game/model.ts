// Datový model — layered bay axiom (S18).
//
// **Layered bay axiom:** každý bay má vrstvový stack:
//   void → skeleton → covered → module
// Vnější vrstva je jediná, která se renderuje a má HP. Vnitřní vrstvy
// logicky existují (při zničení vnější vrstvy se odhalí další), ale HP
// se u nich nesleduje — nové odhalení startuje na HP_MAX.
//
// Axiom nelze stavět na poškozeném základu: stavba začíná povinnou
// opravou stávající vnější vrstvy, pak teprve přibývá nová.
//
// Indexace segmentu: 2 řady × 8 sloupců, row-major → idx = row*8 + col.

// === Event Log System (S20 kánon, GLOSSARY §Event Log System) ===

export type EventVerb =
  | "BOOT" | "SPWN" | "DEAD" | "ARRV" | "DPRT"
  | "REPR" | "BLD"  | "DEMO" | "DMG"  | "DECY"
  | "DRN"  | "PROD" | "HAUL" | "ASSN" | "CMPL"
  | "FAIL" | "IDLE" | "WAKE" | "DOCK" | "TICK"
  | "SIGN" | "EVNT" | "SAY"  | "RPRT"
  | "TASK"; // S24 — task status change (START/PAUSE/RESUME), QuarterMaster

export type EventCsq = "OK" | "FAIL" | "PARTIAL" | "CRIT" | "START" | "PAUSE" | "RESUME";

export type EventSeverity = "crit" | "warn" | "pos" | "neutral";

export type Event = {
  tick: number;
  verb: EventVerb;
  csq?: EventCsq;
  loc?: string;
  actor?: string;
  item?: string;
  amount?: number;
  target?: string;
  text?: string;
  severity: EventSeverity;
};

// === Fáze ===

// Perpetual Observer axiom (S20→S21): win/loss retirováno. Simulace běží perpetuálně.
// boot = inicializace (jeden tick), running = perpetuální simulace.
export type Phase = "boot" | "running";

// === Cover variant ===
// Plášť má 5 vizuálních variant (cover1.png – cover5.png). Uloženo na bay
// (ne na modulu), aby každý bay pod modulem mohl mít svou vlastní variantu
// — při demolici se odhalí různorodý mix.
export type CoverVariant = 1 | 2 | 3 | 4 | 5;

// === Bay (políčko 1×1 v segmentu) ===
//
// Tagged union. TypeScript umí narrowing přes `bay.kind` → bezpečný switch.
// HP žije jen na vnější vrstvě:
//   - void: žádné HP, žádný render (hvězdy prosvítají)
//   - skeleton: hp + hp_max (vnější = kostra)
//   - covered: hp + hp_max + variant (vnější = plášť)
//   - module_root: cover variant se pamatuje pod modulem; HP žije na Module
//   - module_ref: projekce multi-bay modulu, variant pod zakrytá
export type Bay =
  | { kind: "void" }
  | { kind: "skeleton"; hp: number; hp_max: number }
  | { kind: "covered"; hp: number; hp_max: number; variant: CoverVariant }
  | { kind: "module_root"; moduleId: string; coverVariant: CoverVariant }
  | { kind: "module_ref"; moduleId: string; rootOffset: { dx: number; dy: number }; coverVariant: CoverVariant };

// === Modul: definice (katalog) + instance (stav ve světě) ===

export type ModuleKind =
  | "SolarArray"
  | "Engine"
  | "Dock"
  | "Habitat"
  | "Storage"
  | "MedCore"
  | "Assembler"
  | "CommandPost";

// Statická definice modulu — jedna na typ, sdílí všechny instance.
// DRY: size/asset/power_w/hp_max se neduplikuje do každé instance.
export type ModuleDef = {
  kind: ModuleKind;
  label: string;
  w: number;
  h: number;
  asset: string;
  power_w: number;
  capacity_wh?: number; // energetická kapacita modulu (baterie). Výchozí 0.
  wd_to_build: number;
  wd_to_demolish: number;
  cost_coin: number;
  max_hp: number; // HP_MAX — viz tabulka dole (hundreds, monotónně vzestupně)
  description: string;
};

// Instance modulu ve světě. HP žije tady, cover variant pod ním na Bay.
export type Module = {
  id: string;
  kind: ModuleKind;
  rootIdx: number;
  status: "online" | "building" | "demolishing" | "offline";
  hp: number;
  hp_max: number;
  progress_wd: number;
  docked_count?: number;
};

// === Aktér ===
// Player = hráčův avatar. Pracuje → HP klesá, jí → HP roste.
// Drony nejsou aktéři — jsou číslo na World (viz World.drones).

export type ActorKind = "player";

export type ActorDef = {
  kind: ActorKind;
  label: string;
  power_w: number;
  asset: string;
  role: string;
};

// Perpetual Observer Simulation axiom (S20/S21):
//   cryo → idle → working → dead
// cryo = kryospánek, bezpečný stav, žádná spotřeba. Probuzení (WAKE) přes
// cryo failure (energie=0) nebo manuální trigger.
// dead = terminální, aktér zůstává jako záznam, simulace pokračuje.
export type Actor = {
  id: string;
  kind: ActorKind;
  state: "cryo" | "idle" | "working" | "dead";
  hp: number;
  hp_max: number;
  work: number; // pracovní výkon (W) — jak rychle pracuje, ne kolik vydrží
  taskId?: string;
};

// === Task ===

export type TaskKind = "repair" | "demolish" | "build" | "service";

// S24 QuarterMaster: task lifecycle status.
//   pending   — vytvořený, čeká na start (Protokol může držet v gate)
//   active    — běží, čerpá work (drony + hráči)
//   paused    — přerušený Protokolem (E nebo W v červené)
//   completed — dokončený (wd_done >= wd_total)
//   failed    — neproveditelný (target zmizel, resource missing, …)
//   eternal   — service task (QuarterMaster monitor), nedokončí se
export type TaskStatus =
  | "pending" | "active" | "paused" | "completed" | "failed" | "eternal";

export type TaskDef = {
  kind: TaskKind;
  label: string;
  allowed_actors: ActorKind[];
};

export type Task = {
  id: string;
  kind: TaskKind;
  target: {
    bayIdx?: number; // repair skeleton/covered, build
    moduleId?: string; // repair module, demolish, haul
    buildSpec?: ModuleKind;
  };
  wd_total: number;
  wd_done: number;
  assigned: string[];
  priority: number;
  cost_coin?: number;
  // S24 QuarterMaster lifecycle:
  status: TaskStatus;
  createdAt: number;          // tick vzniku (pro řazení + ETA)
  completedAt?: number;       // tick dokončení (completed/failed)
  label?: string;             // override label (pro service tasky — „QuarterMaster v2.3 — Idle")
};

// === Status tree (S20/S21) ===
// Agregace zdraví kolonie. parent = worst child (fraktální semafor).
// Prahy: < 15% = crit, < 40% = warn, ≥ 40% = ok.

export type StatusLevel = "ok" | "warn" | "crit";

// Jednoslovné hodnocení stavu pásu (S21, GLOSSARY).
export type StatusRating = 1 | 2 | 3 | 4 | 5;
export const STATUS_LABELS: Record<StatusRating, { cs: string; en: string }> = {
  5: { cs: "Vynikající", en: "Excellent" },
  4: { cs: "Dobrá", en: "Good" },
  3: { cs: "Dostačující", en: "Fair" },
  2: { cs: "Slabá", en: "Poor" },
  1: { cs: "Selhání", en: "Failure" },
};

export function statusRating(pct: number): StatusRating {
  if (pct >= 80) return 5;
  if (pct >= 60) return 4;
  if (pct >= 40) return 3;
  if (pct >= 15) return 2;
  return 1;
}

// Pyramida vitality (Maslow axiom S20):
//   I.  Aktuální stav    ×8   (crew + base)
//   II. Udržitelnost     ×4   (supplies + integrity)
//   III. Rozvoj          ×2   [P2+ pahýl = 100%]
//   IV. Společnost       ×1   [P2+ pahýl = 100%]
// overall = vážený průměr (I×8 + II×4 + III×2 + IV×1) / 15
// Patro = min(children) — worst child uvnitř patra.

export type StatusNode = {
  pct: number;        // 0..100
  level: StatusLevel;
};

export type Status = {
  overall: StatusNode;
  // Patra pyramidy:
  tier1: StatusNode;       // I.  Aktuální stav = min(crew, base)
  tier2: StatusNode;       // II. Udržitelnost = min(supplies, integrity)
  // Listy:
  crew: StatusNode;        // I.1 — posádka (alive / total)
  base: StatusNode;        // I.2 — základna (avg HP modulů)
  supplies: StatusNode;    // II.1 — zásoby (runway)
  integrity: StatusNode;   // II.2 — integrita (avg HP všech vrstev — bays + moduly)
};

// === Root state ===

export type World = {
  tick: number;
  phase: Phase;
  resources: {
    energy: number;
    slab: { food: number };
    flux: { air: number };
    coin: number;
  };
  segment: Bay[]; // 16 bays (2×8)
  modules: Record<string, Module>;
  actors: Actor[];
  tasks: Task[];
  events: Event[]; // ring buffer, max EVENT_LOG_CAPACITY (tuning.ts)
  status: Status;
  energyMax: number; // Σ capacity_wh online modulů — dynamická kapacita baterie
  drones: number;    // počet pracovních dronů — převodník E→WD, žádný HP
  next_task_id: number;
  // S24 QuarterMaster — autopilot kolonie (runtime Protokolu, GLOSSARY §Protocol).
  protocolVersion: string;   // „v2.3" startovní — upgrade přes výzkum (P2+)
};

// ============================================================================
// KATALOG — statické definice
// ============================================================================
//
// HP_MAX tabulka (S18, layered bay axiom):
//   skeleton       380   nejslabší — holá kostra, vystavená vakuu
//   covered        500   plášť (průměr — varianty mohou mít vlastní tuning později)
//   SolarArray     500   křehké panely
//   Storage        650   jen stěny a bedny
//   Habitat        700   obytná kapsle
//   MedCore        800   redundantní systémy
//   Assembler      850   těžká výroba
//   CommandPost    900   pancéřovaný můstek
//   Dock          1000   těžká přetlaková komora
//   Engine        1240   nejpevnější
// Monotónní, „hmotnost + kritičnost". Playtest ladí.

export const MODULE_DEFS: Record<ModuleKind, ModuleDef> = {
  SolarArray: {
    kind: "SolarArray",
    label: "Solar Array",
    w: 1,
    h: 1,
    asset: "solar_array.png",
    power_w: 24,
    capacity_wh: 80,
    wd_to_build: 20,
    wd_to_demolish: 10,
    cost_coin: 8,
    max_hp: 500,
    description: "Solární panel s integrovaným akumulátorem 80 Wh.",
  },
  Engine: {
    kind: "Engine",
    label: "Engine",
    w: 2,
    h: 2,
    asset: "engine.png",
    power_w: 0,

    wd_to_build: 80,
    wd_to_demolish: 60,
    cost_coin: 30,
    max_hp: 1240,
    description: "Nefunkční zbytek startovního motoru. K demontáži pro získání místa.",
  },
  Dock: {
    kind: "Dock",
    label: "Docking Station",
    w: 2,
    h: 2,
    asset: "dock.png",
    power_w: -6,

    wd_to_build: 48,
    wd_to_demolish: 20,
    cost_coin: 20,
    max_hp: 1000,
    description: "Přístaviště flotily. WIN podmínka: ≥1 modul flotily připojen.",
  },
  Habitat: {
    kind: "Habitat",
    label: "Habitat",
    w: 1,
    h: 1,
    asset: "habitat.png",
    power_w: -2,

    wd_to_build: 15,
    wd_to_demolish: 8,
    cost_coin: 10,
    max_hp: 700,
    description: "Obytný modul. P1: jeden probuzený kolonista (hráč).",
  },
  Storage: {
    kind: "Storage",
    label: "Storage",
    w: 1,
    h: 1,
    asset: "storage.png",
    power_w: -1,

    wd_to_build: 12,
    wd_to_demolish: 6,
    cost_coin: 8,
    max_hp: 650,
    description: "Sklad zásob (jídlo, kapalný kyslík). Kapacita ladí kalibrace.",
  },
  MedCore: {
    kind: "MedCore",
    label: "MedCore",
    w: 1,
    h: 1,
    asset: "medcore.png",
    power_w: -3,

    wd_to_build: 18,
    wd_to_demolish: 9,
    cost_coin: 12,
    max_hp: 800,
    description: "Lékařské centrum. Léčí HP aktérům (P2+).",
  },
  Assembler: {
    kind: "Assembler",
    label: "Assembler",
    w: 1,
    h: 1,
    asset: "assembler.png",
    power_w: -4,

    wd_to_build: 22,
    wd_to_demolish: 10,
    cost_coin: 15,
    max_hp: 850,
    description: "Výrobna modulů z Coin (◎). Bottleneck stavby v P2+.",
  },
  CommandPost: {
    kind: "CommandPost",
    label: "CommandPost",
    w: 1,
    h: 1,
    asset: "command_post.png",
    power_w: -2,

    wd_to_build: 20,
    wd_to_demolish: 10,
    cost_coin: 14,
    max_hp: 900,
    description: "Velitelské stanoviště + integrovaná Observatory. UI root mateřské lodi.",
  },
};

export const ACTOR_DEFS: Record<ActorKind, ActorDef> = {
  player: {
    kind: "player",
    label: "Player",
    power_w: 8,
    asset: "actor_player.png",
    role: "Hráčův avatar — Founding Colonist #1. Pracuje → HP klesá, jí → HP roste.",
  },
};

export const TASK_DEFS: Record<TaskKind, TaskDef> = {
  repair: { kind: "repair", label: "Repair", allowed_actors: ["player"] },
  demolish: { kind: "demolish", label: "Demolish", allowed_actors: ["player"] },
  build: { kind: "build", label: "Build", allowed_actors: ["player"] },
  service: { kind: "service", label: "Service", allowed_actors: [] }, // eternal, nemá allowed actors
};
