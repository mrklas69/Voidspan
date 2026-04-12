// GameScene — hlavní herní scéna P1 POC.
// S9 scope: tick loop 250 ms + FSM + debug HUD. Žádný grid UI, žádné sprity, žádný input
// kromě debug kláves. Cíl: vidět tiknout čísla a projít všemi stavy FSM.

import Phaser from "phaser";
import {
  createInitialWorld,
  stepWorld,
  startGame,
  repairDone,
  dockComplete,
  endDay,
  phaseLabel,
  TICK_MS,
} from "./world";
import type { World } from "./types";

export class GameScene extends Phaser.Scene {
  private world!: World;

  // Akumulátor wall-time v ms od posledního logického ticku.
  // Phaser `update(time, delta)` volá ~60×/s — my chceme 4×/s, tak kumulujeme.
  private accumulator = 0;

  private hud?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "game" });
  }

  create(): void {
    this.world = createInitialWorld();

    // HUD — monospace, vlevo nahoře. Jedna multiline text, refresh každý frame.
    this.hud = this.add.text(20, 20, "", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#d0d0d0",
      lineSpacing: 4,
    });

    // Nápověda s debug klávesami — mimo HUD, statická.
    this.add.text(
      20,
      640,
      [
        "[SPACE] start (boot→A)   [R] repair done (A→B)",
        "[E] dock complete (B→C)  [W] end day (C→WIN)",
        "[F5] refresh = new game",
      ].join("\n"),
      {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#666666",
        lineSpacing: 4,
      }
    );

    // Debug klávesy. `?.` — keyboard plugin může být undefined (defenzivní zápis).
    const kb = this.input.keyboard;
    kb?.on("keydown-SPACE", () => startGame(this.world));
    kb?.on("keydown-R", () => repairDone(this.world));
    kb?.on("keydown-E", () => dockComplete(this.world));
    kb?.on("keydown-W", () => endDay(this.world));
  }

  override update(_time: number, delta: number): void {
    // Akumulátor pattern — dokud je v něm víc než TICK_MS, spotřebuj jeden tick.
    // Když FPS klesne, doženeme víc ticků najednou; deterministický vůči FPS.
    this.accumulator += delta;
    while (this.accumulator >= TICK_MS) {
      stepWorld(this.world);
      this.accumulator -= TICK_MS;
    }

    this.renderHud();
  }

  private renderHud(): void {
    if (!this.hud) return;
    const w = this.world;

    // Čas ve wall-second od startu phase_a (tick × 0.25s). Čistě informativně.
    const wallSec = (w.tick * TICK_MS) / 1000;

    const lines = [
      `VOIDSPAN // ${phaseLabel(w.phase)}${w.loss_reason ? ` (${w.loss_reason})` : ""}`,
      `tick ${w.tick}  (${wallSec.toFixed(1)} s wall)`,
      "",
      `air    ${w.resources.air.toFixed(1)} %`,
      `food   ${w.resources.food.toFixed(2)}`,
      `kredo  ${w.resources.kredo}`,
    ];
    this.hud.setText(lines);
  }
}
