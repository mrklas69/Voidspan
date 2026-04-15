// HeaderPanel — Top Bar (HUD).
// Obsah: ⊙ ikona + VOIDSPAN + meta (verze, adresa, herní čas) + 5 resource bars + Help tlačítko.
// Model-first: čte z `getWorld()`, tooltips dynamické.

import Phaser from "phaser";
import pkg from "../../../package.json";
import type { World } from "../model";
import { MODULE_DEFS, STATUS_LABELS, statusRating } from "../model";
import { formatResource, formatScalar } from "../format";
import { formatGameTime, computeWork } from "../world";
import { TOOLTIP_LIST_MAX_ITEMS } from "../tuning";
import { TooltipManager, type TooltipContent } from "../tooltip";
import {
  FONT_FAMILY,
  FONT_SIZE_HUD,
  UI_BRAND_ICON,
  HEX_WARN_ORANGE,
  RATING_COLOR,
  metricColor,
} from "../palette";
import { CANVAS_W, HUD_ROW_Y, COL_TEXT, COL_TEXT_ACCENT } from "./layout";

export class HeaderPanel {
  private iconText: Phaser.GameObjects.Text;
  private appText: Phaser.GameObjects.Text;
  private metaText: Phaser.GameObjects.Text;
  private resourceTexts: Phaser.GameObjects.Text[] = [];

  constructor(
    scene: Phaser.Scene,
    private getWorld: () => World,
  ) {
    const baseStyle = {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_HUD,
    };

    // Top Bar: ikona + AppName + meta + 5 resource bars. Help je v Bottom Baru.
    // Pozice se dopočítávají v render() — celý blok je horizontálně vycentrovaný.
    this.iconText = scene.add.text(0, HUD_ROW_Y, "", {
      ...baseStyle,
      color: UI_BRAND_ICON,
    });
    this.appText = scene.add.text(0, HUD_ROW_Y, "", {
      ...baseStyle,
      color: UI_BRAND_ICON,
    });
    this.metaText = scene.add.text(0, HUD_ROW_Y, "", {
      ...baseStyle,
      color: COL_TEXT_ACCENT,
    });

    // 5× resource Text — za meta, pozice dopočítaná v render().
    for (let i = 0; i < 5; i++) {
      const t = scene.add.text(0, HUD_ROW_Y, "", {
        ...baseStyle,
        color: COL_TEXT,
      });
      this.resourceTexts.push(t);
    }
  }

  attachTooltips(tooltips: TooltipManager): void {
    const env = (() => {
      const host = window.location.hostname;
      if (!host || host === "localhost" || host === "127.0.0.1")
        return "local (standalone)";
      if (host.endsWith(".github.io")) return `GitHub Pages (${host})`;
      return host;
    })();
    const identityProvider = () =>
      `Server: ${env}\nVersion: v${pkg.version}\nWorld: Teegarden.Belt1.Seg042`;
    tooltips.attach(this.iconText, identityProvider);
    tooltips.attach(this.appText, identityProvider);
    tooltips.attach(this.metaText, identityProvider);

    // Resource bars tooltips — live z `getWorld()`.
    const resourceTooltips: Array<() => string | TooltipContent> = [
      () => this.energyTooltip(),
      () => this.workTooltip(),
      () => this.slabTooltip(),
      () => this.fluxTooltip(),
      () => this.coinTooltip(),
    ];
    for (let i = 0; i < this.resourceTexts.length; i++) {
      const t = this.resourceTexts[i];
      const provider = resourceTooltips[i];
      if (t && provider) tooltips.attach(t, provider);
    }
  }

  private energyTooltip(): TooltipContent {
    const w = this.getWorld();
    const pct = w.energyMax > 0 ? Math.round((w.resources.energy / w.energyMax) * 100) : 0;
    const rating = statusRating(pct);
    const ratingLabel = STATUS_LABELS[rating];

    // Kapacita — moduly s capacity_wh > 0, sestupně.
    const capMods: Array<{ name: string; cap: number; hpPct: number }> = [];
    const income: Array<{ name: string; pw: number; hpPct: number }> = [];
    const expense: Array<{ name: string; pw: number; hpPct: number }> = [];
    for (const mod of Object.values(w.modules)) {
      if (mod.status !== "online") continue;
      const hpRatio = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
      const nomCap = MODULE_DEFS[mod.kind].capacity_wh ?? 0;
      if (nomCap > 0) {
        capMods.push({ name: `${mod.kind} (${mod.id})`, cap: nomCap * hpRatio, hpPct: Math.round(hpRatio * 100) });
      }
      const pw = MODULE_DEFS[mod.kind].power_w * hpRatio;
      const entry = { name: `${mod.kind} (${mod.id})`, pw, hpPct: Math.round(hpRatio * 100) };
      if (pw > 0) income.push(entry);
      else if (pw < 0) expense.push(entry);
    }
    // Nabíjení dronů — drony pracují = spotřeba E (1 dron = 1 W při práci).
    const activeTasks = w.tasks.filter(t => t.assigned.length > 0 || w.drones > 0).length;
    const droneCharge = (activeTasks > 0 && w.resources.energy > 0) ? w.drones : 0;
    if (droneCharge > 0) {
      expense.push({ name: `¤ Nabíjení dronů (${w.drones}×)`, pw: -droneCharge, hpPct: 100 });
    }
    capMods.sort((a, b) => b.cap - a.cap);
    income.sort((a, b) => b.pw - a.pw);
    expense.sort((a, b) => a.pw - b.pw);

    const totalIncome = income.reduce((s, e) => s + e.pw, 0);
    const totalExpense = expense.reduce((s, e) => s + e.pw, 0);
    const net = totalIncome + totalExpense;
    const netSign = net >= 0 ? "+" : "";

    const I = "   ";
    const fmtList = (list: typeof income, sign: string): string[] => {
      const lines: string[] = [];
      const show = list.slice(0, TOOLTIP_LIST_MAX_ITEMS);
      for (const e of show) {
        lines.push(`${I}${e.name}  ${sign}${Math.abs(e.pw).toFixed(1)} W  (${e.hpPct}% HP)`);
      }
      const rest = list.length - show.length;
      if (rest > 0) lines.push(`${I}... +${rest} dalších`);
      if (list.length === 0) lines.push(`${I}(žádné)`);
      return lines;
    };

    const fmtCapList = (list: typeof capMods): string[] => {
      const lines: string[] = [];
      const show = list.slice(0, TOOLTIP_LIST_MAX_ITEMS);
      for (const e of show) {
        lines.push(`${I}${e.name}  ${e.cap.toFixed(0)} Wh  (${e.hpPct}% HP)`);
      }
      const rest = list.length - show.length;
      if (rest > 0) lines.push(`${I}... +${rest} dalších`);
      if (list.length === 0) lines.push(`${I}(žádné)`);
      return lines;
    };

    return {
      header: `Energie — ${ratingLabel.cs} (${pct}%)`,
      headerColor: RATING_COLOR[rating],
      body: [
        `${w.resources.energy.toFixed(1)} / ${w.energyMax} Wh`,
        `▤ Kapacita ${w.energyMax} Wh:`,
        ...fmtCapList(capMods),
        `▲ Příjmy +${totalIncome.toFixed(1)} W:`,
        ...fmtList(income, "+"),
        `▼ Výdaje ${totalExpense.toFixed(1)} W:`,
        ...fmtList(expense, "-"),
        `Σ Bilance: ${netSign}${net.toFixed(1)} W`,
      ].join("\n"),
    };
  }

  private workTooltip(): TooltipContent {
    const w = this.getWorld();
    const work = computeWork(w);
    // Rating = náboj baterek: Σ HP / Σ HP_MAX hráčů + idle drony / drony celkem.
    const hpSum = w.actors.filter(a => a.state !== "dead").reduce((s, a) => s + a.hp, 0);
    const hpMaxSum = w.actors.filter(a => a.state !== "dead").reduce((s, a) => s + a.hp_max, 0);
    const totalFull = hpMaxSum + w.drones;
    const pct = totalFull > 0 ? Math.round(((hpSum + work.capDrone) / totalFull) * 100) : 0;
    const rating = statusRating(pct);
    const ratingLabel = STATUS_LABELS[rating];

    const I = "   ";
    const playerCount = w.actors.filter(a => a.state !== "dead").length;
    const droneOnline = w.resources.energy > 0;

    // Výdaje — aktivní tasky (výkon ve W). Spočítáme nejdřív, abychom věděli kolik dronů pracuje.
    const expenseLines: string[] = [];
    let totalExpense = 0;
    let dronesWorking = false;
    for (const task of w.tasks) {
      let taskPlayerW = 0;
      for (const aid of task.assigned) {
        const a = w.actors.find(x => x.id === aid);
        if (a && a.state === "working") taskPlayerW += a.work;
      }
      const taskDroneW = droneOnline ? w.drones : 0;
      if (taskDroneW > 0) dronesWorking = true;
      const taskTotal = taskPlayerW + taskDroneW;
      if (taskTotal > 0) {
        const pctDone = task.wd_total > 0 ? Math.round((task.wd_done / task.wd_total) * 100) : 0;
        expenseLines.push(`${I}${task.kind} (${task.id})  -${taskTotal} W  ${pctDone}%`);
        totalExpense += taskTotal;
      }
    }
    if (expenseLines.length === 0) expenseLines.push(`${I}(žádné tasky)`);

    // Příjmy — jen aktuálně pracující zdroje.
    const incomeLines: string[] = [];
    const playersWorking = w.actors.some(a => a.state === "working");
    const playerIncome = playersWorking ? work.powerPlayer : 0;
    const droneIncome = dronesWorking ? work.powerDrone : 0;
    incomeLines.push(`${I}☻ Hráči ← Food: ${playerIncome} W${playersWorking ? "" : "  (nepracují)"}`);
    incomeLines.push(`${I}¤ Drony ← E: ${droneIncome} W${dronesWorking ? "" : droneOnline ? "  (nepracují)" : "  OFFLINE"}`);
    const totalIncome = playerIncome + droneIncome;

    return {
      header: `Práce — ${ratingLabel.cs} (${pct}%)`,
      headerColor: RATING_COLOR[rating],
      body: [
        `Výkon: ${work.powerMax} W  Kapacita: ${work.capMax} Wh`,
        `▤ Kapacita ${work.capMax} Wh:`,
        `${I}☻ Hráči: ${work.capPlayer} Wh  (${playerCount}×)`,
        `${I}¤ Drony: ${work.capDrone} Wh  (${w.drones}×)`,
        `▲ Příjmy +${totalIncome} Wh:`,
        ...incomeLines,
        `▼ Výdaje -${totalExpense} W:`,
        ...expenseLines,
        `Σ Bilance: +${totalIncome}-${totalExpense} = ${totalIncome >= totalExpense ? "+" : ""}${totalIncome - totalExpense} W`,
      ].join("\n"),
    };
  }

  private slabTooltip(): TooltipContent {
    const w = this.getWorld();
    const foodPct = w.resources.slab.food; // max 100 → pct = value
    const rating = statusRating(foodPct);
    const ratingLabel = STATUS_LABELS[rating];
    return {
      header: `Materiály — ${ratingLabel.cs} (${Math.round(foodPct)}%)`,
      headerColor: RATING_COLOR[rating],
      body: [
        `${formatScalar(w.resources.slab.food)} / 100 S`,
        `≡ Složení:`,
        `   Food: ${formatScalar(w.resources.slab.food)}`,
        `   Metal/Components: P2+`,
        `Σ Spotřeba: per capita (P2+)`,
      ].join("\n"),
    };
  }

  private fluxTooltip(): TooltipContent {
    const w = this.getWorld();
    const airPct = w.resources.flux.air; // max 100 → pct = value
    const rating = statusRating(airPct);
    const ratingLabel = STATUS_LABELS[rating];
    return {
      header: `Tekutiny — ${ratingLabel.cs} (${Math.round(airPct)}%)`,
      headerColor: RATING_COLOR[rating],
      body: [
        `${formatScalar(w.resources.flux.air)} / 100 F`,
        `≡ Složení:`,
        `   Air: ${formatScalar(w.resources.flux.air)} %`,
        `   Water/Coolant: P2+`,
        `Σ Spotřeba: per capita (P2+)`,
      ].join("\n"),
    };
  }

  private coinTooltip(): TooltipContent {
    const w = this.getWorld();
    return {
      header: `Kredit`,
      headerColor: HEX_WARN_ORANGE,
      body: [
        `◎ ${formatScalar(w.resources.coin)}`,
        `Platby, mzdy, směna, stavba.`,
        `Dock cost: ◎ 20`,
        `Σ  Bilance: P2+`,
      ].join("\n"),
    };
  }

  render(): void {
    const w = this.getWorld();
    const time = formatGameTime(w.tick);

    // --- 1) Nejdřív nastavit texty, aby měřené šířky odpovídaly aktuálnímu obsahu ---
    this.iconText.setText("⊙");
    this.appText.setText("VOIDSPAN");
    this.metaText.setText(
      `v${pkg.version} Teegarden.Belt1.Seg042 ${time}`,
    );

    // Resource bary — Energy skalár + Work derivovaný + Slab/Flux/Coin z modelu.
    // Kapacity 100 pro S/F jsou UI strop — model zatím max necaptuje (P2+ rozšíření).
    const work = computeWork(w);
    const parts: string[] = [
      formatResource(w.resources.energy, w.energyMax, "E"),
      `${work.powerMax}/${work.capMax} W`,
      formatResource(w.resources.slab.food, 100, "S"),
      formatResource(w.resources.flux.air, 100, "F"),
      `◎ ${formatScalar(w.resources.coin)}`,
    ];
    // Dashboard semafor (S18) — barva podle prahu metricColor(pct, inverted?).
    // Index pořadí drží pořadí parts[]: 0=E, 1=W, 2=S, 3=F, 4=Coin.
    const energyPct = w.energyMax > 0 ? (w.resources.energy / w.energyMax) * 100 : 0;
    const hpSumAll = w.actors.filter(a => a.state !== "dead").reduce((s, a) => s + a.hp, 0);
    const hpMaxAll = w.actors.filter(a => a.state !== "dead").reduce((s, a) => s + a.hp_max, 0);
    const workFullCap = hpMaxAll + w.drones;
    const workPct = workFullCap > 0 ? ((hpSumAll + work.capDrone) / workFullCap) * 100 : 0;
    const foodPct = w.resources.slab.food; // max 100 → pct = value
    const airPct = w.resources.flux.air;   // max 100 → pct = value
    const colors: string[] = [
      metricColor(energyPct),
      metricColor(workPct),
      metricColor(foodPct),
      metricColor(airPct),
      HEX_WARN_ORANGE, // Coin: placeholder oranžová (P2+ = porovnání income/expense)
    ];

    for (let i = 0; i < parts.length; i++) {
      const t = this.resourceTexts[i];
      if (t) {
        t.setText(parts[i]);
        const c = colors[i];
        if (c) t.setColor(c);
      }
    }

    // --- 2) Změřit celkovou šířku bloku a spočítat počáteční X pro centrování ---
    const GAP_APP = 0;       // mezi ikonou a VOIDSPAN — slepené
    const GAP_META = 8;      // mezi VOIDSPAN a meta
    const GAP_META_RES = 32; // mezi meta a prvním resource
    const GAP_RES = 24;      // mezi resource bary

    let totalW =
      this.iconText.width +
      GAP_APP +
      this.appText.width +
      GAP_META +
      this.metaText.width +
      GAP_META_RES;
    for (let i = 0; i < this.resourceTexts.length; i++) {
      totalW += this.resourceTexts[i]?.width ?? 0;
      if (i < this.resourceTexts.length - 1) totalW += GAP_RES;
    }

    // --- 3) Pozicování od středu plátna ---
    let x = Math.round((CANVAS_W - totalW) / 2);
    this.iconText.setX(x);
    x += this.iconText.width + GAP_APP;
    this.appText.setX(x);
    x += this.appText.width + GAP_META;
    this.metaText.setX(x);
    x += this.metaText.width + GAP_META_RES;
    for (const t of this.resourceTexts) {
      if (!t) continue;
      t.setX(x);
      x += t.width + GAP_RES;
    }
  }
}
