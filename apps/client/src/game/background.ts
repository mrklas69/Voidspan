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
// Depth pořadí (uvnitř Containeru relativně). DSO depths jsou per-part v M42_PARTS.
const DEPTH_STAR = 0;
const DEPTH_CLUSTER = 2;

// Hustoty per chunk (480×480 px).
const SMALL_PER_CHUNK = 95;
const MEDIUM_PER_CHUNK = 28;
const LARGE_PER_CHUNK = 5;
const TWINKLE_RATIO = 0.18;
const CLUSTER_CHANCE = 0.55;
// Random DSO retirován (S29): nahrazen jediným pečlivě composed M-42 Orion
// Nebula (10 SVG parts, fixní world pozice, viz M42_PARTS níže).

// === M-42 Orion Nebula (S29) — 10 SVG parts ===
// Fixed world position, scale 0.55× native viewBox. Composing order (depth):
//   −6 halo_outer → −5 halo_middle → −4 wisps (E/W/N) → −3 m43_blue →
//   −2 core_glow → −1 dark_bay → 0 trapezium → +1 stars_accent
// Blend ADD pro emission glow (aditivně se skládá svit), NORMAL pro dark_bay
// (tmavá negace — Fish Mouth Dark Nebula blokuje zadní emisi).

const M42_CENTER_X = 220;
const M42_CENTER_Y = 180;
const M42_SCALE = 0.55;

type M42Part = {
  key: string;
  file: string;
  dx: number;
  dy: number;
  alpha: number;
  blend: Phaser.BlendModes;
  depth: number;
};

// S29 iterace 2: wisps (06/07/08) retirovány — vizuál přeplněný, M-42 je
// charakteristická hlavně halem + core + dark bay + Trapeziem + M43 sousedem.
const M42_PARTS: readonly M42Part[] = [
  { key: "m42_halo_outer",   file: "01_halo_outer.svg",   dx:  0,   dy:  0,   alpha: 0.45, blend: Phaser.BlendModes.ADD,    depth: -6 },
  { key: "m42_halo_middle",  file: "02_halo_middle.svg",  dx:  10,  dy:  30,  alpha: 0.60, blend: Phaser.BlendModes.ADD,    depth: -5 },
  { key: "m42_m43_blue",     file: "09_m43_blue.svg",     dx: -43,  dy: -103, alpha: 0.55, blend: Phaser.BlendModes.ADD,    depth: -3 },
  { key: "m42_core_glow",    file: "03_core_glow.svg",    dx:  5,   dy:  25,  alpha: 0.85, blend: Phaser.BlendModes.ADD,    depth: -2 },
  { key: "m42_dark_bay",     file: "05_dark_bay.svg",     dx:  25,  dy:  25,  alpha: 0.80, blend: Phaser.BlendModes.NORMAL, depth: -1 },
  { key: "m42_trapezium",    file: "04_trapezium.svg",    dx:  5,   dy:  15,  alpha: 1.00, blend: Phaser.BlendModes.ADD,    depth:  0 },
  { key: "m42_stars_accent", file: "10_stars_accent.svg", dx:  0,   dy: -45,  alpha: 0.85, blend: Phaser.BlendModes.ADD,    depth:  1 },
];

// Preload helper — volá GameScene.preload() před BackgroundSystem.
export function preloadM42(scene: Phaser.Scene): void {
  for (const p of M42_PARTS) {
    scene.load.svg(p.key, `assets/dso/m42/${p.file}`);
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

    this.buildM42();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  // M-42 staví se jednou při konstrukci — fixní world pozice, nepatří do
  // chunk systému (chunk eviction by ji ničila). 10 Image objektů na M42_PARTS.
  private buildM42(): void {
    for (const p of M42_PARTS) {
      if (!this.scene.textures.exists(p.key)) continue; // SVG preload selhal
      const img = this.scene.add
        .image(M42_CENTER_X + p.dx * M42_SCALE, M42_CENTER_Y + p.dy * M42_SCALE, p.key)
        .setOrigin(0.5, 0.5)
        .setScale(M42_SCALE)
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

    // Random DSO retirováno (S29) — nahrazeno jedinou M-42 (viz buildM42).

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

  // makeDso retirováno v S29 — nahrazeno buildM42 (fixed SVG composition).
}
