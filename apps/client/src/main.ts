// Vstupní bod klientské aplikace.
// Bootstrap Phaseru + registrace scén. POC_P1 §12 (pure client), §16 (1280×720 baseline).

import Phaser from "phaser";
import { BootScene } from "./game/BootScene";

// Konfigurace Phaser hry.
// `type: AUTO` — Phaser zvolí WebGL, při nedostupnosti spadne na Canvas.
// `parent: "game"` — cílový DOM uzel z index.html.
// `scale.mode: FIT` — zachovat poměr 1280×720 a škálovat do okna.
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
  scene: [BootScene],
  // WebGL context musí zachovat drawing buffer mezi framy, jinak `snapshotArea`
  // vrací prázdný (bílý) obrázek — buffer je po swapu cleared. Nutné pro export PNG.
  render: {
    preserveDrawingBuffer: true,
  },
};

// Pozn.: Phaser.Game konstruktor hned startuje hlavní smyčku, proto netřeba žádné .start().
new Phaser.Game(config);
