// EventLogPanel — floating panel layer 3.5 (pravý okraj).
// Hotkey [E] toggle. ESC zavře. Scrollable body, lazy filter chips, auto-scroll.
// Kánon: GLOSSARY §Event Log System (S20). Spec: TODO.md §Event Log System.

import Phaser from "phaser";
import type { World, Event, EventVerb } from "./model";
import { statusRating } from "./model";
import { VERB_CATALOG } from "./events";
import { formatGameTime } from "./world";
import {
  COL_HULL_DARK,
  COL_HULL_MID,
  COL_TEXT_WHITE,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  FONT_FAMILY,
  FONT_SIZE_HINT,
  FONT_SIZE_LABEL,
  HEX_ALERT_RED,
  HEX_WARN_ORANGE,
  HEX_OK_GREEN,
  RATING_COLOR,
} from "./palette";
import { CANVAS_W, HUD_H } from "./ui/layout";

const DEPTH = 1500; // nad segment (0), pod modal (2000)
const PANEL_W = 420;
const MARGIN = 12;
const PADDING = 12;
const PANEL_BG_ALPHA = 0.9;
const ROW_H = 20;
const HEADER_H = 40;
const FOOTER_H = 28;

// S24 KISS: PANEL_H fix (baseline 720 - 60 - 60 - 24 = 576). Při malém okně
// panel přetéká — user zvětší okno. Počet řádků (MAX_VISIBLE) spočten jednou.
const PANEL_H = 576;
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
  warn: HEX_WARN_ORANGE,
  pos: HEX_OK_GREEN,
  neutral: UI_TEXT_DIM,
};

// Formát: [KDY, KDE] ICON TEXT — lidská věta (axiom S22).
// Fallback na strukturovaný formát pokud text chybí.
function formatEventRow(ev: Event): string {
  const time = formatGameTime(ev.tick);
  const spacetime = ev.loc ? `[${time}, ${ev.loc}]` : `[${time}]`;
  const entry = VERB_CATALOG[ev.verb];

  if (ev.text) {
    return `${spacetime} ${entry.icon} ${ev.text}`;
  }

  // Fallback — strukturovaný formát pro eventy bez text pole.
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

  // Touch drag scroll state.
  private touchDragY: number | null = null;
  private touchDragOffset = 0;

  // Visual scrollbar.
  private scrollTrack!: Phaser.GameObjects.Rectangle;
  private scrollThumb!: Phaser.GameObjects.Rectangle;

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
    // Block clicks from reaching game underneath + start touch drag tracking.
    this.bg.on("pointerdown", (p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.touchDragY = p.y;
      this.touchDragOffset = this.scrollOffset;
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

    // Body rows — pre-allocate MAX_VISIBLE text objects (18px — S22 rozhodnutí).
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const rowY = HEADER_H + i * ROW_H;
      const t = this.scene.add
        .text(PADDING, rowY, "", {
          fontFamily: FONT_FAMILY,
          fontSize: "18px",
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

    // Scrollbar — visual track + thumb (reflects row-based scrollOffset).
    const sbX = PANEL_W - 10;
    this.scrollTrack = this.scene.add
      .rectangle(sbX, HEADER_H, 8, BODY_H, COL_HULL_MID, 0.3)
      .setOrigin(0, 0)
      .setVisible(false);
    this.container.add(this.scrollTrack);

    this.scrollThumb = this.scene.add
      .rectangle(sbX, HEADER_H, 8, 30, COL_TEXT_WHITE, 0.5)
      .setOrigin(0, 0)
      .setVisible(false);
    this.container.add(this.scrollThumb);

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

    // Touch drag scroll — pointerdown starts on bg, move/up tracked scene-wide.
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.touchDragY === null || !this.visible) return;
      const dy = this.touchDragY - pointer.y;
      const rows = Math.round(dy / ROW_H);
      const events = this.getWorld().events;
      const maxOffset = Math.max(0, events.length - MAX_VISIBLE);
      this.scrollOffset = Math.max(
        0,
        Math.min(maxOffset, this.touchDragOffset + rows),
      );
      this.autoScroll = this.scrollOffset >= maxOffset;
      this.renderRows();
    });

    this.scene.input.on("pointerup", () => {
      this.touchDragY = null;
    });
  }

  // S24: radio callback — zavře jiné panely (TaskQueue) před otevřením.
  private onToggleOpen?: () => void;
  setOnToggleOpen(cb: () => void): void {
    this.onToggleOpen = cb;
  }

  toggle(): void {
    if (!this.visible && this.onToggleOpen) this.onToggleOpen();
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    saveVisiblePref(this.visible);
    this.touchDragY = null;
    if (this.visible) {
      this.autoScroll = true;
      this.lastRenderedCount = -1; // force re-render
      this.renderRows();
    }
  }

  isOpen(): boolean {
    return this.visible;
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.container.setVisible(false);
    saveVisiblePref(false);
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
        // SIGN eventy: barva dle 5stavového semaforu (rating z amount = nový pct).
        if (ev.verb === "SIGN" && ev.amount != null) {
          t.setColor(RATING_COLOR[statusRating(ev.amount)] ?? UI_TEXT_DIM);
        } else {
          t.setColor(SEVERITY_COLOR[ev.severity] ?? UI_TEXT_DIM);
        }
        t.setVisible(true);
      } else {
        t.setVisible(false);
      }
    }

    this.footerText.setText(`${events.length} events`);

    // Scrollbar thumb — reflects row-based scroll position.
    const total = events.length;
    if (total > MAX_VISIBLE) {
      const ratio = MAX_VISIBLE / total;
      const thumbH = Math.max(20, Math.floor(BODY_H * ratio));
      const travel = BODY_H - thumbH;
      const maxOff = total - MAX_VISIBLE;
      const pos = maxOff > 0 ? (this.scrollOffset / maxOff) * travel : 0;
      this.scrollThumb.setSize(8, thumbH).setY(HEADER_H + pos).setVisible(true);
      this.scrollTrack.setVisible(true);
    } else {
      this.scrollThumb.setVisible(false);
      this.scrollTrack.setVisible(false);
    }
  }

  // S24 KISS: panel má pevnou velikost (PANEL_H), resize jen posune container do rohu.
  relayout(): void {
    const x = CANVAS_W - PANEL_W - MARGIN;
    const y = HUD_H + MARGIN;
    this.container.setPosition(x, y);
  }
}
