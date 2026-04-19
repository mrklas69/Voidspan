// Voidspan server — Osa 2 v1.1 POC (Perpetual Observer persistent simulation).
//
// Axiom: svět žije i bez diváka. Server drží autoritativní World, klienti
// read-only projekce. Žádná validace klientského inputu (FVP observer),
// žádná autentizace (Q4 rozhodnutí A: no auth, public read).
//
// Pipeline per tick (250 ms = TICK_MS):
//   1. eventCountBefore = w.events.length
//   2. stepWorld(w) — standardní simulace (decay, protocol, tasks, ...)
//   3. broadcast nové eventy (w.events.slice(eventCountBefore))
//   4. každých SNAPSHOT_TICK_INTERVAL ticků: broadcast full SNAPSHOT
//
// Persistence: world.json každých SAVE_INTERVAL_MS. Při SIGINT/SIGTERM
// save navíc před exit.

import { WebSocketServer, WebSocket } from "ws";
import {
  createInitialWorld,
  stepWorld,
  TICK_MS,
  EVENT_LOG_CAPACITY,
  type World,
  type ServerMsg,
  type ClientMsg,
  SCHEMA_VERSION,
} from "@voidspan/shared";
import { saveWorld, loadWorldOrNull } from "./persistence.js";

// === Konfigurace ===

const PORT = Number(process.env.VOIDSPAN_PORT ?? 3000);
const WORLD_PATH = process.env.VOIDSPAN_WORLD_PATH ?? "./data/world.json";

// Full SNAPSHOT každých 10 ticků = 2.5 s wall při ×1. Kompromis mezi
// bandwidth (World je ~50 KB JSON) a sync latency (klient dozná tick-based
// stav mezi snapshoty jen přes EVENT — tick counter bez snapshotu se ztratí).
// Delta komprese P2+ zjemní (Colyseus / diff JSON).
const SNAPSHOT_TICK_INTERVAL = 10;

// Persist každých 30 s wall — Q1 rozhodnutí, POC friendly (crash window 30 s).
const SAVE_INTERVAL_MS = 30_000;

// === State ===

// Autoritativní world. Load existujícího snapshotu nebo fresh init.
const loaded = loadWorldOrNull(WORLD_PATH);
const world: World = loaded ?? createInitialWorld();
if (!loaded) {
  console.log("[boot] fresh world vytvořen přes createInitialWorld()");
}

// Set aktivních klientů. Při broadcast iterujeme tento set.
// WeakSet by odstranil dead entries automaticky, ale běžný Set + ws "close"
// handler je explicitnější pro debugging.
const clients = new Set<WebSocket>();

// === Broadcast helper ===

function broadcast(msg: ServerMsg): void {
  const json = JSON.stringify(msg);
  for (const ws of clients) {
    // readyState 1 = OPEN. Pokud se klient právě odpojuje, ws.send vyhodí —
    // guard přes stav je levnější než try/catch per send.
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

// === Simulation loop ===

// Pro tracking nových eventů mezi ticky. Pokud ring buffer (EVENT_LOG_CAPACITY)
// vytlačí staré, length zůstává konstantní a starší indexy by nás zmátly —
// v praxi per-tick přibývá 0-2 eventy, buffer 500 se nepřetýká.
let lastEventCount = world.events.length;
let tickCounter = 0;

const tickInterval = setInterval(() => {
  const before = world.events.length;
  stepWorld(world);
  tickCounter += 1;

  // 1) Nové eventy — broadcast per-event pro mid-tick vizibilitu.
  const newEvents = world.events.slice(before);
  for (const ev of newEvents) {
    broadcast({ type: "EVENT", event: ev });
  }
  lastEventCount = world.events.length;

  // 2) Full SNAPSHOT periodicky — zachytí změny stavu bez eventu (resources,
  //    tick, milestones acked) a drží klienta přesně synchronní.
  if (tickCounter % SNAPSHOT_TICK_INTERVAL === 0) {
    broadcast({ type: "SNAPSHOT", tick: world.tick, world });
  }
}, TICK_MS);

// === Persistence loop ===

const saveInterval = setInterval(() => {
  try {
    saveWorld(world, WORLD_PATH);
    console.log(`[persist] tick=${world.tick} saved`);
  } catch (err) {
    console.error(`[persist] save selhal: ${String(err)}`);
  }
}, SAVE_INTERVAL_MS);

// === WebSocket server ===

const wss = new WebSocketServer({ port: PORT });
console.log(`[ws] listening on ws://localhost:${PORT} (schema v${SCHEMA_VERSION})`);

wss.on("connection", (ws, req) => {
  const addr = req.socket.remoteAddress ?? "?";
  console.log(`[ws] connect from ${addr} (clients=${clients.size + 1})`);
  clients.add(ws);

  // HELLO — first message. Full world + recent events (až EVENT_LOG_CAPACITY
  // poslední, Q3 varianta B). Klient si z toho naplní UI a čeká na stream.
  const hello: ServerMsg = {
    type: "HELLO",
    schemaVersion: SCHEMA_VERSION,
    world,
    recentEvents: world.events.slice(-EVENT_LOG_CAPACITY),
  };
  ws.send(JSON.stringify(hello));

  // Klientské zprávy — zatím jen PING (keep-alive heartbeat).
  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as ClientMsg;
      if (msg.type === "PING") {
        ws.send(JSON.stringify({ type: "PONG" } satisfies ServerMsg));
      }
    } catch {
      // Ignore malformed input — server se nesmí shodit nad špatnou zprávou.
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[ws] disconnect ${addr} (clients=${clients.size})`);
  });

  ws.on("error", (err) => {
    console.error(`[ws] error ${addr}: ${String(err)}`);
  });
});

// === Graceful shutdown ===
//
// SIGINT (Ctrl+C) nebo SIGTERM (systemd stop) → 1× save + zavři sockety + exit.
// Bez tohoto by crash mezi tickem a save intervalem ztratil až 30 s stavu.

function shutdown(signal: string): void {
  console.log(`[shutdown] ${signal} — saving world...`);
  clearInterval(tickInterval);
  clearInterval(saveInterval);
  try {
    saveWorld(world, WORLD_PATH);
    console.log(`[shutdown] saved tick=${world.tick}`);
  } catch (err) {
    console.error(`[shutdown] save selhal: ${String(err)}`);
  }
  wss.close(() => {
    console.log("[shutdown] ws closed");
    process.exit(0);
  });
  // Fallback timeout — pokud se wss nezavře do 3 s, force exit.
  setTimeout(() => process.exit(0), 3000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Explicitní unused marker pro lint — lastEventCount drží hodnotu pro případ
// budoucího re-use (např. retry broadcast po reconnect storm).
void lastEventCount;
