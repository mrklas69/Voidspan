// DockManager — centralizovaný state pro dokované floating panely (S28).
//
// MVP: panely jsou fixed na své straně (I/M = left, E/T = right). Mutex pairs
// zůstávají (radio v rámci páru). DockManager dává:
//   1) Single source of truth pro „který panel je teď otevřený na které straně"
//   2) BELT (segment) re-center podle volné plochy mezi panely
//   3) Listener pattern pro reaktivní relayout segmentu
//
// Budoucí rozšíření (mimo MVP): auto-side decision, vertikální stack, drag-to-dock.

import { CANVAS_W, SEGMENT_W, SEGMENT_Y, SEGMENT_H, BAY_PX } from "./layout";

export type DockSide = "left" | "right";

const PANEL_GAP = 24; // mezera mezi panelem a BELTem

type PanelRef = {
  id: string;
  side: DockSide;
  width: number;
  isOpen: () => boolean;
};

export class DockManager {
  private panels: Map<string, PanelRef> = new Map();
  private listeners: Array<() => void> = [];

  register(id: string, side: DockSide, width: number, isOpen: () => boolean): void {
    this.panels.set(id, { id, side, width, isOpen });
  }

  // Volá panel po toggle/close — DockManager notify všechny posluchače (segment).
  notifyChange(): void {
    for (const cb of this.listeners) cb();
  }

  onChange(cb: () => void): void {
    this.listeners.push(cb);
  }

  // Vrátí šířku otevřeného panelu na straně, nebo 0 pokud žádný open.
  // Mutex pairs garantují max 1 open na stranu (I↔M, E↔T).
  private openWidthOnSide(side: DockSide): number {
    let max = 0;
    for (const p of this.panels.values()) {
      if (p.side === side && p.isOpen() && p.width > max) max = p.width;
    }
    return max;
  }

  // BELT re-centering (S28 axiom: BELT vždy viditelný; panel ustupuje, ne naopak).
  // Vrátí X pozici levého okraje segmentu = střed volné zóny mezi panely.
  // Edge case: pokud volná šířka < SEGMENT_W → segment přetéká doprava; držíme
  // leftEdge a panel napravo se překryje (méně časté než opačný směr).
  getSegmentX(): number {
    const leftW = this.openWidthOnSide("left");
    const rightW = this.openWidthOnSide("right");
    const leftEdge = leftW > 0 ? leftW + PANEL_GAP : 0;
    const rightEdge = rightW > 0 ? CANVAS_W - rightW - PANEL_GAP : CANVAS_W;
    const free = rightEdge - leftEdge;
    if (free < SEGMENT_W) return leftEdge;
    return leftEdge + (free - SEGMENT_W) / 2;
  }

  // Reset — pro testy + scene restart.
  clear(): void {
    this.panels.clear();
    this.listeners = [];
  }
}

// Globální singleton — sdílený mezi všemi panely + segmentem.
// HMR ztrácí stav; refresh je předpokládaný workflow při dev.
export const dockManager = new DockManager();

// Re-export layout konstant pro test izolaci.
export { SEGMENT_Y, SEGMENT_H, BAY_PX };
