// Datový model pro POC_P1 — §13 specifikace + statický katalog definic.
// MVC: tohle je "Model" (data + statické definice). `world.ts` doplňuje pravidla (stepWorld, FSM).
// Umístění: apps/client/src/game/ (ne packages/shared — YAGNI pro P1, server přijde v P2).
//
// Indexace segmentu: 2 řady × 8 sloupců, row-major → idx = row*8 + col.

// === Fáze a LOSS důvody ===

export type Phase = "boot" | "phase_a" | "phase_b" | "phase_c" | "win" | "loss";

export type LossReason = "air" | "food" | "session_closed";

// === Tile (políčko 1×1 v segmentu) ===

// Tagged union. TypeScript umí narrowing přes `tile.kind` → bezpečný switch.
// HP-unified damage axiom (S16): každá instance Tile nese hp + hp_max.
//   - empty: hp = hp_max (nepoškozený floor)
//   - damaged: hp < hp_max (konkrétní damaged = hp 0..hp_max-1)
//   - module_ref: projekce modulu; hp žije na Module instanci, ne tady.
export type Tile =
  | { kind: "empty"; hp: number; hp_max: number }
  | { kind: "damaged"; hp: number; hp_max: number }
  | { kind: "module_ref"; moduleId: string; rootOffset: { dx: number; dy: number } };

// === Modul: definice (katalog) + instance (stav ve světě) ===

// ModuleKind = diskrétní výčet typů modulů v P1. Používá se jako FK do MODULE_DEFS.
// Mateřská loď (POC_P1 §3, vrácené v S16): 7 modulů na startu — Habitat, SolarArray,
// MedCore, Assembler, CommandPost, Storage, Engine 2×2. Dock vzniká až buildem.
// Vlastní mechaniky (jídlo z Habitat, výroba z Assembler, …) jsou P2+ — v P1 jen
// vizuální/inspector naplnění mateřského segmentu.
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
// DRY: size/asset/power_w se neduplikuje do každé instance.
export type ModuleDef = {
  kind: ModuleKind;
  label: string; // pro Inspector / Log
  w: number; // šířka v tiles
  h: number; // výška v tiles
  asset: string; // soubor v public/assets/modules/ (40×40 native per tile)
  power_w: number; // + produkce / − spotřeba (W); 0 = pasivní
  wd_to_build: number;
  wd_to_demolish: number;
  cost_coin: number; // cena stavby v Coin (◎) — Resource Model v0.1
  max_hp: number;
  description: string; // Inspector text (2–3 věty)
};

// Instance modulu ve světě — mění se za běhu.
// HP-unified axiom (S16): instance nese hp i hp_max. hp_max se při create
// zkopíruje z MODULE_DEFS[kind].max_hp — katalog je zdroj pravdy pro default,
// instance pak může žít vlastním životem (damage, repair).
export type Module = {
  id: string; // unikátní runtime id (např. "mod_001")
  kind: ModuleKind; // FK do MODULE_DEFS
  rootIdx: number; // pozice root tile v segmentu (row*8+col)
  status: "online" | "building" | "demolishing" | "offline";
  hp: number; // 0..hp_max
  hp_max: number; // kopie z MODULE_DEFS[kind].max_hp při create
  progress_wd: number; // progres budování/demolice (0..wd_to_build nebo 0..wd_to_demolish)
  docked_count?: number; // jen Dock: kolik modulů flotily připojeno (WIN ≥ 1)
};

// === Aktér: definice + instance ===

export type ActorKind = "constructor" | "hauler" | "player";

export type ActorDef = {
  kind: ActorKind;
  label: string;
  power_w: number; // kolik W táhne když `working`
  asset: string; // animace/sprite — zatím placeholder
  role: string; // Inspector popis
};

export type Actor = {
  id: string;
  kind: ActorKind; // FK do ACTOR_DEFS
  state: "idle" | "working";
  taskId?: string; // aktuálně přiřazený task
};

// === Task: definice + instance ===

export type TaskKind = "repair" | "demolish" | "build" | "haul";

// Statická definice — jaké tasky umí hra generovat, jaké cíle berou.
export type TaskDef = {
  kind: TaskKind;
  label: string;
  // Kdo může task vykonávat. Pro P1 zjednodušeně: build/demolish/repair = Constructor+Player, haul = Hauler.
  allowed_actors: ActorKind[];
};

export type Task = {
  id: string;
  kind: TaskKind;
  target: {
    tileIdx?: number; // repair, build
    moduleId?: string; // demolish, haul source/target
    buildSpec?: ModuleKind; // build — který modul stavět
  };
  wd_total: number; // odvozeno z targetu (repair: hp_max-hp; build: wd_to_build; ...)
  wd_done: number;
  assigned: string[]; // ids aktérů pracujících na tasku
  priority: number; // vyšší = dřív
  cost_coin?: number; // jen "build"; strhne se při zahájení (◎)
};

// === Root state: celý svět ===

// Jeden objekt → čisté testy, snadný snapshot/load/save (model-first princip).
export type World = {
  tick: number; // počet logických ticků od startu (0..n)
  phase: Phase;
  // Resource Model v0.1 (axiom v GLOSSARY §Resources):
  //   5 os = Energy (E) | Work (W) | Slab (S) | Flux (F) | Coin (◎)
  // P1 scope:
  //   - Energy        — baterie pásu (seed 12, S16)
  //   - Work          — NEDRŽÍ se v modelu, derivuje se z actors přes computeWork()
  //                     (DRY: jediný zdroj = actors.state + ACTOR_DEFS.power_w)
  //   - Slab.food     — solid materials, subtyp food (seed 40)
  //   - Flux.air      — fluids+gases, subtyp air (0..100 %)
  //   - Coin          — měna (seed 20, bylo "Kredo" v0.0)
  resources: {
    energy: number;
    slab: { food: number };
    flux: { air: number };
    coin: number;
  };
  segment: Tile[]; // 16 tiles (2×8)
  modules: Record<string, Module>;
  actors: Actor[];
  tasks: Task[];
  next_task_id: number; // monotonic counter pro generování task id (KISS, žádný UUID)
  loss_reason?: LossReason;
};

// ============================================================================
// KATALOG — statické definice (MODULE_DEFS, ACTOR_DEFS, TASK_DEFS)
// ============================================================================
// Hodnoty v souladu s POC_P1 §10 (seed kalibrace). Označené `TODO calibrate`
// nemají v §10 přímý údaj — orientační nástřel pro playtest.

export const MODULE_DEFS: Record<ModuleKind, ModuleDef> = {
  SolarArray: {
    kind: "SolarArray",
    label: "Solar Array",
    w: 1,
    h: 1,
    asset: "solar_array.png",
    power_w: 24, // §10: CAL-C2a (revize z 2×2 na 1×1)
    wd_to_build: 20,
    wd_to_demolish: 10,
    cost_coin: 8,
    max_hp: 40,
    description: "Solární panel. Hlavní zdroj energie v P1.",
  },
  Engine: {
    kind: "Engine",
    label: "Engine",
    w: 2,
    h: 2, // POC_P1 §3: Engine 2×2 (S16 fix — bylo 2×1 omylem)
    asset: "engine.png",
    power_w: 0, // nefunkční, bude demolován v P1
    wd_to_build: 80, // TODO calibrate (v P1 se nestaví, jen demolition)
    wd_to_demolish: 60, // §10: revize z 120 na 60
    cost_coin: 30,
    max_hp: 120,
    description: "Nefunkční zbytek startovního motoru. K demontáži pro získání místa.",
  },
  Dock: {
    kind: "Dock",
    label: "Docking Station",
    w: 2,
    h: 2,
    asset: "dock.png",
    power_w: -6, // TODO calibrate
    wd_to_build: 48, // §10
    wd_to_demolish: 20,
    cost_coin: 20, // §10
    max_hp: 100,
    description: "Přístaviště flotily. WIN podmínka: ≥1 modul flotily připojen.",
  },
  // === Mateřské moduly (S16) — POC_P1 §3 ===
  // Vlastní mechaniky P2+. P1 zobrazuje je v segmentu, INSPECTOR čte HP+popis,
  // všechny placeholder hodnoty mají TODO calibrate.
  Habitat: {
    kind: "Habitat",
    label: "Habitat",
    w: 1,
    h: 1,
    asset: "habitat.png",
    power_w: -2, // TODO calibrate (drobná spotřeba ECLSS)
    wd_to_build: 15,
    wd_to_demolish: 8,
    cost_coin: 10,
    max_hp: 40,
    description: "Obytný modul. P1: jeden probuzený kolonista (hráč).",
  },
  Storage: {
    kind: "Storage",
    label: "Storage",
    w: 1,
    h: 1,
    asset: "storage.png",
    power_w: -1, // TODO calibrate
    wd_to_build: 12,
    wd_to_demolish: 6,
    cost_coin: 8,
    max_hp: 30,
    description: "Sklad zásob (jídlo, kapalný kyslík). Kapacita ladí kalibrace.",
  },
  MedCore: {
    kind: "MedCore",
    label: "MedCore",
    w: 1,
    h: 1,
    asset: "medcore.png",
    power_w: -3, // TODO calibrate
    wd_to_build: 18,
    wd_to_demolish: 9,
    cost_coin: 12,
    max_hp: 35,
    description: "Lékařské centrum. Léčí HP aktérům (P2+).",
  },
  Assembler: {
    kind: "Assembler",
    label: "Assembler",
    w: 1,
    h: 1,
    asset: "assembler.png",
    power_w: -4, // TODO calibrate
    wd_to_build: 22,
    wd_to_demolish: 10,
    cost_coin: 15,
    max_hp: 40,
    description: "Výrobna modulů z Coin (◎). Bottleneck stavby v P2+.",
  },
  CommandPost: {
    kind: "CommandPost",
    label: "CommandPost",
    w: 1,
    h: 1,
    asset: "command_post.png",
    power_w: -2, // TODO calibrate
    wd_to_build: 20,
    wd_to_demolish: 10,
    cost_coin: 14,
    max_hp: 50,
    description: "Velitelské stanoviště + integrovaná Observatory. UI root mateřské lodi.",
  },
};

export const ACTOR_DEFS: Record<ActorKind, ActorDef> = {
  constructor: {
    kind: "constructor",
    label: "Constructor",
    power_w: 12, // §10 seed
    asset: "actor_constructor.png",
    role: "Staví, opravuje, demontuje moduly. 3× v poolu.",
  },
  hauler: {
    kind: "hauler",
    label: "Hauler",
    power_w: 8, // §10 seed
    asset: "actor_hauler.png",
    role: "Přepravuje materiál a moduly flotily. 2× v poolu.",
  },
  player: {
    kind: "player",
    label: "Player",
    power_w: 8,
    asset: "actor_player.png",
    role: "Hráč-aktér. V P1 vždy working, prohrává s kolonií.",
  },
};

export const TASK_DEFS: Record<TaskKind, TaskDef> = {
  repair: {
    kind: "repair",
    label: "Repair",
    allowed_actors: ["constructor", "player"],
  },
  demolish: {
    kind: "demolish",
    label: "Demolish",
    allowed_actors: ["constructor", "player"],
  },
  build: {
    kind: "build",
    label: "Build",
    allowed_actors: ["constructor", "player"],
  },
  haul: {
    kind: "haul",
    label: "Haul",
    allowed_actors: ["hauler"],
  },
};
