// EventLogPanel — floating panel layer 3.5 (pravý okraj).
// Hotkey [E] toggle. ESC zavře. Scrollable body, lazy filter chips, auto-scroll.
// Kánon: GLOSSARY §Event Log System (S20). Spec: TODO.md §Event Log System.

import Phaser from "phaser";
import type { World, Event, EventVerb } from "./model";
import { VERB_CATALOG } from "./events";
import { formatGameTime } from "./world";
import {
  COL_HULL_DARK,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  FONT_FAMILY,
  FONT_SIZE_HINT,
  FONT_SIZE_LABEL,
  HEX_ALERT_RED,
  HEX_WARN_AMBER,
  HEX_OK_GREEN,
} from "./palette";
import { CANVAS_W, CANVAS_H, HUD_H, LOG_H } from "./ui/layout";

const DEPTH = 1500; // nad segment (0), pod modal (2000)
const PANEL_W = 420;
const MARGIN = 12;
const PADDING = 12;
const PANEL_BG_ALPHA = 0.9;
const ROW_H = 20;
const HEADER_H = 40;
const FOOTER_H = 28;

// Max visible rows (dynamicky z výšky panelu).
const PANEL_H = CANVAS_H - HUD_H - LOG_H - 2 * MARGIN;
const BODY_H = PANEL_H - HEADER_H - FOOTER_H;
const MAX_VISIBLE = Math.floor(BODY_H / ROW_H);

const LS_KEY = "voidspan.eventlog.open";

function loadVisiblePref(): boolean {
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
}

function saveVisiblePref(v: boolean): void {
  try { localStorage.setItem(LS_KEY, v ? "1" : "0"); } catch { /* incognito */ }
}

const SEVERITY_COLOR: Record<string, string> = {
  crit: HEX_ALERT_RED,
  warn: HEX_WARN_AMBER,
  pos: HEX_OK_GREEN,
  neutral: UI_TEXT_DIM,
};

// Formát: [TIME, LOC] ACTOR VERB:CSQ AMOUNT ITEM → TARGET
function formatEventRow(ev: Event): string {
  const time = formatGameTime(ev.tick);
  const spacetime = ev.loc ? `[${time}, ${ev.loc}]` : `[${time}]`;

  const entry = VERB_CATALOG[ev.verb];
  const csqTag = ev.csq ? `:${ev.csq}` : "";
  const actor = ev.actor ?? "";
  const verb = `${entry.icon} ${ev.verb}${csqTag}`;
  const amount = ev.amount != null ? `${ev.amount}` : "";
  const item = ev.item ?? "";
  const target = ev.target ? `→ ${ev.target}` : "";

  return [spacetime, actor, verb, amount, item, target].filter(Boolean).join(" ");
}

export class EventLogPanel {
  private scene: Phaser.Scene;
  private getWorld: () => World;

  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private closeBtn!: Phaser.GameObjects.Text;
  private footerText!: Phaser.GameObjects.Text;
  private rowTexts: Phaser.GameObjects.Text[] = [];

  // Scroll state.
  private scrollOffset = 0;
  private autoScroll = true;

  private visible = false;
  private lastRenderedCount = -1;

  // Lazy filter chips — tracked verbs (pro budoucí chip UI).
  private seenVerbs = new Set<EventVerb>();

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    this.scene = scene;
    this.getWorld = getWorld;
    this.build();
    this.visible = loadVisiblePref();
    this.container.setVisible(this.visible);
    if (this.visible) this.renderRows();
  }

  private build(): void {
    const x = CANVAS_W - PANEL_W - MARGIN;
    const y = HUD_H + MARGIN;

    this.container = this.scene.add.container(x, y).setDepth(DEPTH);

    // BG — hull-dark, alpha 0.9, stroke border.
    this.bg = this.scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, COL_HULL_DARK, PANEL_BG_ALPHA)
      .setOrigin(0, 0)
      .setStrokeStyle(1, UI_BORDER_DIM)
      .setInteractive();
    // Block clicks from reaching game underneath.
    this.bg.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
    });
    this.container.add(this.bg);

    // Header — title.
    this.titleText = this.scene.add
      .text(PADDING, PADDING, "Event Log", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_LABEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0);
    this.container.add(this.titleText);

    // Close button ✕.
    this.closeBtn = this.scene.add
      .text(PANEL_W - PADDING, PADDING, "✕", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_LABEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.closeBtn.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.toggle();
    });
    this.container.add(this.closeBtn);

    // Underline.
    const underline = this.scene.add
      .rectangle(PADDING, HEADER_H - 2, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0);
    this.container.add(underline);

    // Body rows — pre-allocate MAX_VISIBLE text objects.
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const rowY = HEADER_H + i * ROW_H;
      const t = this.scene.add
        .text(PADDING, rowY, "", {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_HINT,
          color: UI_TEXT_PRIMARY,
        })
        .setOrigin(0, 0);
      this.rowTexts.push(t);
      this.container.add(t);
    }

    // Copy button — kopíruje všechny eventy do clipboardu.
    const copyBtn = this.scene.add
      .text(PANEL_W - PADDING - 30, PANEL_H - FOOTER_H + 4, "📋", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_HINT,
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    copyBtn.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      const events = this.getWorld().events;
      const text = events.map(formatEventRow).join("\n");
      navigator.clipboard.writeText(text).catch(() => {});
    });
    this.container.add(copyBtn);

    // Footer.
    this.footerText = this.scene.add
      .text(PADDING, PANEL_H - FOOTER_H + 4, "", {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_HINT,
        color: UI_TEXT_DIM,
      })
      .setOrigin(0, 0);
    this.container.add(this.footerText);

    // Footer underline (above footer).
    const footerLine = this.scene.add
      .rectangle(PADDING, PANEL_H - FOOTER_H, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0);
    this.container.add(footerLine);

    // Scroll — mouse wheel on bg.
    this.bg.on("wheel", (_p: Phaser.Input.Pointer, _dx: number, _dy: number, dz: number) => {
      const events = this.getWorld().events;
      const maxOffset = Math.max(0, events.length - MAX_VISIBLE);
      if (dz > 0) {
        // Scroll down.
        this.scrollOffset = Math.min(maxOffset, this.scrollOffset + 3);
        // If scrolled to bottom, re-enable auto-scroll.
        if (this.scrollOffset >= maxOffset) this.autoScroll = true;
      } else {
        // Scroll up — disable auto-scroll.
        this.scrollOffset = Math.max(0, this.scrollOffset - 3);
        if (this.scrollOffset < maxOffset) this.autoScroll = false;
      }
      this.renderRows();
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    saveVisiblePref(this.visible);
    if (this.visible) {
      this.autoScroll = true;
      this.lastRenderedCount = -1; // force re-render
      this.renderRows();
    }
  }

  isOpen(): boolean {
    return this.visible;
  }

  // Called every frame from GameScene.update() — lightweight, only re-renders on change.
  render(): void {
    if (!this.visible) return;
    const events = this.getWorld().events;
    if (events.length === this.lastRenderedCount) return;
    this.lastRenderedCount = events.length;

    // Track seen verbs (lazy chips).
    for (const ev of events) this.seenVerbs.add(ev.verb);

    // Auto-scroll: snap to bottom.
    if (this.autoScroll) {
      this.scrollOffset = Math.max(0, events.length - MAX_VISIBLE);
    }

    this.renderRows();
  }

  private renderRows(): void {
    const events = this.getWorld().events;
    const start = this.scrollOffset;

    for (let i = 0; i < MAX_VISIBLE; i++) {
      const t = this.rowTexts[i]!;
      const evIdx = start + i;
      if (evIdx < events.length) {
        const ev = events[evIdx]!;
        t.setText(formatEventRow(ev));
        t.setColor(SEVERITY_COLOR[ev.severity] ?? UI_TEXT_DIM);
        t.setVisible(true);
      } else {
        t.setVisible(false);
      }
    }

    this.footerText.setText(`${events.length} events`);
  }
}
