// HeaderPanel — Top Bar (HUD).
// Obsah: ⊙ ikona + VOIDSPAN + meta (verze, adresa, herní čas) + 5 resource bars + Help tlačítko.
// Model-first: čte z `getWorld()`, tooltips dynamické.

import Phaser from "phaser";
import pkg from "../../../package.json";
import type { World } from "../model";
import { formatResource, formatScalar } from "../format";
import { formatGameTime } from "../world";
import { TooltipManager } from "../tooltip";
import {
  FONT_FAMILY,
  FONT_SIZE_HUD,
  UI_BRAND_ICON,
} from "../palette";
import { CANVAS_W, HUD_ROW_Y, COL_TEXT, COL_TEXT_DIM, COL_TEXT_ACCENT } from "./layout";

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
      color: COL_TEXT_ACCENT,
    });
    this.metaText = scene.add.text(0, HUD_ROW_Y, "", {
      ...baseStyle,
      color: COL_TEXT_DIM,
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

    // Resource bars tooltips — s kvantifikací subtypů (demo data do doby napojení na model).
    const resourceTooltips: Array<() => string> = [
      () =>
        "Energy — baterie pásu [E]\n" +
        "0.15 / 12 E  (1.2 %)\n\n" +
        "Výroba:  +0.30 E/tick  (2× SolarArray)\n" +
        "Spotřeba: -0.15 E/tick\n" +
        "Trend: +0.15 E/tick (nabíjí)",
      () =>
        "Work — pracovní kapacita [W]\n" +
        "18 / 32 W  (56 %)\n\n" +
        "Player:       8 W  (idle)\n" +
        "Constructor:  3×12 = 36 W\n" +
        "Hauler:       2×8 = 16 W\n" +
        "Working nyní: 18 W (2 aktéři)",
      () =>
        "Slab — pevné materiály [S]\n" +
        "45 / 100 S  (45 %)\n\n" +
        "  Food:         40\n" +
        "  Metal:         5\n" +
        "  Components:    0\n\n" +
        "Spotřeba: 8 food/game day\n" +
        "(8 osob × 1 food/den)",
      () =>
        "Flux — kapaliny + plyny [F]\n" +
        "80 / 120 F  (67 %)\n\n" +
        "  Air:        60\n" +
        "  Water:      15\n" +
        "  Coolant:     5\n\n" +
        "Breach = utíká Flux!",
      () =>
        "Coin [◎] — měna\n" +
        "◎ 20\n\n" +
        "Reprezentuje všechny platby,\n" +
        "mzdy, směnu, tržní operace.\n" +
        "Dock cost: ◎ 20\n\n" +
        "Income/expense history (P2+).",
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

    // Resource bary (demo seedy — TODO: napojit na w.resources.*).
    const parts: string[] = [
      formatResource(0.15, 12, "E"),
      formatResource(18, 32, "W"),
      formatResource(45, 100, "S"),
      formatResource(80, 120, "F"),
      `◎ ${formatScalar(20)}`,
    ];
    for (let i = 0; i < parts.length; i++) {
      const t = this.resourceTexts[i];
      if (t) t.setText(parts[i]);
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
