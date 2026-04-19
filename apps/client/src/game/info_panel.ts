// InfoPanel — floating panel layer 3.5, top-left slot. Hotkey [I] toggle.
// Status report kolonie (posádka / drony / základna). 5-color rating header.
// Scroll: pixel-based, stejný pattern jako ModulesPanel.

import Phaser from "phaser";
import type { World } from "@voidspan/shared";
import { STATUS_LABELS, statusRating, isProductiveTask } from "@voidspan/shared";
import type { TooltipManager } from "./tooltip";

import {
  COL_HULL_MID,
  COL_TEXT_WHITE,
  UI_TEXT_PRIMARY,
  UI_MASK_WHITE,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
  RATING_COLOR,
} from "./palette";
import {
  PANEL_PADDING as PADDING,
  PANEL_HEADER_H as HEADER_H,
  SCROLLBAR_W,
  SCROLLBAR_GAP,
  SCROLL_STEP,
} from "./ui/panel_helpers";
import { FloatingPanel } from "./ui/floating_panel";

// Scroll area — starts below rating row, ends at panel bottom.
const SCROLL_TOP = HEADER_H + 28;

export class InfoPanel extends FloatingPanel {
  private getWorld: () => World;

  private ratingLabel!: Phaser.GameObjects.Text;
  private ratingValue!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;

  // Scroll state — pixel-based (Info + Modules sdílejí pattern).
  private scrollContent!: Phaser.GameObjects.Container;
  private scrollH = 0;
  private scrollOffset = 0;
  private maxScroll = 0;
  private scrollTrack!: Phaser.GameObjects.Rectangle;
  private scrollThumb!: Phaser.GameObjects.Rectangle;

  // Touch drag scroll.
  private dragY: number | null = null;
  private dragOffset = 0;

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    super(scene, {
      dockId: "info",
      lsKey: "voidspan.infopanel.open",
      title: "Info",
      slot: "top-left",
    });
    this.getWorld = getWorld;
    this.init();
  }

  protected buildBody(): void {
    this.scrollH = this.panelH - SCROLL_TOP - 4;

    // Rating — fixed nad scroll area.
    this.ratingLabel = this.scene.add
      .text(PADDING, HEADER_H + 4, "Stav základny: ", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_PRIMARY,
      })
      .setOrigin(0, 0)
      .setInteractive();
    this.container.add(this.ratingLabel);

    this.ratingValue = this.scene.add
      .text(0, HEADER_H + 4, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
      })
      .setOrigin(0, 0)
      .setInteractive();
    this.container.add(this.ratingValue);

    // Scrollable content area.
    const contentW = this.panelW - 2 * PADDING - SCROLLBAR_W - SCROLLBAR_GAP;
    this.scrollContent = this.scene.add.container(PADDING, SCROLL_TOP);
    this.container.add(this.scrollContent);

    // S31: hierarchický formát (izomorfní s kvintet tooltips) — labels jako
    // kapitoly (bez odsazení), values jako odsazené podkapitoly.
    this.bodyText = this.scene.add
      .text(0, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_PRIMARY,
        lineSpacing: 6,
        wordWrap: { width: contentW },
      })
      .setOrigin(0, 0);
    this.scrollContent.add(this.bodyText);

    // Geometry mask — clips scrollContent to visible scroll area (world coords).
    const { x, y } = this.computePosition();
    const maskGraphics = this.scene.make.graphics({});
    maskGraphics.fillStyle(UI_MASK_WHITE);
    maskGraphics.fillRect(x + PADDING, y + SCROLL_TOP, contentW, this.scrollH);
    this.scrollContent.setMask(maskGraphics.createGeometryMask());

    // Scrollbar track + thumb (v hlavním containeru, ne scrollContent).
    const sbX = this.panelW - SCROLLBAR_W - 4;
    this.scrollTrack = this.scene.add
      .rectangle(sbX, SCROLL_TOP, SCROLLBAR_W, this.scrollH, COL_HULL_MID, 0.3)
      .setOrigin(0, 0)
      .setVisible(false);
    this.container.add(this.scrollTrack);

    this.scrollThumb = this.scene.add
      .rectangle(sbX, SCROLL_TOP, SCROLLBAR_W, 30, COL_TEXT_WHITE, 0.5)
      .setOrigin(0, 0)
      .setVisible(false)
      .setInteractive({ useHandCursor: true, draggable: true });
    this.scene.input.setDraggable(this.scrollThumb);
    this.scrollThumb.on("drag", (_p: Phaser.Input.Pointer, _dragX: number, dragY: number) => {
      if (this.maxScroll <= 0) return;
      const thumbH = this.scrollThumb.height;
      const travel = this.scrollH - thumbH;
      const clampedY = Math.max(SCROLL_TOP, Math.min(SCROLL_TOP + travel, dragY));
      const ratio = travel > 0 ? (clampedY - SCROLL_TOP) / travel : 0;
      this.setScroll(ratio * this.maxScroll);
    });
    this.container.add(this.scrollThumb);

    // Klik na track = skok na pozici.
    this.scrollTrack.setInteractive({ useHandCursor: true });
    this.scrollTrack.on("pointerdown", (_p: Phaser.Input.Pointer, _lx: number, ly: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      if (this.maxScroll <= 0) return;
      const thumbH = this.scrollThumb.height;
      const travel = this.scrollH - thumbH;
      const ratio = Math.max(0, Math.min(1, (ly - thumbH / 2) / travel));
      this.setScroll(ratio * this.maxScroll);
    });

    // Wheel scroll — scene-level, bounds check na panel.
    this.scene.input.on("wheel", (pointer: Phaser.Input.Pointer, _objs: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (!this.isOpen() || this.maxScroll <= 0) return;
      if (!this.isPointerInBounds(pointer)) return;
      this.setScroll(this.scrollOffset + (dy > 0 ? SCROLL_STEP : -SCROLL_STEP));
    });

    // Touch drag scroll — scene-level move/up.
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.dragY === null || !this.isOpen()) return;
      const dy = this.dragY - pointer.y;
      this.setScroll(this.dragOffset + dy);
    });

    this.scene.input.on("pointerup", () => {
      this.dragY = null;
    });
  }

  // Base volá při pointerdown na bg — startuje drag scroll.
  protected override onBgPointerDown(p: Phaser.Input.Pointer): void {
    this.dragY = p.y;
    this.dragOffset = this.scrollOffset;
  }

  protected override onOpen(): void {
    this.scrollOffset = 0;
    this.dragY = null;
  }

  protected override onClose(): void {
    this.dragY = null;
  }

  private setScroll(next: number): void {
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, next));
    this.scrollContent.y = SCROLL_TOP - this.scrollOffset;
    this.updateScrollbar();
  }

  private updateScrollbar(): void {
    if (this.maxScroll <= 0) {
      this.scrollTrack.setVisible(false);
      this.scrollThumb.setVisible(false);
      return;
    }
    this.scrollTrack.setVisible(true);
    this.scrollThumb.setVisible(true);
    const ratio = this.scrollH / (this.scrollH + this.maxScroll);
    const thumbH = Math.max(20, Math.floor(this.scrollH * ratio));
    const travel = this.scrollH - thumbH;
    const pos = this.maxScroll > 0 ? (this.scrollOffset / this.maxScroll) * travel : 0;
    this.scrollThumb.setSize(SCROLLBAR_W, thumbH);
    this.scrollThumb.setY(SCROLL_TOP + pos);
  }

  attachTooltips(tooltips: TooltipManager): void {
    const provider = () => {
      const s = this.getWorld().status;
      return [
        `I.   Aktuální stav (×8):  ${Math.round(s.tier1.pct)}%`,
        `II.  Udržitelnost (×4):   ${Math.round(s.tier2.pct)}%`,
        `III. Rozvoj (×2):         100% [P2+]`,
        `IV.  Společnost (×1):     100% [P2+]`,
        ``,
        `(${Math.round(s.tier1.pct)}×8 + ${Math.round(s.tier2.pct)}×4 + 100×2 + 100×1) / 15 = ${Math.round(s.overall.pct)}%`,
      ].join("\n");
    };
    tooltips.attach(this.ratingLabel, provider);
    tooltips.attach(this.ratingValue, provider);
  }

  protected renderBody(): void {
    const w = this.getWorld();

    // Posádka.
    const cryo = w.actors.filter((a) => a.state === "cryo").length;
    const alive = w.actors.filter((a) => a.state === "idle" || a.state === "working").length;
    const dead = w.actors.filter((a) => a.state === "dead").length;

    // Drony — working / idle / offline. Izomorfní rozklad s Posádkou.
    // V FVP všichni drony sdílí stav (E=0 → offline, active task → working, jinak idle).
    const droneOnline = w.resources.energy > 0;
    const hasActiveWork = w.tasks.some(isProductiveTask);
    const droneWorking = droneOnline && hasActiveWork ? w.drones : 0;
    const droneIdle = droneOnline && !hasActiveWork ? w.drones : 0;
    const droneOffline = !droneOnline ? w.drones : 0;

    // Základna — online/offline/destroyed.
    const mods = Object.values(w.modules);
    let online = 0;
    let offline = 0;
    let destroyed = 0;
    for (const mod of mods) {
      if (mod.hp <= 0) { destroyed++; continue; }
      if (mod.status === "online") online++;
      else offline++;
    }

    // Rating — label neutral, hodnota barvená.
    const rating = statusRating(w.status.overall.pct);
    const label = STATUS_LABELS[rating];
    this.ratingValue.setText(`${label.cs} (${label.en}) — ${Math.round(w.status.overall.pct)}%`);
    this.ratingValue.setColor(RATING_COLOR[rating]);
    this.ratingValue.setX(PADDING + this.ratingLabel.width);

    // Hierarchický formát (kapitola + odsazené podkapitoly) — izomorfní s
    // kvintet tooltips (E/W/S/F headers v header.ts).
    const I = "   ";
    const lines: string[] = [
      `Posádka:`,
      `${I}${cryo} cryo / ${alive} alive / ${dead} dead`,
      `Drony:`,
      `${I}${droneWorking} working / ${droneIdle} idle / ${droneOffline} offline`,
      `Základna:`,
      `${I}${online} online / ${offline} offline / ${destroyed} destroyed`,
    ];
    this.bodyText.setText(lines.join("\n"));

    // Scroll — compute total content height, update maxScroll.
    const totalH = this.bodyText.height;
    this.maxScroll = Math.max(0, totalH - this.scrollH);
    this.scrollOffset = Math.min(this.scrollOffset, this.maxScroll);
    this.scrollContent.y = SCROLL_TOP - this.scrollOffset;
    this.updateScrollbar();
  }
}
