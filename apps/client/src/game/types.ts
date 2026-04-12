// Datové typy pro POC_P1 — §13 specifikace.
// Umístění: apps/client/src/game/ (ne packages/shared — YAGNI pro P1, server přijde v P2).
//
// Indexace segmentu: 2 řady × 8 sloupců, row-major → idx = row*8 + col.
// (§13 uvádí `y*2+x`, ale to pro 2×8 nevychází — interpretujeme jako typo.)

export type Phase = "boot" | "phase_a" | "phase_b" | "phase_c" | "win" | "loss";

export type LossReason = "air" | "food" | "session_closed";

// Tile — tagged union. TypeScript umí narrowing přes `tile.kind` → bezpečný switch.
export type Tile =
  | { kind: "empty" }
  | { kind: "damaged"; wd_to_repair: number }
  | { kind: "module_ref"; moduleId: string; rootOffset: { dx: number; dy: number } };

export type ModuleKind =
  | "Habitat"
  | "SolarArray"
  | "Engine"
  | "Dock"
  | "Storage"
  | "MedCore"
  | "Assembler"
  | "CommandPost";

export type Module = {
  id: string;
  kind: ModuleKind;
  w: number; // šířka v tiles
  h: number; // výška v tiles
  rootIdx: number; // index root tile v segmentu (row*8+col)
  status: "online" | "building" | "demolishing" | "offline";
  progress_wd: number; // progres budování/demolice
  docked_count?: number; // jen Dock: kolik modulů flotily připojeno (WIN ≥ 1)
};

export type ActorKind = "constructor" | "hauler" | "player";

export type Actor = {
  id: string;
  kind: ActorKind;
  power_w: number; // Constructor 12, Hauler 8, player 8
  state: "idle" | "working";
  taskId?: string;
};

export type TaskKind = "repair" | "demolish" | "build" | "haul";

export type Task = {
  id: string;
  kind: TaskKind;
  target: {
    tileIdx?: number;
    moduleId?: string;
    buildSpec?: ModuleKind;
  };
  wd_total: number;
  wd_done: number;
  assigned: string[]; // ids aktérů pracujících na tasku
  priority: number; // vyšší = dřív
  cost_kredo?: number; // jen "build"; strhne se při zahájení
};

// Root state celé hry. Drží se jako jeden objekt — čisté testy, snadný snapshot.
export type World = {
  tick: number; // počet logických ticků od startu (0..n)
  phase: Phase;
  resources: {
    air: number; // 0..100 (%)
    food: number; // jednotky jídla (seed: 40)
    kredo: number; // stavební měna (seed: 20)
  };
  segment: Tile[]; // 16 tiles (2×8)
  modules: Record<string, Module>;
  actors: Actor[];
  tasks: Task[];
  loss_reason?: LossReason;
};
