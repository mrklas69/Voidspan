// Protocol — WS zprávy mezi serverem a klientem (Osa 2, v1.1 POC).
//
// Axiom: server autoritativní, klient read-only projekce. FVP není žádný
// validovaný input z klienta — rychlost času je client-side only (server běží
// pevně ×1), rozhodnutí kapitána first-come first-served (Q2/Q4).
//
// Formát: JSON over WebSocket. Pro delta kompresi P2+ lze přejít na binary
// (MessagePack, Colyseus schema) — dnes KISS full JSON snapshot.

import type { World, Event } from "./model";

// Schema verze — bump při breaking changes ve World struktuře.
// Persistence (world.json) nese stejnou verzi; při mismatch server nuke & restart (Q5).
// v2 (S41): Event.id monotónní counter + World.nextEventId pro reconnect dedup.
export const SCHEMA_VERSION = 2 as const;

// === Server → Client ===
//
// HELLO — first message po connection. Full world snapshot + recent events
// ring buffer (Q3 varianta B: posledních EVENT_LOG_CAPACITY = 500 eventů).
// Klient si naplní UI state a pokračuje subscribcí na SNAPSHOT/EVENT stream.
export type ServerHello = {
  type: "HELLO";
  schemaVersion: typeof SCHEMA_VERSION;
  world: World;
  recentEvents: Event[];
};

// SNAPSHOT — full world state každý N-tý tick. Pro POC full dump (KISS).
// Delta komprese je optimalizace P2+, jakmile se ukáže bandwidth problem.
export type ServerSnapshot = {
  type: "SNAPSHOT";
  tick: number;
  world: World;
};

// EVENT — single new event, emitted mid-tick přes appendEvent.
// Server drží lastBroadcastEventCount a posílá jen nové přírůstky každý tick.
export type ServerEvent = {
  type: "EVENT";
  event: Event;
};

// PONG — odpověď na klientův PING, keep-alive latence check (Q3 heartbeat).
export type ServerPong = {
  type: "PONG";
};

export type ServerMsg = ServerHello | ServerSnapshot | ServerEvent | ServerPong;

// === Client → Server ===
//
// PING — heartbeat každých 10 s wall (Q3). Server po 30 s bez PING uzavírá socket.
export type ClientPing = {
  type: "PING";
};

export type ClientMsg = ClientPing;
