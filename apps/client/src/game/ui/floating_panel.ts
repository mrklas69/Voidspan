// FloatingPanel — abstract base pro 4 dokované panely (I/M/E/T).
// Extrahováno v S32 (audit F2) po 4. panelu. Sdílí chrome (bg/title/close/
// underline), visibility state (LS pref + dockManager), pozici, relayout.
//
// **Co NEŘEŠÍ:** scroll (3 různé implementace napříč panely — pixel-based
// pro I/M, row-based pro E, žádný pro T), drag, tooltips, render body.
// Subclass overridne `buildBody()` (specific UI) a `renderBody()` (per-frame).

import Phaser from "phaser";
import {
  COL_HULL_DARK,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
} from "../palette";
import { CANVAS_W, HUD_H } from "./layout";
import {
  PANEL_DEPTH as DEPTH,
  PANEL_MARGIN as MARGIN,
  PANEL_PADDING as PADDING,
  PANEL_BG_ALPHA,
  PANEL_HEADER_H as HEADER_H,
  PANEL_HALF_H,
  PANEL_VERT_GAP,
  PANEL_WIDTH_STD,
  loadPanelOpenPref,
  savePanelOpenPref,
} from "./panel_helpers";
import { dockManager, type DockSide } from "./dock_manager";

// Slot v 2×2 gridu — drží pozici panelu mezi HUD barem a Log barem.
//   top-left   = Info    (I)
//   bottom-left= Moduly  (M)
//   top-right  = Events  (E)
//   bottom-right= Tasks   (T)
export type PanelSlot = "top-left" | "bottom-left" | "top-right" | "bottom-right";

export type FloatingPanelConfig = {
  dockId: string;           // registrační ID v DockManageru ("info", "modules", ...)
  lsKey: string;            // LS klíč pro open state ("voidspan.infopanel.open")
  title: string;            // text v headeru
  slot: PanelSlot;
  width?: number;           // default PANEL_WIDTH_STD
  height?: number;          // default PANEL_HALF_H
};

export abstract class FloatingPanel {
  protected scene: Phaser.Scene;
  protected config: FloatingPanelConfig;

  protected container!: Phaser.GameObjects.Container;
  protected bg!: Phaser.GameObjects.Rectangle;
  protected titleText!: Phaser.GameObjects.Text;
  protected closeBtn!: Phaser.GameObjects.Text;

  // Šířka + výška panelu — konstantní napříč životem panelu.
  protected readonly panelW: number;
  protected readonly panelH: number;

  protected visible = false;

  // Callback — zavřít jiné panely před otevřením. Dnes používá jen TaskQueue
  // (radio s EventLog, S24); zbytek je no-op. Ponecháno jako opt-in hook.
  private onToggleOpenCb?: () => void;

  constructor(scene: Phaser.Scene, config: FloatingPanelConfig) {
    this.scene = scene;
    this.config = config;
    this.panelW = config.width ?? PANEL_WIDTH_STD;
    this.panelH = config.height ?? PANEL_HALF_H;
  }

  // Volá se z konstruktoru subclass **po** `super(...)` a po inicializaci
  // jejích fields. Staví chrome (container/bg/header/close/underline) a pak
  // nechá subclass postavit body přes `buildBody(contentW)`.
  protected init(): void {
    this.buildChrome();
    this.buildBody();
    this.visible = loadPanelOpenPref(this.config.lsKey);
    this.container.setVisible(this.visible);
    if (this.visible) this.render();
    dockManager.register(this.config.dockId, this.sideFromSlot(), this.panelW, () => this.visible);
  }

  // Pozice panelu dle slotu. X závisí na left/right straně, Y na top/bottom patru.
  protected computePosition(): { x: number; y: number } {
    const isLeft = this.config.slot.endsWith("left");
    const isTop = this.config.slot.startsWith("top");
    const x = isLeft ? MARGIN : CANVAS_W - this.panelW - MARGIN;
    const y = isTop ? HUD_H + MARGIN : HUD_H + MARGIN + PANEL_HALF_H + PANEL_VERT_GAP;
    return { x, y };
  }

  protected sideFromSlot(): DockSide {
    return this.config.slot.endsWith("left") ? "left" : "right";
  }

  // Chrome = container, bg, title, close, underline.
  // BG blokuje click-through (stopPropagation na pointerdown).
  private buildChrome(): void {
    const { x, y } = this.computePosition();

    this.container = this.scene.add.container(x, y).setDepth(DEPTH);

    this.bg = this.scene.add
      .rectangle(0, 0, this.panelW, this.panelH, COL_HULL_DARK, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setStrokeStyle(1, UI_BORDER_DIM)
      .setInteractive();
    // Default bg pointerdown — subclass může override (EventLog zachytává
    // pro touch drag scroll, Info/Modules stejně). Tady jen stopPropagation.
    this.bg.on("pointerdown", (p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.onBgPointerDown(p);
    });
    this.container.add(this.bg);

    this.titleText = this.scene.add
      .text(PADDING, PADDING, this.config.title, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0);
    this.container.add(this.titleText);

    this.closeBtn = this.scene.add
      .text(this.panelW - PADDING, PADDING, "X", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.closeBtn.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.toggle();
    });
    this.container.add(this.closeBtn);

    const underline = this.scene.add
      .rectangle(PADDING, HEADER_H - 2, this.panelW - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0);
    this.container.add(underline);
  }

  // Stavitelský hook — subclass sem přidává vlastní UI (rows, chip bar,
  // scrollbar, mask, atd.). Běží hned po `buildChrome()` v `init()`.
  protected abstract buildBody(): void;

  // Per-frame update — subclass implementuje re-render svých rows/values.
  // Základní `render()` dispatchuje jen když panel visible — subclass NEMUSÍ
  // guard znovu.
  protected abstract renderBody(): void;

  // Override hook — subclass může reagovat na pointerdown na bg (touch drag
  // scroll startuje zde v I/M/E). Default no-op.
  protected onBgPointerDown(_p: Phaser.Input.Pointer): void { /* override */ }

  // Volitelné hooky pro otevření/zavření (např. reset scroll, sync seenVerbs).
  protected onOpen(): void { /* override */ }
  protected onClose(): void { /* override */ }

  // === Public API — GameScene ho volá napříč 4 panely stejně ===

  render(): void {
    if (!this.visible) return;
    this.renderBody();
  }

  toggle(): void {
    if (!this.visible && this.onToggleOpenCb) this.onToggleOpenCb();
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    savePanelOpenPref(this.config.lsKey, this.visible);
    if (this.visible) {
      this.onOpen();
      this.renderBody();
    } else {
      this.onClose();
    }
    dockManager.notifyChange();
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.container.setVisible(false);
    savePanelOpenPref(this.config.lsKey, false);
    this.onClose();
    dockManager.notifyChange();
  }

  isOpen(): boolean {
    return this.visible;
  }

  setOnToggleOpen(cb: () => void): void {
    this.onToggleOpenCb = cb;
  }

  // Reset pozice při resize. Panely mají fix velikost, jen se posunou do rohu.
  relayout(): void {
    const { x, y } = this.computePosition();
    this.container.setPosition(x, y);
  }
}
