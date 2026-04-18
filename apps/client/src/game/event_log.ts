// EventLogPanel — floating panel layer 3.5, top-right slot. Hotkey [E] toggle.
// Scrollable body (row-based), lazy filter chips, auto-scroll.
// Kánon: GLOSSARY §Event Log System (S20). Spec: TODO.md §Event Log System.

import Phaser from "phaser";
import type { World, Event, EventVerb, EventSeverity } from "./model";
import { statusRating } from "./model";
import { eventIcon } from "./events";
import { formatGameTimeShort } from "./world";
import type { TooltipManager } from "./tooltip";
import {
  COL_HULL_MID,
  COL_TEXT_WHITE,
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
import {
  PANEL_PADDING as PADDING,
  PANEL_HEADER_H as HEADER_H,
  ellipsizeText,
} from "./ui/panel_helpers";
import { FloatingPanel } from "./ui/floating_panel";

const ROW_H = 20;
const SCROLLBAR_GUTTER = 12;

// Chip bar — filter chips, 2 řádky pod headerem.
const CHIP_FONT_SIZE = "9px";
const CHIP_ROW_H = 14;
const CHIP_AREA_H = 32; // 2 řádky × 14 + 4 pad

// === Lazy filter chips — LS persist helpery (exportováno pro testy) ======
//
// Uloženo jako JSON array verbů, které jsou OFF. Default (prázdný LS) =
// všechny verby ON (S30 rozhodnutí: user si první sezení chce vidět všechno).
// Chip se v UI zobrazí až když verb poprvé zazní v sezení (`seenVerbs` set)
// — 'lazy' = bez UI spamu při startu.

export const FILTER_LS_KEY = "voidspan.eventlog.filters";

export function loadVerbFilters(): Map<EventVerb, boolean> {
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

const SEVERITY_COLOR: Record<EventSeverity, string> = {
  crit: HEX_ALERT_RED,
  warn: HEX_WARN_ORANGE,
  pos: HEX_OK_GREEN,
  neutral: UI_TEXT_DIM,
};

// Formát: [KDY, KDE] ICON TEXT — lidská věta.
// Ikona drží verb-sémantiku (start/pauza/dokončeno/...), text drží jen
// subjekt (oprava/col_03/...). Žádné opakování verba v textu.
// Fallback na strukturovaný formát pokud text chybí.
function formatEventRow(ev: Event): string {
  const time = formatGameTimeShort(ev.tick);
  const spacetime = ev.loc ? `[${time}, ${ev.loc}]` : `[${time}]`;
  const icon = eventIcon(ev);

  if (ev.text) {
    return `${spacetime} ${icon} ${ev.text}`;
  }

  // Fallback — strukturovaný formát pro eventy bez text pole.
  const csqTag = ev.csq ? `:${ev.csq}` : "";
  const actor = ev.actor ?? "";
  const verb = `${icon} ${ev.verb}${csqTag}`;
  const amount = ev.amount != null ? `${ev.amount}` : "";
  const item = ev.item ?? "";
  const target = ev.target ? `> ${ev.target}` : "";

  return [spacetime, actor, verb, amount, item, target].filter(Boolean).join(" ");
}

export class EventLogPanel extends FloatingPanel {
  private getWorld: () => World;

  private rowTexts: Phaser.GameObjects.Text[] = [];
  // Plný (pre-ellipsize) text per row, použitý tooltipem při truncaci.
  private fullRowTexts: string[] = [];

  // Scroll state — row-based (ne pixel), rozdíl oproti InfoPanel/ModulesPanel.
  private scrollOffset = 0;
  private autoScroll = true;

  // Lazy filter chips — tracked verbs + per-verb on/off map + rendered chip Texts.
  private seenVerbs = new Set<EventVerb>();
  private verbFilters: Map<EventVerb, boolean> = new Map();
  private chipTexts: Map<EventVerb, Phaser.GameObjects.Text> = new Map();
  private lastChipSeenCount = -1;

  // Touch drag scroll state.
  private touchDragY: number | null = null;
  private touchDragOffset = 0;

  // Visual scrollbar.
  private scrollTrack!: Phaser.GameObjects.Rectangle;
  private scrollThumb!: Phaser.GameObjects.Rectangle;

  // Odvozené layout pozice (spočítané v buildBody z panelH).
  private bodyTopY = 0;
  private bodyH = 0;
  private maxVisible = 0;
  private rowMaxW = 0;

  constructor(scene: Phaser.Scene, getWorld: () => World) {
    super(scene, {
      dockId: "events",
      lsKey: "voidspan.eventlog.open",
      title: "Event Log",
      slot: "top-right",
    });
    this.getWorld = getWorld;
    this.verbFilters = loadVerbFilters();
    this.init();
  }

  protected buildBody(): void {
    this.bodyTopY = HEADER_H + CHIP_AREA_H;
    this.bodyH = this.panelH - HEADER_H - CHIP_AREA_H;
    this.maxVisible = Math.floor(this.bodyH / ROW_H);
    this.rowMaxW = this.panelW - 2 * PADDING - SCROLLBAR_GUTTER;

    // Pre-allocate MAX_VISIBLE row Text objekty. Y start za chip area.
    for (let i = 0; i < this.maxVisible; i++) {
      const rowY = this.bodyTopY + i * ROW_H;
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

    // Scrollbar — visual track + thumb (reflects row-based scrollOffset).
    const sbX = this.panelW - 10;
    this.scrollTrack = this.scene.add
      .rectangle(sbX, this.bodyTopY, 8, this.bodyH, COL_HULL_MID, 0.3)
      .setOrigin(0, 0)
      .setVisible(false);
    this.container.add(this.scrollTrack);

    this.scrollThumb = this.scene.add
      .rectangle(sbX, this.bodyTopY, 8, 30, COL_TEXT_WHITE, 0.5)
      .setOrigin(0, 0)
      .setVisible(false);
    this.container.add(this.scrollThumb);

    // Wheel scroll — scene-level + bounds check na panel (izomorfismus s I/M).
    // Původní `this.bg.on("wheel", ...)` bylo fragile — pokud pointer stál nad
    // scrollbarem/thumb/row Text, wheel se nedostal na bg.
    this.scene.input.on("wheel", (pointer: Phaser.Input.Pointer, _objs: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (!this.isOpen() || !this.isPointerInBounds(pointer)) return;
      const total = this.getFilteredEvents().length;
      const maxOffset = Math.max(0, total - this.maxVisible);
      if (dy > 0) {
        this.scrollOffset = Math.min(maxOffset, this.scrollOffset + 3);
        if (this.scrollOffset >= maxOffset) this.autoScroll = true;
      } else {
        this.scrollOffset = Math.max(0, this.scrollOffset - 3);
        if (this.scrollOffset < maxOffset) this.autoScroll = false;
      }
      this.renderBody();
    });

    // Touch drag scroll — pointerdown starts on bg (via onBgPointerDown),
    // move/up tracked scene-wide.
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.touchDragY === null || !this.isOpen()) return;
      const dy = this.touchDragY - pointer.y;
      const rows = Math.round(dy / ROW_H);
      const total = this.getFilteredEvents().length;
      const maxOffset = Math.max(0, total - this.maxVisible);
      this.scrollOffset = Math.max(
        0,
        Math.min(maxOffset, this.touchDragOffset + rows),
      );
      this.autoScroll = this.scrollOffset >= maxOffset;
      this.renderBody();
    });

    this.scene.input.on("pointerup", () => {
      this.touchDragY = null;
    });
  }

  protected override onBgPointerDown(p: Phaser.Input.Pointer): void {
    this.touchDragY = p.y;
    this.touchDragOffset = this.scrollOffset;
  }

  protected override onOpen(): void {
    this.autoScroll = true;
    this.touchDragY = null;
    // Synchronně dopočti history do seenVerbs + vytvoř chipy — bez 1-frame delay.
    this.syncSeenVerbs();
    this.rebuildChips();
  }

  protected override onClose(): void {
    this.touchDragY = null;
  }

  // S29 — každý řádek má tooltip s plnou verzí textu (pokud byl ořezán).
  attachTooltips(tooltips: TooltipManager): void {
    for (let i = 0; i < this.maxVisible; i++) {
      const row = this.rowTexts[i]!;
      tooltips.attach(row, () => {
        const full = this.fullRowTexts[i] ?? "";
        if (!full || full === row.text) return null;
        return full;
      });
    }
  }

  // Pre-populate seenVerbs z aktuální event buffer. Voláno v constructoru (init)
  // a v onOpen — zbavuje 1-frame delay mezi eventem a odpovídajícím chipem.
  private syncSeenVerbs(): void {
    for (const ev of this.getWorld().events) this.seenVerbs.add(ev.verb);
  }

  // Rendering hook — override z FloatingPanel.
  protected renderBody(): void {
    const events = this.getWorld().events;
    // Ring buffer při nasycení zachovává events.length konstantní (push +
    // shift), takže length není spolehlivý dirty marker — nový verb (např.
    // první DMG po asteroidu) se neprojeví v chipech. Re-populate seenVerbs
    // každý frame (O(500) Set.add = μs); rebuildChips interně gate-uje přes
    // seenVerbs.size diff, takže reálná DOM práce se děje jen při změně.
    for (const ev of events) this.seenVerbs.add(ev.verb);
    this.rebuildChips();

    const filteredLen = this.getFilteredEvents().length;
    if (this.autoScroll) {
      this.scrollOffset = Math.max(0, filteredLen - this.maxVisible);
    }

    this.renderRows();
  }

  // === Lazy filter chips ===

  private isVerbOn(v: EventVerb): boolean {
    return this.verbFilters.get(v) !== false;
  }

  private getFilteredEvents(): Event[] {
    return this.getWorld().events.filter((ev) => this.isVerbOn(ev.verb));
  }

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

    this.autoScroll = true;
    this.renderRows();
  }

  // Pokud narostl seenVerbs, dokreslí chybějící chipy + relayout (flow wrap).
  private rebuildChips(): void {
    if (this.seenVerbs.size === this.lastChipSeenCount) return;
    this.lastChipSeenCount = this.seenVerbs.size;

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
    const availableW = this.panelW - 2 * PADDING;
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

    for (let i = 0; i < this.maxVisible; i++) {
      const t = this.rowTexts[i]!;
      const evIdx = start + i;
      if (evIdx < events.length) {
        const ev = events[evIdx]!;
        const full = formatEventRow(ev);
        this.fullRowTexts[i] = full;
        ellipsizeText(t, full, this.rowMaxW);
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

    // Scrollbar thumb — reflects row-based scroll position.
    const total = events.length;
    if (total > this.maxVisible) {
      const ratio = this.maxVisible / total;
      const thumbH = Math.max(20, Math.floor(this.bodyH * ratio));
      const travel = this.bodyH - thumbH;
      const maxOff = total - this.maxVisible;
      const pos = maxOff > 0 ? (this.scrollOffset / maxOff) * travel : 0;
      this.scrollThumb.setSize(8, thumbH).setY(this.bodyTopY + pos).setVisible(true);
      this.scrollTrack.setVisible(true);
    } else {
      this.scrollThumb.setVisible(false);
      this.scrollTrack.setVisible(false);
    }
  }
}
