// Background system — chunk-based procedural generator pro hvězdné pozadí.
// Hvězdy + hvězdokupy + deep-sky objekty (DSO) v chunks podél osy Y, deterministic
// per chunk (seeded RNG). Scroll: BackgroundSystem posune vlastní Container (nezávisle
// na main kameře — UI zůstává fixní) a dogeneruje nové chunks podle cameraY.
//
// API:
//   const bg = new BackgroundSystem(scene, bandW, viewportH);
//   bg.update(cameraY);   // při každé změně pozice kamery

import Phaser from "phaser";
import {
  COL_AMBER_DIM,
  COL_AMBER_BRIGHT,
  COL_TEXT_WHITE,
  COL_INFO_BLUE,
  COL_ALERT_RED,
  COL_WARN_AMBER,
} from "./palette";

// Výška chunku podél osy Y — kompromis mezi granularitou evictu a voláním generátoru.
const CHUNK_H = 480;

// Drift axiom (S16): globální vektor délky 3 px, rotuje jednou za 1 game day.
// 1 game day = 16 game hours × 15 s wall = 240 s wall (TICKS_PER_GAME_DAY × TICK_MS).
// Vektor způsobuje jemný drift hvězdného pozadí — v tooltip úrovni neviditelný,
// ale přes minuty hráč vnímá „svět žije". Nezávislý na cameraY scrollu šipkami.
const DRIFT_MAGNITUDE_PX = 7;
const DRIFT_PERIOD_MS = 240_000;
// Buffer = chunks mimo viewport, které držíme (plynulý scroll bez popu).
const CHUNK_BUFFER = 1;
// Depth pořadí (uvnitř Containeru relativně): DSO vzadu, hvězdy, clusters vepředu.
const DEPTH_DSO = -2;
const DEPTH_STAR = 0;
const DEPTH_CLUSTER = 2;

// Hustoty per chunk (plný bandW × 480 px).
const SMALL_PER_CHUNK = 95;
const MEDIUM_PER_CHUNK = 28;
const LARGE_PER_CHUNK = 5;
const TWINKLE_RATIO = 0.18;
const CLUSTER_CHANCE = 0.55;
const DSO_CHANCE = 0.35;

// Deterministic RNG — mulberry32. Zdroj: bryc/code/PRNGs.
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

// Hash chunk indexu na seed — Knuth multiplicative.
function chunkSeed(chunkIdx: number): number {
  // XOR s konstantou ať negativní i kladný index dostanou různý seed.
  return ((chunkIdx ^ 0x9e3779b1) * 2654435761) >>> 0;
}

export class BackgroundSystem {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bandW: number;
  private viewportH: number;
  private chunks = new Map<number, Phaser.GameObjects.GameObject[]>();
  private cameraY = 0;
  private driftElapsedMs = 0;
  private driftX = 0;
  private driftY = 0;

  constructor(scene: Phaser.Scene, bandW: number, viewportH: number) {
    this.scene = scene;
    this.bandW = bandW;
    this.viewportH = viewportH;
    // Container = vrstva pozadí. Posouváme ho, ne hlavní kameru → UI fixed.
    this.container = scene.add.container(0, 0);
    this.container.setDepth(-10); // pod vším herním obsahem

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  update(cameraY: number): void {
    // Visual shift celé vrstvy pozadí (Container relative souřadnice zůstávají,
    // posouvá se jen transform Containeru). Drift se přičítá přes applyTransform.
    this.cameraY = cameraY;
    this.applyTransform();

    const fromIdx = Math.floor((cameraY - CHUNK_BUFFER * CHUNK_H) / CHUNK_H);
    const toIdx = Math.ceil((cameraY + this.viewportH + CHUNK_BUFFER * CHUNK_H) / CHUNK_H);

    for (let i = fromIdx; i <= toIdx; i++) {
      if (!this.chunks.has(i)) this.generateChunk(i);
    }

    for (const [idx, objs] of this.chunks) {
      if (idx < fromIdx - CHUNK_BUFFER || idx > toIdx + CHUNK_BUFFER) {
        for (const o of objs) o.destroy();
        this.chunks.delete(idx);
      }
    }
  }

  // Tik driftu — voláno z GameScene.update(delta) každý frame (rAF).
  // Drift vektor rotuje s periodou DRIFT_PERIOD_MS. Modulo udržuje přesnost
  // i po hodinách (jinak elapsedMs naroste, sin/cos ztrácejí precision).
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

  private generateChunk(idx: number): void {
    const rng = mulberry32(chunkSeed(idx));
    const y0 = idx * CHUNK_H;
    const objs: Phaser.GameObjects.GameObject[] = [];

    // --- DSO (jemná mlhovina) — 1/3 původní opacity, poloviční velikost ---
    if (rng() < DSO_CHANCE) {
      objs.push(...this.makeDso(rng, y0));
    }

    // --- Malé hvězdy ---
    for (let i = 0; i < SMALL_PER_CHUNK; i++) {
      const x = rng() * this.bandW;
      const y = y0 + rng() * CHUNK_H;
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
      const x = rng() * this.bandW;
      const y = y0 + rng() * CHUNK_H;
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
      const x = rng() * this.bandW;
      const y = y0 + rng() * CHUNK_H;
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
      objs.push(...this.makeCluster(rng, y0));
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

    this.chunks.set(idx, objs);
  }

  private makeCluster(rng: () => number, y0: number): Phaser.GameObjects.GameObject[] {
    const count = 12 + Math.floor(rng() * 14);
    const cx = rng() * this.bandW;
    const cy = y0 + rng() * CHUNK_H;
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

  // DSO: poloviční velikost (40–110 px) + 1/3 opacity (× 0.33 na base alpha).
  private makeDso(rng: () => number, y0: number): Phaser.GameObjects.GameObject[] {
    const cx = rng() * this.bandW;
    const cy = y0 + rng() * CHUNK_H;
    const sizeBase = 40 + rng() * 70; // 40–110 px (polovina oproti původní 80–220)
    const colorRoll = rng();
    const color =
      colorRoll < 0.55 ? COL_INFO_BLUE : colorRoll < 0.85 ? COL_WARN_AMBER : COL_ALERT_RED;
    const layers = 3 + Math.floor(rng() * 3);
    const objs: Phaser.GameObjects.GameObject[] = [];
    for (let i = 0; i < layers; i++) {
      const scale = 1 - i * 0.22 + (rng() - 0.5) * 0.15;
      const w = sizeBase * scale;
      const h = sizeBase * (0.55 + rng() * 0.35) * scale;
      const ox = (rng() - 0.5) * sizeBase * 0.25;
      const oy = (rng() - 0.5) * sizeBase * 0.15;
      // 1/3 opacity: původně 0.04 + i*0.025 → teď × 0.33.
      const alpha = (0.04 + i * 0.025) * 0.33;
      const ellipse = this.scene.add
        .ellipse(cx + ox, cy + oy, w, h, color, alpha)
        .setDepth(DEPTH_DSO);
      this.container.add(ellipse);
      objs.push(ellipse);
    }
    return objs;
  }
}
