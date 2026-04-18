// SpeedPopover — Top Bar klikací popover pro volbu rychlosti herního času.
// 3 tlačítka (×1 / ×10 / ×100), aktivní zvýrazněné cyan (task-style = probíhá).
// Otevírá se klikem na meta text v Top Baru; zavírá se klikem mimo, ESC nebo
// volbou. Persistence: žádná — reload vrací ×1 (úmyslné).

import Phaser from "phaser";
import type { TimeSpeed } from "../model";
import {
  FONT_FAMILY,
  FONT_SIZE_CHROME,
  UI_PANEL_BG,
  UI_BORDER_DIM,
  HEX_COOLANT_CYAN,
  UI_TEXT_PRIMARY,
} from "../palette";

const SPEEDS: TimeSpeed[] = [1, 10, 100, 1000];
const PADDING = 10;       // vnitřní odsazení pozadí
const GAP = 16;           // mezera mezi tlačítky
const BTN_H = 28;         // výška aktivní plochy tlačítka (pro odsazení + layout)

export class SpeedPopover {
  private container: Phaser.GameObjects.Container | null = null;
  private outsideHandler?: (pointer: Phaser.Input.Pointer) => void;

  constructor(
    private scene: Phaser.Scene,
    private getSpeed: () => TimeSpeed,
    private setSpeed: (speed: TimeSpeed) => void,
  ) {}

  isOpen(): boolean {
    return this.container !== null;
  }

  // Otevře popover ukotvený horním středem na (anchorX, anchorY).
  // anchorY bývá těsně pod meta textem v Top Baru.
  toggle(anchorX: number, anchorY: number): void {
    if (this.container) {
      this.close();
      return;
    }
    this.open(anchorX, anchorY);
  }

  close(): void {
    if (!this.container) return;
    if (this.outsideHandler) {
      this.scene.input.off("pointerdown", this.outsideHandler);
      this.outsideHandler = undefined;
    }
    this.container.destroy();
    this.container = null;
  }

  private open(anchorX: number, anchorY: number): void {
    const current = this.getSpeed();

    // Vytvoř tlačítka dopředu, abychom změřili jejich šířky a spočítali celkovou
    // šířku popoveru (variabilní podle ×1/×10/×100 glyph stringů).
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_CHROME,
    };
    const buttons = SPEEDS.map((s) => {
      const isActive = s === current;
      const text = this.scene.add
        .text(0, 0, `×${s}`, {
          ...style,
          color: isActive ? HEX_COOLANT_CYAN : UI_TEXT_PRIMARY,
        })
        .setOrigin(0, 0);
      text.setInteractive({ useHandCursor: true });
      text.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // Zabráníme bublání do outsideHandler (ten by popover hned zavřel).
        pointer.event?.stopPropagation();
        this.setSpeed(s);
        this.close();
      });
      return { s, text, w: text.width };
    });

    // Layout: horizontální strip, šířka = 2×PADDING + Σ buttonWidths + (N-1)×GAP.
    const contentW = buttons.reduce((sum, b) => sum + b.w, 0) + GAP * (SPEEDS.length - 1);
    const boxW = contentW + PADDING * 2;
    const boxH = BTN_H + PADDING * 2;

    // Ukotvení: horizontálně centrované na anchorX (nikdy nepřeteče přes hrany —
    // clamp do viewportu přes camera width).
    const camW = this.scene.cameras.main.width;
    let boxX = Math.round(anchorX - boxW / 2);
    boxX = Math.max(4, Math.min(camW - boxW - 4, boxX));
    const boxY = Math.round(anchorY);

    const bg = this.scene.add
      .rectangle(0, 0, boxW, boxH, UI_PANEL_BG, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(1, UI_BORDER_DIM);

    this.container = this.scene.add.container(boxX, boxY).setDepth(300);
    this.container.add(bg);

    // Pozicování tlačítek zleva doprava uvnitř bg.
    let x = PADDING;
    const textY = Math.round((boxH - buttons[0]!.text.height) / 2);
    for (const b of buttons) {
      b.text.setPosition(x, textY);
      this.container.add(b.text);
      x += b.w + GAP;
    }

    // Click outside → close. Delay 1 frame (delayedCall 0), abychom nezachytili
    // právě probíhající klik, kterým byl popover otevřen.
    this.scene.time.delayedCall(0, () => {
      if (!this.container) return;
      this.outsideHandler = (pointer: Phaser.Input.Pointer) => {
        if (!this.container) return;
        const bounds = this.container.getBounds();
        if (!bounds.contains(pointer.x, pointer.y)) this.close();
      };
      this.scene.input.on("pointerdown", this.outsideHandler);
    });
  }
}
