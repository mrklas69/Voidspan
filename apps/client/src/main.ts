// Vstupní bod klientské aplikace.
// Bootstrap Phaseru + registrace scén. POC_P1 §12 (pure client), §16 (1280×720 baseline).
//
// Scéna se volí přes URL query: `?scene=artref` → ArtRefScene (grid export pro art pipeline).
// Default (bez query) → GameScene (hlavní hra).

import Phaser from "phaser";
import { GameScene } from "./game/GameScene";
import { ArtRefScene } from "./game/ArtRefScene";

// URLSearchParams — standard browser API pro parsování `?key=value`.
// window.location.search = "?scene=artref" (včetně `?`).
const params = new URLSearchParams(window.location.search);
const sceneParam = params.get("scene");

// Vybereme startovací scénu. Obě musí být registrované v `scene` array,
// jinak `this.scene.start(key)` nenašel by cíl — ale startuje se první v seznamu.
// Proto dáváme zvolenou scénu jako první.
const startScene = sceneParam === "artref" ? ArtRefScene : GameScene;
const otherScene = sceneParam === "artref" ? GameScene : ArtRefScene;

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
  scene: [startScene, otherScene],
  // WebGL musí zachovat drawing buffer — jinak `snapshotArea` v ArtRefScene
  // vrací prázdno. Pro GameScene neškodí.
  render: {
    preserveDrawingBuffer: true,
  },
};

new Phaser.Game(config);
