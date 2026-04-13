// Vstupní bod klientské aplikace.
// Bootstrap Phaseru + registrace scén. POC_P1 §12 (pure client), §16 (1280×720 baseline).

import Phaser from "phaser";
import { GameScene } from "./game/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#0a0a0a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [GameScene],
  // pixelArt: true → nearest-neighbor scaling pro 40×40 pixel art.
  pixelArt: true,
};

// Počkej, než browser doručí VT323 (Google Fonts async).
// Bez toho Phaser nakreslí texty fallback monospacem a teprve při prvním
// setText po doručení fontu se re-vykreslí s VT323 — viditelný font swap
// ve chvíli, kdy se texty začnou měnit (tick teče po SPACE). Po načtení
// fontu startujeme Phaser deterministicky.
async function boot(): Promise<void> {
  if (document.fonts && typeof document.fonts.load === "function") {
    try {
      // Načti všechny používané velikosti VT323 naráz — každá velikost je
      // zvlášť font face entry (browser cache per-size).
      await Promise.all([
        document.fonts.load("16px VT323"),
        document.fonts.load("18px VT323"),
        document.fonts.load("20px VT323"),
        document.fonts.load("22px VT323"),
        document.fonts.load("28px VT323"),
        document.fonts.load("36px VT323"),
      ]);
    } catch {
      // I když font load selže (offline / síť), spustíme hru s fallback fontem —
      // lepší degradace než nekonečný wait.
    }
  }
  new Phaser.Game(config);
}

boot();
