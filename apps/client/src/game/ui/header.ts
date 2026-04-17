// HeaderPanel — Top Bar (HUD).
// Obsah: ⊙ ikona (Phaser Graphics, font-independent) + VOIDSPAN + meta + 5 resource bars.
// Model-first: čte z `getWorld()`, tooltips dynamické.

import Phaser from "phaser";
import pkg from "../../../package.json";
import type { World } from "../model";
import { MODULE_DEFS, STATUS_LABELS, statusRating, isProductiveTask } from "../model";
import { formatResource, formatScalar } from "../format";
import { formatGameTime, computeWork, averageFlow, currentDayRate, formatEta } from "../world";
import { TOOLTIP_LIST_MAX_ITEMS, SOLIDS_MAX, FLUIDS_MAX, FLOW_WINDOW_GAME_DAYS, TICKS_PER_GAME_DAY } from "../tuning";
import { TooltipManager, type TooltipContent } from "../tooltip";
import {
  FONT_FAMILY,
  FONT_SIZE_CHROME,
  UI_BRAND_ICON,
  COL_WARN_ORANGE,
  HEX_WARN_ORANGE,
  RATING_COLOR,
  ratingColor,
} from "../palette";
import { CANVAS_W, HUD_ROW_Y, COL_TEXT, COL_TEXT_ACCENT } from "./layout";
import { BrandIcon } from "./brand_icon";

// Vertikální offset BrandIcon, aby kroužek opticky seděl s baseline VT323.
// HUD_ROW_Y je top textu; ikona má height 26 px, písmo HUD ~24 px → +2 nahoru.
const BRAND_Y_OFFSET = -2;

export class HeaderPanel {
  private iconBrand: BrandIcon;
  private appText: Phaser.GameObjects.Text;
  private metaText: Phaser.GameObjects.Text;
  private resourceTexts: Phaser.GameObjects.Text[] = [];

  constructor(
    scene: Phaser.Scene,
    private getWorld: () => World,
  ) {
    const baseStyle = {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_CHROME,
    };

    // Top Bar: ⊙ ikona (Graphics, nezávislá na fontu) + AppName + meta + 5 resource bars.
    // Pozice se dopočítávají v render() — celý blok je horizontálně vycentrovaný.
    this.iconBrand = new BrandIcon(scene, 0, HUD_ROW_Y + BRAND_Y_OFFSET, COL_WARN_ORANGE);
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
      `Server: ${env}\nVersion: v${pkg.version} (${__BUILD_ID__})\nWorld: Teegarden.Belt1.Seg042`;
    tooltips.attach(this.iconBrand, identityProvider);
    tooltips.attach(this.appText, identityProvider);
    tooltips.attach(this.metaText, identityProvider);

    // Resource bars tooltips — live z `getWorld()`.
    // Coin (index 4): infotip nepoužíván (S26) — nespotřebovává/nedoplňuje se
    // v FVP. Hover text chybí záměrně, žlutá barva = placeholder status.
    const resourceTooltips: Array<(() => string | TooltipContent) | null> = [
      () => this.energyTooltip(),
      () => this.workTooltip(),
      () => this.solidsTooltip(),
      () => this.fluidsTooltip(),
      null, // Coin — bez tooltipu
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

    // Agregace online modulů podle kind — součet cap/power + průměrné HP%.
    // Bez ID (insignifikantní v seznamech) — jedna řádka per kind, count v suffixu.
    const agg = new Map<string, { kind: string; count: number; capSum: number; pwSum: number; hpSum: number }>();
    for (const mod of Object.values(w.modules)) {
      if (mod.status !== "online") continue;
      const entry = agg.get(mod.kind) ?? { kind: mod.kind, count: 0, capSum: 0, pwSum: 0, hpSum: 0 };
      const hpRatio = mod.hp_max > 0 ? mod.hp / mod.hp_max : 0;
      entry.count += 1;
      entry.capSum += (MODULE_DEFS[mod.kind].capacity_wh ?? 0) * hpRatio;
      entry.pwSum += MODULE_DEFS[mod.kind].power_w * hpRatio;
      entry.hpSum += hpRatio;
      agg.set(mod.kind, entry);
    }
    const capMods: Array<{ name: string; cap: number; hpPct: number }> = [];
    const income: Array<{ name: string; pw: number; hpPct: number }> = [];
    const expense: Array<{ name: string; pw: number; hpPct: number }> = [];
    for (const a of agg.values()) {
      const hpPct = Math.round((a.hpSum / a.count) * 100);
      const name = a.count > 1 ? `${a.kind} ×${a.count}` : a.kind;
      if (a.capSum > 0) capMods.push({ name, cap: a.capSum, hpPct });
      if (a.pwSum > 0) income.push({ name, pw: a.pwSum, hpPct });
      else if (a.pwSum < 0) expense.push({ name, pw: a.pwSum, hpPct });
    }
    // Nabíjení dronů — 1 dron = 1 W při práci na productive tasku.
    const droneCharge = w.tasks.some(isProductiveTask) && w.resources.energy > 0 ? w.drones : 0;
    if (droneCharge > 0) {
      expense.push({ name: `Nabíjení dronů (${w.drones}×)`, pw: -droneCharge, hpPct: 100 });
    }
    // Software load — každý running SW běží kontinuálně (příkon per verze).
    if (w.resources.energy > 0) {
      for (const sw of Object.values(w.software)) {
        if (sw.status === "running") {
          expense.push({ name: `${sw.name} ${sw.version}`, pw: -sw.draw_w, hpPct: 100 });
        }
      }
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
        `Kapacita ${w.energyMax} Wh:`,
        ...fmtCapList(capMods),
        `Příjmy +${totalIncome.toFixed(1)} W:`,
        ...fmtList(income, "+"),
        `Výdaje ${totalExpense.toFixed(1)} W:`,
        ...fmtList(expense, "-"),
        `Bilance: ${netSign}${net.toFixed(1)} W`,
      ].join("\n"),
    };
  }

  private workTooltip(): TooltipContent {
    const w = this.getWorld();
    const work = computeWork(w);
    // Rating sdílí metriku s Top Bar ukazatelem (availability/max), ne max kapacita.
    const pct = work.powerMax > 0 ? Math.round((work.powerAvailable / work.powerMax) * 100) : 0;
    const rating = statusRating(pct);
    const ratingLabel = STATUS_LABELS[rating];

    const I = "   ";
    const playerCount = w.actors.filter(a => a.state !== "dead").length;
    const droneOnline = w.resources.energy > 0;

    // Výdaje: per-task hráčský výkon + jediná sdílená řádka pro drone pool.
    const activeTasks = w.tasks.filter(isProductiveTask);
    const dronesWorking = droneOnline && activeTasks.length > 0;

    const expenseLines: string[] = [];
    let totalPlayerW = 0;
    for (const task of activeTasks) {
      let taskPlayerW = 0;
      for (const aid of task.assigned) {
        const a = w.actors.find(x => x.id === aid);
        if (a && a.state === "working") taskPlayerW += a.work;
      }
      totalPlayerW += taskPlayerW;
      if (taskPlayerW > 0) {
        const pctDone = task.wd_total > 0 ? Math.round((task.wd_done / task.wd_total) * 100) : 0;
        expenseLines.push(`${I}${task.kind} (${task.id})  -${taskPlayerW} W  ${pctDone}%`);
      }
    }
    const droneExpense = dronesWorking ? w.drones : 0;
    if (droneExpense > 0) {
      const targets = activeTasks.map(t => t.id).join(", ");
      expenseLines.push(`${I}Drony (${w.drones}×) > ${targets}  -${droneExpense} W`);
    }
    if (expenseLines.length === 0) expenseLines.push(`${I}(žádné aktivní tasky)`);
    const totalExpense = totalPlayerW + droneExpense;

    // Příjmy mirror výdajů — W je flux, ne stock (hráči → HP, drony → E).
    const incomeLines: string[] = [
      `${I}Hráči < Food: ${totalPlayerW} W${totalPlayerW > 0 ? "" : "  (nepracují)"}`,
      `${I}Drony < E: ${droneExpense} W${dronesWorking ? "" : droneOnline ? "  (nepracují)" : "  OFFLINE"}`,
    ];
    const totalIncome = totalPlayerW + droneExpense;

    return {
      header: `Práce — ${ratingLabel.cs} (${pct}%)`,
      headerColor: RATING_COLOR[rating],
      body: [
        `Výkon: ${work.powerAvailable}/${work.powerMax} W  využito: ${work.powerUsed} W`,
        `Kapacita: ${work.capMax} Wh  (hráči ${work.capPlayer} + drony ${work.capDrone})`,
        `Kapacita ${work.capMax} Wh:`,
        `${I}Hráči: ${work.capPlayer} Wh  (${playerCount}×)`,
        `${I}Drony: ${work.capDrone} Wh  (${w.drones}×)`,
        `Příjmy +${totalIncome} W:`,
        ...incomeLines,
        `Výdaje -${totalExpense} W:`,
        ...expenseLines,
        `Bilance: +${totalIncome}-${totalExpense} = ${totalIncome >= totalExpense ? "+" : ""}${totalIncome - totalExpense} W`,
      ].join("\n"),
    };
  }

  private solidsTooltip(): TooltipContent {
    return this.stockTooltip("solids", "Pevné", "S", SOLIDS_MAX, (w) => w.resources.solids);
  }

  private fluidsTooltip(): TooltipContent {
    return this.stockTooltip("fluids", "Tekutiny", "F", FLUIDS_MAX, (w) => w.resources.fluids);
  }

  // Unified stock tooltip pro S/F (S26 KPI controlling).
  // Struktura paralelní k E: Kapacita / Příjmy / Výdaje / Bilance / Runway.
  // Průměry za posledních FLOW_WINDOW_GAME_DAYS game days (rolling window).
  private stockTooltip(
    cat: "solids" | "fluids",
    labelCs: string,
    unit: "S" | "F",
    max: number,
    getCurrent: (w: World) => number,
  ): TooltipContent {
    const w = this.getWorld();
    const current = getCurrent(w);
    const pct = max > 0 ? Math.round((current / max) * 100) : 0;
    const rating = statusRating(pct);
    const ratingLabel = STATUS_LABELS[rating];

    // S31: když okno ještě neprobublalo (filled === 0), fallback na partial
    // today extrapolaci — uživatel vidí "co se děje teď", ne 0.
    const usePartial = w.flow.filled === 0;
    const avgIn = usePartial ? currentDayRate(w, cat, "in") : averageFlow(w, cat, "in");
    const avgOut = usePartial ? currentDayRate(w, cat, "out") : averageFlow(w, cat, "out");
    const net = avgIn - avgOut;

    const windowLabel = usePartial
      ? `(dnes zatím)`
      : `(avg ${w.flow.filled}/${FLOW_WINDOW_GAME_DAYS}d)`;

    const activeRepairs = w.tasks.filter((t) => t.status === "active" && t.kind === "repair").length;
    const I = "   ";

    // Runway — absolutní čas do vyprázdnění / naplnění přes formatEta (ticks).
    // EPS drží bilanci „stabilní" v neutrálním pásmu (zaokrouhlovací šum flow).
    const EPS = 0.001;
    let runwayLine: string;
    if (Math.abs(net) < EPS) {
      runwayLine = `Runway: stabilní`;
    } else if (net > 0) {
      const daysToFull = (max - current) / net;
      if (current >= max) runwayLine = `Runway: naplněno`;
      else runwayLine = `Runway: naplní za ${formatEta(daysToFull * TICKS_PER_GAME_DAY)}`;
    } else {
      const daysToEmpty = current / Math.abs(net);
      if (current <= 0) runwayLine = `Runway: vyčerpáno`;
      else runwayLine = `Runway: vyprázdní za ${formatEta(daysToEmpty * TICKS_PER_GAME_DAY)}`;
    }

    const incomeLines: string[] = [];
    if (avgIn <= 0) incomeLines.push(`${I}(žádné — P2+ kapsle/recyklace/producer)`);
    else incomeLines.push(`${I}… +${avgIn.toFixed(2)} ${unit}/d`);

    const expenseLines: string[] = [];
    if (avgOut <= 0) {
      expenseLines.push(`${I}(žádné aktivní výdaje)`);
    } else {
      const repairLabel = activeRepairs > 0
        ? `Opravy (${activeRepairs}×): per recipe`
        : `Opravy: per recipe (průměr z okna)`;
      expenseLines.push(`${I}${repairLabel}  -${avgOut.toFixed(2)} ${unit}/d`);
    }

    const netSign = net >= 0 ? "+" : "";

    return {
      header: `${labelCs} — ${ratingLabel.cs} (${pct}%)`,
      headerColor: RATING_COLOR[rating],
      body: [
        `${formatScalar(current)} / ${max} ${unit}`,
        `Kapacita ${max} ${unit}  (FVP fix)`,
        `Příjmy ${windowLabel}: +${avgIn.toFixed(2)} ${unit}/d`,
        ...incomeLines,
        `Výdaje ${windowLabel}: -${avgOut.toFixed(2)} ${unit}/d`,
        ...expenseLines,
        `Bilance: ${netSign}${net.toFixed(2)} ${unit}/d`,
        runwayLine,
      ].join("\n"),
    };
  }

  render(): void {
    const w = this.getWorld();
    const time = formatGameTime(w.tick);

    // --- 1) Nejdřív nastavit texty, aby měřené šířky odpovídaly aktuálnímu obsahu ---
    // Brand ikona je Graphics, kreslí se jen jednou v constructoru — žádný setText.
    this.appText.setText("VOIDSPAN");
    this.metaText.setText(
      `v${pkg.version} Teegarden.Belt1.Seg042 ${time}`,
    );

    // Resource bary — Energy skalár + Work derivovaný + Solids/Fluids/Coin z modelu.
    // S26 FVP KISS: S/F jsou ploché hodnoty (0..100), bez subtypů.
    const work = computeWork(w);
    const parts: string[] = [
      formatResource(w.resources.energy, w.energyMax, "E"),
      // S24: available/total W — 0/23 při práci dronů, 23/23 při idle.
      `${work.powerAvailable}/${work.powerMax} W`,
      formatResource(w.resources.solids, SOLIDS_MAX, "S"),
      formatResource(w.resources.fluids, FLUIDS_MAX, "F"),
      `◎ ${formatScalar(w.resources.coin)}`,
    ];
    // Dashboard semafor — barva v baru sdílí metriku s barvou v tooltip headeru.
    // Index pořadí drží pořadí parts[]: 0=E, 1=W, 2=S, 3=F, 4=Coin.
    // W pct = availability/max (shoda s ukazatelem 0/23 při plné zátěži).
    const energyPct = w.energyMax > 0 ? (w.resources.energy / w.energyMax) * 100 : 0;
    const workPct = work.powerMax > 0 ? (work.powerAvailable / work.powerMax) * 100 : 0;
    const colors: string[] = [
      ratingColor(energyPct),
      ratingColor(workPct),
      ratingColor(w.resources.solids),
      ratingColor(w.resources.fluids),
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
    const GAP_APP = 4;       // mezi ⊙ ikonou a VOIDSPAN
    const GAP_META = 8;      // mezi VOIDSPAN a meta
    const GAP_META_RES = 32; // mezi meta a prvním resource
    const GAP_RES = 24;      // mezi resource bary

    let totalW =
      BrandIcon.WIDTH +
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
    this.iconBrand.setX(x);
    x += BrandIcon.WIDTH + GAP_APP;
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
