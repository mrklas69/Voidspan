// EventLogPanel — floating panel layer 3.5 (pravý okraj).
// Hotkey [E] toggle. ESC zavře. Scrollable body, lazy filter chips, auto-scroll.
// Kánon: GLOSSARY §Event Log System (S20). Spec: TODO.md §Event Log System.

import Phaser from "phaser";
import type { World, Event, EventVerb } from "./model";
import { statusRating } from "./model";
import { VERB_CATALOG } from "./events";
import { formatGameTimeShort } from "./world";
import type { TooltipManager } from "./tooltip";
import {
  COL_HULL_DARK,
  COL_HULL_MID,
  COL_TEXT_WHITE,
  UI_BORDER_DIM,
  UI_TEXT_ACCENT,
  UI_TEXT_PRIMARY,
  UI_TEXT_DIM,
  FONT_FAMILY,
  FONT_SIZE_SIDEPANEL,
  HEX_ALERT_RED,
  HEX_WARN_ORANGE,
  HEX_OK_GREEN,
  RATING_COLOR,
} from "./palette";
import { CANVAS_W, HUD_H } from "./ui/layout";
import {
  PANEL_DEPTH as DEPTH,
  PANEL_MARGIN as MARGIN,
  PANEL_PADDING as PADDING,
  PANEL_BG_ALPHA,
  PANEL_HEADER_H as HEADER_H,
  PANEL_HALF_H,
  PANEL_WIDTH_STD,
  loadPanelOpenPref,
  savePanelOpenPref,
  ellipsizeText,
} from "./ui/panel_helpers";
import { dockManager } from "./ui/dock_manager";

const PANEL_W = PANEL_WIDTH_STD;
const ROW_H = 20;
// S29 iterace: footer (count + copy button) odebrán — redundantní, user chce čistší UI.
const FOOTER_H = 0;
// Ellipsize: max šířka row textu — left PADDING + right PADDING + scrollbar gutter.
// Scrollbar se zapíná až při přetečení, ale rezervujeme vždy → stabilní pravá hrana.
const SCROLLBAR_GUTTER = 12;
const ROW_MAX_W = PANEL_W - 2 * PADDING - SCROLLBAR_GUTTER;

// S29 2×2 layout: každý panel polovina middle area.
const PANEL_H = PANEL_HALF_H;

// S29 iterace: chip font na polovinu (18→9 px) + chip row zmenšen + underline pryč.
const CHIP_FONT_SIZE = "9px";
const CHIP_ROW_H = 14;
const CHIP_AREA_H = 32; // 2 řádky × 14 + 4 pad
const BODY_TOP_Y = HEADER_H + CHIP_AREA_H;
const BODY_H = PANEL_H - HEADER_H - CHIP_AREA_H - FOOTER_H;
const MAX_VISIBLE = Math.floor(BODY_H / ROW_H);

const LS_KEY = "voidspan.eventlog.open";

const loadVisiblePref = () => loadPanelOpenPref(LS_KEY);
const saveVisiblePref = (v: boolean) => savePanelOpenPref(LS_KEY, v);

// === Lazy filter chips — LS persist helpery (exportováno pro testy) ======
//
// Uloženo jako JSON array verbů, které jsou OFF. Default (prázdný LS) = jen
// TICK off (spec TODO). Chip se v UI zobrazí až když verb poprvé zazní v
// sezení (`seenVerbs` set) — 'lazy' = bez UI spamu při startu.

export const FILTER_LS_KEY = "voidspan.eventlog.filters";

export function loadVerbFilters(): Map<EventVerb, boolean> {
  // S29 iterace: default = všechno ON (prázdná mapa). User si při prvním
  // spuštění vidí všechny verbs v logu včetně TICK, pak chip-clickem vypíná.
  const filters = new Map<EventVerb, boolean>();
  try {
    const raw = localStorage.getItem(FILTER_LS_KEY);
    if (raw !== null) {
      const offVerbs = JSON.parse(raw) as EventVerb[];
      for (const v of offVerbs) filters.set(v, false);
    }
    // raw === null → prázdný LS → filters zůstane empty = všechno ON.
  } catch {
    // Incognito / broken JSON → bezpečný default (empty = all ON).
  }
  return filters;
}

export function saveVerbFilters(filters: Map<EventVerb, boolean>): void {
  try {
    const offVerbs = Array.from(filters.entries())
      .filter(([, on]) => on === false)
      .map(([v]) => v);
    localStorage.setItem(FILTER_LS_KEY, JSON.stringify(offVerbs));
  } catch { /* incognito */ }
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
  const time = formatGameTimeShort(ev.tick);
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
  const target = ev.target ? `> ${ev.target}` : "";

  return [spacetime, actor, verb, amount, item, target].filter(Boolean).join(" ");
}

export class EventLogPanel {
  private scene: Phaser.Scene;
  private getWorld: () => World;

  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private closeBtn!: Phaser.GameObjects.Text;
  // footerText retirován (S29 iterace) — user preference čistší UI bez count/copy.
  private rowTexts: Phaser.GameObjects.Text[] = [];

  // Scroll state.
  private scrollOffset = 0;
  private autoScroll = true;

  private visible = false;
  private lastRenderedCount = -1;

  // Lazy filter chips — tracked verbs + per-verb on/off map + rendered chip Texts.
  // Chipy se staví až když verb poprvé zazní (seenVerbs). verbFilters drží jen
  // OFF stavy (default on = absence v mapě).
  private seenVerbs = new Set<EventVerb>();
  private verbFilters!: Map<EventVerb, boolean>;
  private chipTexts: Map<EventVerb, Phaser.GameObjects.Text> = new Map();
  private lastChipSeenCount = -1;

  // S29 — plný (pre-ellipsize) text per row, použitý tooltipem při truncaci.
  // Paralelní array s rowTexts. Prázdný string = řádek skrytý → tooltip null.
  private fullRowTexts: string[] = [];

  // Touch drag scroll state.
  private touchDragY: number | null = null;
  private touchDragOffset = 0;

  // Visual scrollbar.
  private scrollTrack!: Phaser.GameObjects.Rectangle;
  private scrollThumb!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    this.scene = scene;
    this.getWorld = getWorld;
    this.verbFilters = loadVerbFilters();
    this.build();
    this.visible = loadVisiblePref();
    this.container.setVisible(this.visible);
    if (this.visible) this.renderRows();
    dockManager.register("events", "right", PANEL_W, () => this.visible);
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
        fontSize: FONT_SIZE_SIDEPANEL,
        color: UI_TEXT_ACCENT,
      })
      .setOrigin(0, 0);
    this.container.add(this.titleText);

    // Close button X.
    this.closeBtn = this.scene.add
      .text(PANEL_W - PADDING, PADDING, "X", {
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

    // Underline.
    const underline = this.scene.add
      .rectangle(PADDING, HEADER_H - 2, PANEL_W - 2 * PADDING, 1, UI_BORDER_DIM)
      .setOrigin(0, 0);
    this.container.add(underline);

    // S29 iterace: chip underline retirován (user preference — méně vizuálního šumu).

    // Body rows — pre-allocate MAX_VISIBLE text objects. Y start za chip area.
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const rowY = BODY_TOP_Y + i * ROW_H;
      const t = this.scene.add
        .text(PADDING, rowY, "", {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_SIDEPANEL,
          color: UI_TEXT_PRIMARY,
        })
        .setOrigin(0, 0);
      this.rowTexts.push(t);
      this.fullRowTexts.push("");
      this.container.add(t);
    }

    // S29 iterace: Copy button + footer (count + footer underline) retirovány.

    // Scrollbar — visual track + thumb (reflects row-based scrollOffset).
    const sbX = PANEL_W - 10;
    this.scrollTrack = this.scene.add
      .rectangle(sbX, BODY_TOP_Y, 8, BODY_H, COL_HULL_MID, 0.3)
      .setOrigin(0, 0)
      .setVisible(false);
    this.container.add(this.scrollTrack);

    this.scrollThumb = this.scene.add
      .rectangle(sbX, BODY_TOP_Y, 8, 30, COL_TEXT_WHITE, 0.5)
      .setOrigin(0, 0)
      .setVisible(false);
    this.container.add(this.scrollThumb);

    // Scroll — mouse wheel on bg.
    this.bg.on("wheel", (_p: Phaser.Input.Pointer, _dx: number, _dy: number, dz: number) => {
      const total = this.getFilteredEvents().length;
      const maxOffset = Math.max(0, total - MAX_VISIBLE);
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
      const total = this.getFilteredEvents().length;
      const maxOffset = Math.max(0, total - MAX_VISIBLE);
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

  // S29 — každý řádek má tooltip s plnou verzí textu (pokud byl ořezán).
  // Provider se volá při hover; vrací null když se full vešel (žádný tooltip).
  attachTooltips(tooltips: TooltipManager): void {
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const row = this.rowTexts[i]!;
      tooltips.attach(row, () => {
        const full = this.fullRowTexts[i] ?? "";
        if (!full || full === row.text) return null;
        return full;
      });
    }
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
    dockManager.notifyChange();
  }

  isOpen(): boolean {
    return this.visible;
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.container.setVisible(false);
    saveVisiblePref(false);
    dockManager.notifyChange();
  }

  // Called every frame from GameScene.update() — lightweight, only re-renders on change.
  render(): void {
    if (!this.visible) return;
    const events = this.getWorld().events;
    if (events.length === this.lastRenderedCount) return;
    this.lastRenderedCount = events.length;

    // Track seen verbs (lazy chips).
    for (const ev of events) this.seenVerbs.add(ev.verb);

    // Rebuild chip UI pokud se seenVerbs rozrostl.
    this.rebuildChips();

    // Auto-scroll: snap to bottom (filtered).
    const filteredLen = this.getFilteredEvents().length;
    if (this.autoScroll) {
      this.scrollOffset = Math.max(0, filteredLen - MAX_VISIBLE);
    }

    this.renderRows();
  }

  // === Lazy filter chips ===

  // Filter predikát — verb je ON pokud není explicitně v mapě s hodnotou false.
  private isVerbOn(v: EventVerb): boolean {
    return this.verbFilters.get(v) !== false;
  }

  // Vrátí events po aplikaci per-verb filtrů. Voláno v renderRows + scroll logic.
  private getFilteredEvents(): Event[] {
    return this.getWorld().events.filter((ev) => this.isVerbOn(ev.verb));
  }

  // Klik na chip — flipne filter, uloží do LS, znovu vykreslí.
  private toggleVerb(v: EventVerb): void {
    const wasOn = this.isVerbOn(v);
    this.verbFilters.set(v, !wasOn);
    saveVerbFilters(this.verbFilters);

    const t = this.chipTexts.get(v);
    if (t) {
      const isOn = !wasOn;
      t.setColor(isOn ? UI_TEXT_ACCENT : UI_TEXT_DIM);
      t.setAlpha(isOn ? 1 : 0.4);
    }

    // Filter změnil → layout řádků se posune, auto-scroll resync.
    this.autoScroll = true;
    this.renderRows();
  }

  // Pokud narostl seenVerbs, dokreslí chybějící chipy + relayout (flow wrap).
  // Skip když se nic nezměnilo (lazy — bez zbytečných allocations per frame).
  private rebuildChips(): void {
    if (this.seenVerbs.size === this.lastChipSeenCount) return;
    this.lastChipSeenCount = this.seenVerbs.size;

    // Dokresli chybějící chipy.
    for (const verb of this.seenVerbs) {
      if (this.chipTexts.has(verb)) continue;
      const isOn = this.isVerbOn(verb);
      const t = this.scene.add
        .text(0, 0, verb, {
          fontFamily: FONT_FAMILY,
          fontSize: CHIP_FONT_SIZE,
          color: isOn ? UI_TEXT_ACCENT : UI_TEXT_DIM,
        })
        .setOrigin(0, 0)
        .setAlpha(isOn ? 1 : 0.4)
        .setInteractive({ useHandCursor: true });
      t.on(
        "pointerdown",
        (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          this.toggleVerb(verb);
        },
      );
      this.chipTexts.set(verb, t);
      this.container.add(t);
    }

    // Flow layout — abecedně pro stabilitu (nové chipy nepřeházejí existující).
    const verbs = Array.from(this.chipTexts.keys()).sort();
    const availableW = PANEL_W - 2 * PADDING;
    const CHIP_GAP = 8;
    let x = 0;
    let row = 0;
    for (const verb of verbs) {
      const t = this.chipTexts.get(verb)!;
      const w = t.width;
      if (x + w > availableW && x > 0) {
        x = 0;
        row += 1;
      }
      t.setPosition(PADDING + x, HEADER_H + 6 + row * CHIP_ROW_H);
      x += w + CHIP_GAP;
    }
  }

  private renderRows(): void {
    const events = this.getFilteredEvents();
    const start = this.scrollOffset;

    for (let i = 0; i < MAX_VISIBLE; i++) {
      const t = this.rowTexts[i]!;
      const evIdx = start + i;
      if (evIdx < events.length) {
        const ev = events[evIdx]!;
        const full = formatEventRow(ev);
        this.fullRowTexts[i] = full;
        ellipsizeText(t, full, ROW_MAX_W);
        // SIGN eventy: barva dle 5stavového semaforu (rating z amount = nový pct).
        if (ev.verb === "SIGN" && ev.amount != null) {
          t.setColor(RATING_COLOR[statusRating(ev.amount)] ?? UI_TEXT_DIM);
        } else {
          t.setColor(SEVERITY_COLOR[ev.severity] ?? UI_TEXT_DIM);
        }
        t.setVisible(true);
      } else {
        t.setVisible(false);
        this.fullRowTexts[i] = "";
      }
    }

    // S29 iterace: footer count retirován.

    // Scrollbar thumb — reflects row-based scroll position.
    const total = events.length;
    if (total > MAX_VISIBLE) {
      const ratio = MAX_VISIBLE / total;
      const thumbH = Math.max(20, Math.floor(BODY_H * ratio));
      const travel = BODY_H - thumbH;
      const maxOff = total - MAX_VISIBLE;
      const pos = maxOff > 0 ? (this.scrollOffset / maxOff) * travel : 0;
      this.scrollThumb.setSize(8, thumbH).setY(BODY_TOP_Y + pos).setVisible(true);
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
