// Unit testy pro world.ts — layered bay axiom (S18).
// Random layout → testy kontrolují invarianty, ne konkrétní pozice.

import { describe, it, expect } from "vitest";
import {
  createInitialWorld,
  stepWorld,
  enqueueRepairTask,
  getOuterHP,
  SKELETON_HP_MAX,
  COVERED_HP_MAX,
} from "./world";
import { MODULE_DEFS } from "./model";
import type { World } from "./model";

// === Factory ===

describe("createInitialWorld", () => {
  it("startuje v running fázi s resources na seed hodnotách", () => {
    const w = createInitialWorld();
    expect(w.phase).toBe("running");
    expect(w.tick).toBe(0);
    expect(w.resources.solids.metal).toBe(60);
    expect(w.resources.solids.components).toBe(30);
    expect(w.resources.fluids.water).toBe(30);
    expect(w.resources.fluids.coolant).toBe(20);
    expect(w.resources.coin).toBe(20);
    expect(w.resources.energy).toBe(12);
  });

  it("má 16 bays a 7 modulů (Engine + 6 startovních)", () => {
    const w = createInitialWorld();
    expect(w.segment).toHaveLength(16);
    expect(Object.keys(w.modules).length).toBe(7);
    expect(w.modules.engine_1?.kind).toBe("Engine");
    expect(w.modules.commandpost_1?.kind).toBe("CommandPost");
  });

  it("Engine 2×2 zabírá 4 bays (1 root + 3 ref) na fixní pozici idx 6", () => {
    const w = createInitialWorld();
    const engineRef = w.segment.filter(
      (t) =>
        (t.kind === "module_root" || t.kind === "module_ref") && t.moduleId === "engine_1",
    );
    expect(engineRef.length).toBe(4);
    // Engine root je na idx 6 (fixní kotevní bod).
    const t6 = w.segment[6];
    expect(t6?.kind).toBe("module_root");
    if (t6?.kind === "module_root") expect(t6.moduleId).toBe("engine_1");
  });

  it("každý modul má 1 module_root bay + potenciálně další module_ref bays", () => {
    const w = createInitialWorld();
    for (const [id, mod] of Object.entries(w.modules)) {
      const def = MODULE_DEFS[mod.kind];
      const rootCount = w.segment.filter(
        (t) => t.kind === "module_root" && t.moduleId === id,
      ).length;
      const refCount = w.segment.filter(
        (t) => t.kind === "module_ref" && t.moduleId === id,
      ).length;
      expect(rootCount).toBe(1);
      expect(rootCount + refCount).toBe(def.w * def.h);
    }
  });

  it("zbytek bays je mix skeleton + 2-3 covered (dle random)", () => {
    const w = createInitialWorld();
    const skeletons = w.segment.filter((t) => t.kind === "skeleton").length;
    const covered = w.segment.filter((t) => t.kind === "covered").length;
    expect(covered).toBeGreaterThanOrEqual(2);
    expect(covered).toBeLessThanOrEqual(3);
    // 16 total = 10 engine+6×1×1 moduly (+ ref) = 10 module bays; zbývá 6.
    // 6 = skeletons + covered.
    expect(skeletons + covered).toBe(6);
  });

  it("covered bays mají variant 1..5", () => {
    const w = createInitialWorld();
    for (const t of w.segment) {
      if (t.kind === "covered") {
        expect(t.variant).toBeGreaterThanOrEqual(1);
        expect(t.variant).toBeLessThanOrEqual(5);
      }
    }
  });

  it("skeleton.hp_max = SKELETON_HP_MAX, covered.hp_max = COVERED_HP_MAX", () => {
    const w = createInitialWorld();
    for (const t of w.segment) {
      if (t.kind === "skeleton") expect(t.hp_max).toBe(SKELETON_HP_MAX);
      if (t.kind === "covered") expect(t.hp_max).toBe(COVERED_HP_MAX);
    }
  });

  it("tři komponenty mají výraznější poškození (< 90 % hp_max)", () => {
    const w = createInitialWorld();
    // Collect outer HP pro všech 16 bays a najdi ty s nejvyšším missing ratio.
    const pcts: number[] = [];
    const seenModules = new Set<string>();
    for (let i = 0; i < 16; i++) {
      const t = w.segment[i]!;
      if (t.kind === "skeleton" || t.kind === "covered") {
        pcts.push(t.hp / t.hp_max);
      } else if (t.kind === "module_root") {
        if (!seenModules.has(t.moduleId)) {
          seenModules.add(t.moduleId);
          const m = w.modules[t.moduleId]!;
          pcts.push(m.hp / m.hp_max);
        }
      }
    }
    pcts.sort((a, b) => a - b);
    // Critical + medium + minor → 3 komponenty pod 90 % (minor je 75..90).
    const significantlyDamaged = pcts.filter((p) => p < 0.9).length;
    expect(significantlyDamaged).toBeGreaterThanOrEqual(3);
  });

  it("každý bay je nezávislá instance", () => {
    const w = createInitialWorld();
    expect(w.segment[0]).not.toBe(w.segment[1]);
  });
});

// === Perpetual Observer — stepWorld ===

describe("stepWorld: tick progresuje", () => {
  it("tick roste o 1 každým krokem", () => {
    const w = createInitialWorld();
    expect(w.phase).toBe("running");
    stepWorld(w);
    expect(w.tick).toBe(1);
    stepWorld(w);
    expect(w.tick).toBe(2);
  });
});

// === getOuterHP / enqueueRepairTask ===

describe("getOuterHP", () => {
  it("vrátí HP vnější vrstvy (skeleton/covered) nebo modulu", () => {
    const w = createInitialWorld();
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      expect(outer).not.toBeNull();
      if (outer) {
        expect(outer.hp).toBeGreaterThan(0);
        expect(outer.hp_max).toBeGreaterThan(0);
      }
    }
  });
});

describe("enqueueRepairTask (generalized)", () => {
  it("enqueue repair pro bay s hp < hp_max", () => {
    const w = createInitialWorld();
    // Najdi první bay s missing HP.
    let targetIdx = -1;
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      if (outer && outer.hp < outer.hp_max) {
        targetIdx = i;
        break;
      }
    }
    expect(targetIdx).toBeGreaterThanOrEqual(0);
    const before = w.tasks.filter((t) => t.kind === "repair").length;
    const ok = enqueueRepairTask(w, targetIdx);
    expect(ok).toBe(true);
    expect(w.tasks.filter((t) => t.kind === "repair").length).toBe(before + 1);
  });

  it("idempotent — druhé volání na stejný target nic nepřidá", () => {
    const w = createInitialWorld();
    let targetIdx = -1;
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      if (outer && outer.hp < outer.hp_max) {
        targetIdx = i;
        break;
      }
    }
    enqueueRepairTask(w, targetIdx);
    const afterFirst = w.tasks.filter((t) => t.kind === "repair").length;
    const ok2 = enqueueRepairTask(w, targetIdx);
    expect(ok2).toBe(false);
    expect(w.tasks.filter((t) => t.kind === "repair").length).toBe(afterFirst);
  });
});

// === QuarterMaster (S24) ===

describe("QuarterMaster runtime", () => {
  it("createInitialWorld vytváří eternal service task", () => {
    const w = createInitialWorld();
    const eternal = w.tasks.filter((t) => t.status === "eternal");
    expect(eternal).toHaveLength(1);
    expect(eternal[0]!.kind).toBe("service");
    expect(eternal[0]!.label).toContain("QuarterMaster");
  });

  it("inicializuje software.quartermaster s verzí + příkonem", () => {
    const w = createInitialWorld();
    const qm = w.software.quartermaster;
    expect(qm).toBeDefined();
    expect(qm!.version).toBe("v2.3");
    expect(qm!.draw_w).toBe(0.86);
    expect(qm!.status).toBe("running");
  });

  it("při E→0 přepne SW do offline + emituje DRN:CRIT + monitor label OFFLINE", () => {
    const w = createInitialWorld();
    // Shodíme SolarArray → jediný zdroj E (jinak net power > 0 a E by rostla).
    for (const mod of Object.values(w.modules)) {
      if (mod.kind === "SolarArray") mod.status = "offline";
    }
    // Startovní E malá, ale > 0 (pre-condition pro transition detect).
    w.resources.energy = 1;
    // Tiknout dokud E nepadne na 0. Konzumenti ≈ -12 W + QM 0.86 → ~0.21 Wh/tick.
    for (let i = 0; i < 20 && w.resources.energy > 0; i++) stepWorld(w);
    // Ještě jeden tick — protocolTick běží před productionTick v pipeline, takže
    // OFFLINE label se projeví až v dalším protocolTicku po transition.
    stepWorld(w);

    const qm = w.software.quartermaster!;
    expect(w.resources.energy).toBe(0);
    expect(qm.status).toBe("offline");
    const monitor = w.tasks.find((t) => t.status === "eternal");
    expect(monitor?.label).toContain("OFFLINE");
    // DRN:CRIT event s item=quartermaster byl emitován.
    const crit = w.events.find(
      (e) => e.verb === "DRN" && e.csq === "CRIT" && e.item === "quartermaster",
    );
    expect(crit).toBeDefined();
  });

  it("po obnovení E bootuje SW zpět online", () => {
    const w = createInitialWorld();
    w.software.quartermaster!.status = "offline";
    w.resources.energy = 0;
    // Tick s E=0 → nic se nestane. Pak vrať E a tick → boot transition.
    stepWorld(w);
    w.resources.energy = w.energyMax;
    stepWorld(w);
    expect(w.software.quartermaster!.status).toBe("running");
  });

  it("při energy=0 pause-uje active repair tasks", () => {
    const w = createInitialWorld();
    // Najdi poškozený target + enqueue repair.
    let idx = -1;
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      if (outer && outer.hp < outer.hp_max) { idx = i; break; }
    }
    expect(idx).toBeGreaterThanOrEqual(0);
    enqueueRepairTask(w, idx);

    // Jeden tick s plnou energii → task se aktivuje.
    stepWorld(w);
    const repair = w.tasks.find((t) => t.kind === "repair");
    expect(repair).toBeDefined();

    // Shodím energii na 0 → další tick pause (E rating = 1 = selhání).
    w.resources.energy = 0;
    stepWorld(w);
    expect(repair!.status).toBe("paused");
  });

  it("při ready stavu auto-enqueue repair pro poškozený target", () => {
    const w = createInitialWorld();
    // Odstranit všechny repair tasks (pokud nějaké jsou od initial setup).
    w.tasks = w.tasks.filter((t) => t.kind !== "repair");
    const before = w.tasks.filter((t) => t.kind === "repair").length;

    // Dotáhni energii na plno (100%) — guaranteed zelená.
    w.resources.energy = w.energyMax;
    stepWorld(w);

    const after = w.tasks.filter((t) => t.kind === "repair").length;
    // Pokud je něco poškozeného (a v initial worldu random damages jsou), enqueue by měl vytvořit task.
    const damagedExists = w.segment.some(
      (b) => (b.kind === "skeleton" || b.kind === "covered") && b.hp < b.hp_max,
    ) || Object.values(w.modules).some((m) => m.hp < m.hp_max);
    if (damagedExists) {
      expect(after).toBeGreaterThan(before);
    }
  });
});

// === S25: Solids per repair ===

describe("Recipe-per-target repair (S25)", () => {
  // Helper: vynuluj všechny Solids subtypy (recepty cílí různé subtypy per modul).
  const zeroSolids = (w: World) => {
    w.resources.solids.metal = 0;
    w.resources.solids.components = 0;
  };

  it("repair task čerpá Solids subtyp(y) per recipe", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    const metalBefore = w.resources.solids.metal;
    let idx = -1;
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      if (outer && outer.hp < outer.hp_max) { idx = i; break; }
    }
    expect(idx).toBeGreaterThanOrEqual(0);
    enqueueRepairTask(w, idx);

    for (let i = 0; i < 10; i++) stepWorld(w);

    // Metal je v každém recipe — musí klesnout.
    expect(w.resources.solids.metal).toBeLessThan(metalBefore);
  });

  it("při Solids=0 protocolTick pauzne repair task + monitor label 'no <subtype>'", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    let idx = -1;
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      if (outer && outer.hp < outer.hp_max) { idx = i; break; }
    }
    enqueueRepairTask(w, idx);
    stepWorld(w);
    const repair = w.tasks.find((t) => t.kind === "repair");
    expect(repair).toBeDefined();

    zeroSolids(w);
    stepWorld(w);
    expect(repair!.status).toBe("paused");
    const monitor = w.tasks.find((t) => t.status === "eternal");
    // Subtyp závisí na recipe target — ale „no " prefix je vždy.
    expect(monitor?.label).toMatch(/Paused — no (food|metal|components|air|water|coolant)/);
  });

  it("progressTasks neprogresuje repair při Solids deficit (wd_done se nezvýší)", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    zeroSolids(w);
    let idx = -1;
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      if (outer && outer.hp < outer.hp_max) { idx = i; break; }
    }
    enqueueRepairTask(w, idx);
    const repair = w.tasks.find((t) => t.kind === "repair")!;
    repair.status = "active";
    const wdBefore = repair.wd_done;

    stepWorld(w);
    // protocolTick pauzne (recipe deficit) → progressTasks task paused, skip.
    expect(repair.wd_done).toBe(wdBefore);
  });

  it("po Solids restocku protocolTick resume-uje task", () => {
    const w = createInitialWorld();
    w.resources.energy = w.energyMax;
    let idx = -1;
    for (let i = 0; i < 16; i++) {
      const outer = getOuterHP(w, i);
      if (outer && outer.hp < outer.hp_max) { idx = i; break; }
    }
    enqueueRepairTask(w, idx);
    stepWorld(w);
    const repair = w.tasks.find((t) => t.kind === "repair")!;

    // Vynuluj všechny Solids → pauza.
    zeroSolids(w);
    stepWorld(w);
    expect(repair.status).toBe("paused");

    // Restock → další tick resume.
    w.resources.solids.metal = 60;
    w.resources.solids.components = 30;
    w.resources.energy = w.energyMax;
    stepWorld(w);
    expect(repair.status).toBe("active");
  });
});

