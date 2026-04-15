// Vstupní bod klientské aplikace.
// Bootstrap Phaseru + registrace scén. POC_P1 §12 (pure client), §16 (1280×720 baseline).

import Phaser from "phaser";
import { GameScene } from "./game/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  // Canvas bg = HEX_VOID_BLACK (slot 01, #0a0a10) — "vnitřek" = hvězdné pole
  // (BackgroundSystem na něm kreslí řídké hvězdy). Letterbox kolem canvasu drží
  // CSS body na HEX_HULL_DARK (slot 02) — "chrom kolem". Izomorfní rozlišení
  // venku/uvnitř herní plochy.
  backgroundColor: "#0a0a10",
  scale: {
    mode: Phaser.Scale.FIT,
    // CENTER_HORIZONTALLY (ne CENTER_BOTH): když je viewport užší než 1280/720 ratio,
    // FIT zmenší canvas → vznikne vertical slack. CENTER_BOTH by hru nechal plavat
    // uprostřed (viz mobile landscape). Horizontálně centrujeme, vertikálně drží top
    // (spolu s align-items: flex-start v CSS).
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    width: 1280,
    height: 720,
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
