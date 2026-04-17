// Background system — 2D chunk-based procedural hvězdné pozadí.
// Hvězdy + hvězdokupy + deep-sky objekty (DSO) v chunks indexovaných (cx, cy).
// Scroll: BackgroundSystem posune vlastní Container (nezávisle na main kameře —
// UI zůstává fixní) a dogeneruje nové chunks podle cameraY a viewport size.
//
// S24 Responsive Layout axiom: setSize(w, h) při resize — nové chunks se
// dogenerují dle nové šířky/výšky, staré mimo viewport se uvolní.
//
// API:
//   const bg = new BackgroundSystem(scene, viewportW, viewportH);
//   bg.setSize(w, h);     // při resize
//   bg.update(cameraY);   // při každé změně pozice kamery

import Phaser from "phaser";
import {
  COL_AMBER_DIM,
  COL_AMBER_BRIGHT,
  COL_TEXT_WHITE,
  COL_INFO_BLUE,
} from "./palette";

// Čtvercový chunk — 2D indexace (cx, cy).
const CHUNK_SIZE = 480;

// Drift axiom (S16, magnitude bumped S28): globální vektor 30 px, rotuje za 4 min wall.
// 30 px ≈ 2.5 % šířky baseline canvasu — dost na to, aby hráč pozadí cítil dýchat.
// Period 4 min drží pohyb pomalý (1 cm/min na 16" displayi) — hypnotický, ne rušivý.
const DRIFT_MAGNITUDE_PX = 30;
const DRIFT_PERIOD_MS = 240_000;
// Buffer = chunks mimo viewport, které držíme (plynulý scroll bez popu).
const CHUNK_BUFFER = 1;
// Depth pořadí (uvnitř Containeru relativně). DSO depths jsou per-part v M110_PARTS.
const DEPTH_STAR = 0;
const DEPTH_CLUSTER = 2;

// Hustoty per chunk (480×480 px).
const SMALL_PER_CHUNK = 95;
const MEDIUM_PER_CHUNK = 28;
const LARGE_PER_CHUNK = 5;
const TWINKLE_RATIO = 0.18;
const CLUSTER_CHANCE = 0.55;
// Random DSO retirován (S29): nahrazen jediným pečlivě composed deep-sky
// objektem. S29 → M-42 Orion Nebula. S32 → M-31 Andromeda + satelity. S32
// iterace → redukce na samotné M-110 (user preference: dostačující difuzní
// eliptická galaxie, plná M-31 kompozice byla vizuálně přeplněná).

// === M-110 (S32) — 1 SVG part ===
// Fixed world position. M-110 je protáhlejší difuzní eliptická satelitní
// galaxie, ponechán charakter z původní kompozice (rotace -20°, gold-amber
// gradient). Array struktura ponechána pro případné rozšíření.

const M110_CENTER_X = 220;
const M110_CENTER_Y = 180;
const M110_SCALE = 0.6;

type M110Part = {
  key: string;
  file: string;
  dx: number;
  dy: number;
  alpha: number;
  blend: Phaser.BlendModes;
  depth: number;
};

// Offset (80, 110) před M110_SCALE — původní pozice satelitu M-32 v S32
// iteraci M-31; po retire celé galaxie drží samotný M-110 tuto pozici.
const M110_PARTS: readonly M110Part[] = [
  { key: "m110", file: "m110.svg", dx: 80, dy: 110, alpha: 0.85, blend: Phaser.BlendModes.ADD, depth: 0 },
];

// Preload helper — volá GameScene.preload() před BackgroundSystem.
export function preloadM110(scene: Phaser.Scene): void {
  for (const p of M110_PARTS) {
    scene.load.svg(p.key, `assets/dso/m110/${p.file}`);
  }
}

// Deterministic RNG — mulberry32.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash 2D (cx, cy) na seed — Cantor pairing + Knuth mixing.
function chunkSeed(cx: number, cy: number): number {
  const a = cx >>> 0;
  const b = cy >>> 0;
  // Cantor pairing (nekolizní pro ne-negativní; pro negativní indexy offset XOR).
  const paired = (((a + b) * (a + b + 1)) >>> 1) + b;
  return ((paired ^ 0x9e3779b1) * 2654435761) >>> 0;
}

function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

export class BackgroundSystem {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private viewportW: number;
  private viewportH: number;
  private chunks = new Map<string, Phaser.GameObjects.GameObject[]>();
  private cameraY = 0;
  private driftElapsedMs = 0;
  private driftX = 0;
  private driftY = 0;

  constructor(scene: Phaser.Scene, viewportW: number, viewportH: number) {
    this.scene = scene;
    this.viewportW = viewportW;
    this.viewportH = viewportH;
    // Container = vrstva pozadí. Posouváme ho, ne hlavní kameru → UI fixed.
    this.container = scene.add.container(0, 0);
    this.container.setDepth(-10); // pod vším herním obsahem

    this.buildM110();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  // M-110 staví se jednou při konstrukci — fixní world pozice, nepatří do
  // chunk systému (chunk eviction by ji ničila). 1 Image objekt (array drží
  // pattern pro případné rozšíření).
  private buildM110(): void {
    for (const p of M110_PARTS) {
      if (!this.scene.textures.exists(p.key)) continue; // SVG preload selhal
      const img = this.scene.add
        .image(M110_CENTER_X + p.dx * M110_SCALE, M110_CENTER_Y + p.dy * M110_SCALE, p.key)
        .setOrigin(0.5, 0.5)
        .setScale(M110_SCALE)
        .setAlpha(p.alpha)
        .setBlendMode(p.blend)
        .setDepth(p.depth);
      this.container.add(img);
    }
  }

  setSize(w: number, h: number): void {
    this.viewportW = w;
    this.viewportH = h;
    this.update(this.cameraY);
  }

  update(cameraY: number): void {
    this.cameraY = cameraY;
    this.applyTransform();

    const cxFrom = -CHUNK_BUFFER;
    const cxTo = Math.ceil(this.viewportW / CHUNK_SIZE) + CHUNK_BUFFER;
    const cyFrom = Math.floor((cameraY - CHUNK_BUFFER * CHUNK_SIZE) / CHUNK_SIZE);
    const cyTo = Math.ceil((cameraY + this.viewportH + CHUNK_BUFFER * CHUNK_SIZE) / CHUNK_SIZE);

    for (let cy = cyFrom; cy <= cyTo; cy++) {
      for (let cx = cxFrom; cx <= cxTo; cx++) {
        const key = chunkKey(cx, cy);
        if (!this.chunks.has(key)) this.generateChunk(cx, cy);
      }
    }

    // Evict chunks mimo rozšířený rozsah.
    for (const [key, objs] of this.chunks) {
      const parts = key.split(",");
      const cx = parseInt(parts[0] ?? "0", 10);
      const cy = parseInt(parts[1] ?? "0", 10);
      if (cx < cxFrom - CHUNK_BUFFER || cx > cxTo + CHUNK_BUFFER ||
          cy < cyFrom - CHUNK_BUFFER || cy > cyTo + CHUNK_BUFFER) {
        for (const o of objs) o.destroy();
        this.chunks.delete(key);
      }
    }
  }

  // Tik driftu — voláno z GameScene.update(delta) každý frame.
  tickDrift(deltaMs: number): void {
    this.driftElapsedMs = (this.driftElapsedMs + deltaMs) % DRIFT_PERIOD_MS;
    const angle = (this.driftElapsedMs / DRIFT_PERIOD_MS) * Math.PI * 2;
    this.driftX = Math.cos(angle) * DRIFT_MAGNITUDE_PX;
    this.driftY = Math.sin(angle) * DRIFT_MAGNITUDE_PX;
    this.applyTransform();
  }

  private applyTransform(): void {
    this.container.x = this.driftX;
    this.container.y = -this.cameraY + this.driftY;
  }

  private destroy(): void {
    for (const objs of this.chunks.values()) {
      for (const o of objs) o.destroy();
    }
    this.chunks.clear();
    this.container.destroy();
  }

  private generateChunk(cx: number, cy: number): void {
    const rng = mulberry32(chunkSeed(cx, cy));
    const x0 = cx * CHUNK_SIZE;
    const y0 = cy * CHUNK_SIZE;
    const objs: Phaser.GameObjects.GameObject[] = [];

    // Random DSO retirováno (S29) — nahrazeno jediným DSO (M-42 → M-110 v S32, viz buildM110).

    // --- Malé hvězdy ---
    for (let i = 0; i < SMALL_PER_CHUNK; i++) {
      const x = x0 + rng() * CHUNK_SIZE;
      const y = y0 + rng() * CHUNK_SIZE;
      const alpha = 0.25 + rng() * 0.35;
      const star = this.scene.add
        .rectangle(x, y, 1, 1, COL_AMBER_DIM, alpha)
        .setOrigin(0, 0)
        .setDepth(DEPTH_STAR);
      this.container.add(star);
      objs.push(star);
    }

    // --- Střední hvězdy ---
    const mediumStars: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < MEDIUM_PER_CHUNK; i++) {
      const x = x0 + rng() * CHUNK_SIZE;
      const y = y0 + rng() * CHUNK_SIZE;
      const alpha = 0.45 + rng() * 0.35;
      const star = this.scene.add
        .rectangle(x, y, 2, 2, COL_AMBER_BRIGHT, alpha)
        .setOrigin(0, 0)
        .setDepth(DEPTH_STAR);
      this.container.add(star);
      objs.push(star);
      mediumStars.push(star);
    }

    // --- Velké hvězdy ---
    for (let i = 0; i < LARGE_PER_CHUNK; i++) {
      const x = x0 + rng() * CHUNK_SIZE;
      const y = y0 + rng() * CHUNK_SIZE;
      const color = rng() < 0.2 ? COL_INFO_BLUE : COL_TEXT_WHITE;
      const alpha = 0.6 + rng() * 0.4;
      const star = this.scene.add
        .rectangle(x, y, 3, 3, color, alpha)
        .setOrigin(0, 0)
        .setDepth(DEPTH_STAR);
      this.container.add(star);
      objs.push(star);
    }

    // --- Cluster ---
    if (rng() < CLUSTER_CHANCE) {
      objs.push(...this.makeCluster(rng, x0, y0));
    }

    // --- Twinkle ---
    const twinkleCount = Math.floor(mediumStars.length * TWINKLE_RATIO);
    const pool = [...mediumStars];
    for (let i = 0; i < twinkleCount && i < pool.length; i++) {
      const j = i + Math.floor(rng() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
      const star = pool[i];
      const baseAlpha = star.alpha;
      const duration = 1500 + rng() * 2500;
      this.scene.tweens.add({
        targets: star,
        alpha: Math.max(0.1, baseAlpha - 0.4),
        duration,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: rng() * duration,
      });
    }

    this.chunks.set(chunkKey(cx, cy), objs);
  }

  private makeCluster(rng: () => number, x0: number, y0: number): Phaser.GameObjects.GameObject[] {
    const count = 12 + Math.floor(rng() * 14);
    const cx = x0 + rng() * CHUNK_SIZE;
    const cy = y0 + rng() * CHUNK_SIZE;
    const spreadX = 30 + rng() * 40;
    const spreadY = 30 + rng() * 40;
    const objs: Phaser.GameObjects.GameObject[] = [];
    for (let i = 0; i < count; i++) {
      const offX = (rng() + rng() - 1) * spreadX;
      const offY = (rng() + rng() - 1) * spreadY;
      const r = rng();
      const size = r < 0.7 ? 1 : r < 0.95 ? 2 : 3;
      const color = size === 3 ? COL_TEXT_WHITE : size === 2 ? COL_AMBER_BRIGHT : COL_AMBER_DIM;
      const alpha = 0.4 + rng() * 0.5;
      const star = this.scene.add
        .rectangle(cx + offX, cy + offY, size, size, color, alpha)
        .setOrigin(0, 0)
        .setDepth(DEPTH_CLUSTER);
      this.container.add(star);
      objs.push(star);
    }
    return objs;
  }

  // makeDso retirováno v S29 — nahrazeno buildM110 (fixed SVG composition, S32).
}
