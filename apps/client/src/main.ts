// Vstupní bod klientské aplikace.
// Bootstrap Phaseru + registrace scén. POC_P1 §12 (pure client), §16 (1280×720 baseline).

import Phaser from "phaser";
import { GameScene } from "./game/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  // Canvas bg = HEX_VOID_BLACK (slot 01, #0a0a10) — "vnitřek" = hvězdné pole.
  backgroundColor: "#0a0a10",
  scale: {
    // S24 Responsive Layout axiom: canvas = viewport. GameScene reaguje na
    // scale.on("resize") a volá recomputeLayout() + relayout všech panelů.
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [GameScene],
  // pixelArt: true → nearest-neighbor scaling pro 40×40 pixel art.
  pixelArt: true,
};

// Počkej, než browser doručí Jersey 25 (Google Fonts async).
// Bez toho Phaser nakreslí texty fallback monospacem a teprve při prvním
// setText po doručení fontu se re-vykreslí — viditelný font swap. Po načtení
// fontu startujeme Phaser deterministicky.
async function boot(): Promise<void> {
  if (document.fonts && typeof document.fonts.load === "function") {
    try {
      // Načti všechny používané velikosti naráz — každá velikost je
      // zvlášť font face entry (browser cache per-size).
      await Promise.all([
        document.fonts.load('16px "Jersey 25"'),
        document.fonts.load('18px "Jersey 25"'),
        document.fonts.load('20px "Jersey 25"'),
        document.fonts.load('22px "Jersey 25"'),
        document.fonts.load('28px "Jersey 25"'),
        document.fonts.load('36px "Jersey 25"'),
      ]);
    } catch {
      // I když font load selže (offline / síť), spustíme hru s fallback fontem —
      // lepší degradace než nekonečný wait.
    }
  }
  const game = new Phaser.Game(config);

  // Přepočet layoutu při otočení zařízení (mobilní Safari fallback —
  // orientationchange se občas nepropaguje jako resize).
  window.addEventListener("orientationchange", () => {
    setTimeout(() => game.scale.refresh(), 200);
  });
}

boot();
