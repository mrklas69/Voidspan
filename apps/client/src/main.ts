// Vstupní bod klientské aplikace.
// Bootstrap Phaseru + registrace scén. Pure client (FVP), baseline 1280×720.

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

// Počkej, než browser doručí Atkinson Hyperlegible (Google Fonts async).
// Bez toho Phaser nakreslí texty fallback fontem a teprve při prvním setText
// po doručení fontu se re-vykreslí — viditelný font swap. Po načtení fontu
// startujeme Phaser deterministicky. (Viz memory feedback_font_preload.md.)
async function boot(): Promise<void> {
  if (document.fonts && typeof document.fonts.load === "function") {
    try {
      // Načti všechny používané velikosti naráz — každá velikost je
      // zvlášť font face entry (browser cache per-size).
      // S29: globální bump -2 px po přechodu na Atkinson Hyperlegible
      // (větší x-height než VT323 → menší velikosti stačí).
      await Promise.all([
        document.fonts.load('16px "Atkinson Hyperlegible"'),
        document.fonts.load('18px "Atkinson Hyperlegible"'),
        document.fonts.load('20px "Atkinson Hyperlegible"'),
        document.fonts.load('22px "Atkinson Hyperlegible"'),
        document.fonts.load('28px "Atkinson Hyperlegible"'),
        document.fonts.load('36px "Atkinson Hyperlegible"'),
        document.fonts.load('48px "Atkinson Hyperlegible"'),
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
