// Testy pro world/format.ts — formatGameTime, formatEta, taskActionCs,
// describeTaskTarget, taskEtaTicks. Po F1 extrakci (S28).

import { describe, it, expect } from "vitest";
import { formatGameTime, formatEta, taskEtaTicks, describeTaskTarget } from "./format";
import { createInitialWorld } from "./init";
import type { Task } from "../model";

describe("formatGameTime", () => {
  it("tick 0 = T:0.00:00", () => {
    expect(formatGameTime(0)).toBe("T:0.00:00");
  });

  it("formát T:day.HH:MM", () => {
    const out = formatGameTime(0);
    expect(out).toMatch(/^T:\d+\.\d{2}:\d{2}$/);
  });

  it("rostoucí tick → rostoucí čas", () => {
    const t1 = formatGameTime(1000);
    const t2 = formatGameTime(2000);
    expect(t1).not.toBe(t2);
  });
});

describe("formatEta", () => {
  it("nula / NaN / negativní → '—'", () => {
    expect(formatEta(0)).toBe("—");
    expect(formatEta(-1)).toBe("—");
    expect(formatEta(NaN)).toBe("—");
    expect(formatEta(Infinity)).toBe("—");
  });

  it("krátký interval → 'Xm'", () => {
    const out = formatEta(60);
    expect(out).toMatch(/^\d+m$/);
  });

  it("dlouhý interval → obsahuje 'd' nebo 'h'", () => {
    const out = formatEta(100000);
    expect(out).toMatch(/[dh]/);
  });
});

describe("describeTaskTarget", () => {
  const w = createInitialWorld();

  it("task s explicit label → vrátí label", () => {
    const t: Task = {
      id: "task_x", kind: "service", target: {}, wd_total: 0, wd_done: 0,
      assigned: [], priority: 0, status: "eternal", createdAt: 0,
      label: "QuarterMaster v2.3 — Active",
    };
    expect(describeTaskTarget(w, t)).toBe("QuarterMaster v2.3 — Active");
  });

  it("build task na void slot → 'Bay [row,col]'", () => {
    const t: Task = {
      id: "task_x", kind: "build", target: { bayIdx: 9 },
      wd_total: 10, wd_done: 0, assigned: [], priority: 1, status: "pending", createdAt: 0,
    };
    expect(describeTaskTarget(w, t)).toBe("Bay [1,1]");
  });

  it("repair task na modul → 'Kind (id)'", () => {
    const modId = Object.keys(w.modules)[0]!;
    const mod = w.modules[modId]!;
    const t: Task = {
      id: "task_x", kind: "repair", target: { moduleId: modId },
      wd_total: 10, wd_done: 0, assigned: [], priority: 1, status: "pending", createdAt: 0,
    };
    expect(describeTaskTarget(w, t)).toBe(`${mod.kind} (${modId})`);
  });
});

describe("taskEtaTicks", () => {
  const w = createInitialWorld();

  it("paused/pending task → Infinity", () => {
    const t: Task = {
      id: "task_x", kind: "build", target: { bayIdx: 0 },
      wd_total: 10, wd_done: 0, assigned: [], priority: 1, status: "paused", createdAt: 0,
    };
    expect(taskEtaTicks(w, t)).toBe(Infinity);
  });

  it("active task s drony → konečný ETA", () => {
    const t: Task = {
      id: "task_x", kind: "build", target: { bayIdx: 0 },
      wd_total: 10, wd_done: 0, assigned: [], priority: 1, status: "active", createdAt: 0,
    };
    const eta = taskEtaTicks(w, t);
    expect(eta).toBeGreaterThan(0);
    expect(eta).toBeLessThan(Infinity);
  });

  it("active task bez E (drony offline) → Infinity", () => {
    const w2 = createInitialWorld();
    w2.resources.energy = 0;
    const t: Task = {
      id: "task_x", kind: "build", target: { bayIdx: 0 },
      wd_total: 10, wd_done: 0, assigned: [], priority: 1, status: "active", createdAt: 0,
    };
    expect(taskEtaTicks(w2, t)).toBe(Infinity);
  });
});
