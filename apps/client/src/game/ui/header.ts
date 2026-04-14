// HeaderPanel — Top Bar (HUD).
// Obsah: ⊙ ikona + VOIDSPAN + meta (verze, adresa, herní čas) + 5 resource bars + Help tlačítko.
// Model-first: čte z `getWorld()`, tooltips dynamické.

import Phaser from "phaser";
import pkg from "../../../package.json";
import type { World } from "../model";
import { formatResource, formatScalar } from "../format";
import { formatGameTime, computeWork, ENERGY_MAX } from "../world";
import { ENERGY_SEED } from "../tuning";
import { TooltipManager } from "../tooltip";
import {
  FONT_FAMILY,
  FONT_SIZE_HUD,
  UI_BRAND_ICON,
  HEX_WARN_ORANGE,
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
    const leftProvider = () =>
      `Identita / adresa / herní čas\n\nVersion: v${pkg.version}\nBelt day = 16 game hours\nTick = 1 game minute\nLOSS triggers highlight inline`;
    tooltips.attach(this.iconText, leftProvider);
    tooltips.attach(this.appText, leftProvider);
    tooltips.attach(this.metaText, leftProvider);

    // Resource bars tooltips — live z `getWorld()`.
    const resourceTooltips: Array<() => string> = [
      () => {
        const e = this.getWorld().resources.energy;
        return (
          "Energy — baterie pásu [E]\n" +
          `${formatScalar(e)} / ${ENERGY_MAX} Wh\n\n` +
          `Seed ${ENERGY_SEED} Wh (S16 kalibrace).\n` +
          "V P1 statická — produkce/spotřeba P2+."
        );
      },
      () => {
        const w = this.getWorld();
        const work = computeWork(w);
        const working = w.actors.filter((a) => a.state === "working").length;
        return (
          "Work — pracovní kapacita [W]\n" +
          `${formatScalar(work.current)} / ${formatScalar(work.max)} W\n\n` +
          `Aktéři working nyní: ${working} / ${w.actors.length}\n\n` +
          "Derivováno z actors (Σ power_w)."
        );
      },
      () => {
        const r = this.getWorld().resources;
        return (
          "Slab — pevné materiály [S]\n" +
          `${formatScalar(r.slab.food)} / 100 S\n\n` +
          `  Food: ${formatScalar(r.slab.food)}\n` +
          "  (Metal/Components — P2+)\n\n" +
          "Spotřeba: 8 food/game day\n" +
          "(8 osob × 1 food/den)"
        );
      },
      () => {
        const r = this.getWorld().resources;
        return (
          "Flux — kapaliny + plyny [F]\n" +
          `${formatScalar(r.flux.air)} / 100 F\n\n` +
          `  Air: ${formatScalar(r.flux.air)} %\n` +
          "  (Water/Coolant — P2+)\n\n" +
          "Breach = utíká Flux!"
        );
      },
      () => {
        const r = this.getWorld().resources;
        return (
          "Coin [◎] — měna\n" +
          `◎ ${formatScalar(r.coin)}\n\n` +
          "Reprezentuje všechny platby,\n" +
          "mzdy, směnu, tržní operace.\n" +
          "Dock cost: ◎ 20\n\n" +
          "Income/expense history (P2+)."
        );
      },
    ];
    for (let i = 0; i < this.resourceTexts.length; i++) {
      const t = this.resourceTexts[i];
      const provider = resourceTooltips[i];
      if (t && provider) tooltips.attach(t, provider);
    }
  }

  render(): void {
    const w = this.getWorld();
    const time = formatGameTime(w.tick);

    // --- 1) Nejdřív nastavit texty, aby měřené šířky odpovídaly aktuálnímu obsahu ---
    this.iconText.setText("⊙");
    this.appText.setText("VOIDSPAN");
    this.metaText.setText(
      `v${pkg.version} Teegarden.Belt1.Seg042 ${time}${w.loss_reason ? ` // LOSS (${w.loss_reason})` : ""}`,
    );

    // Resource bary — Energy skalár + Work derivovaný + Slab/Flux/Coin z modelu.
    // Kapacity 100 pro S/F jsou UI strop — model zatím max necaptuje (P2+ rozšíření).
    const work = computeWork(w);
    const parts: string[] = [
      formatResource(w.resources.energy, ENERGY_MAX, "E"),
      formatResource(work.current, work.max, "W"),
      formatResource(w.resources.slab.food, 100, "S"),
      formatResource(w.resources.flux.air, 100, "F"),
      `◎ ${formatScalar(w.resources.coin)}`,
    ];
    // Dashboard semafor (S18) — barva podle prahu metricColor(pct, inverted?).
    // Index pořadí drží pořadí parts[]: 0=E, 1=W, 2=S, 3=F, 4=Coin.
    const energyPct = (w.resources.energy / ENERGY_MAX) * 100;
    const workPct = work.max > 0 ? (work.current / work.max) * 100 : 0;
    const foodPct = w.resources.slab.food; // max 100 → pct = value
    const airPct = w.resources.flux.air;   // max 100 → pct = value
    const colors: string[] = [
      metricColor(energyPct),
      metricColor(workPct, /* inverted */ true),
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
