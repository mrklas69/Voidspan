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

new Phaser.Game(config);
