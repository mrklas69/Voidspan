// Smoke test klient — ověří že server posílá HELLO + SNAPSHOT stream.
// Běh: `tsx apps/server/src/smoke_client.ts`. Ukončí se po prvním SNAPSHOT.
//
// Slouží jako manual QA před migrací Phaser klienta (etapa 4).

import { WebSocket } from "ws";

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", () => {
  console.log("[smoke] connected");
  // Odeslat PING pro test keep-alive.
  ws.send(JSON.stringify({ type: "PING" }));
});

let helloSeen = false;
let pongSeen = false;
let snapshotsSeen = 0;
let eventsSeen = 0;

ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());
  switch (msg.type) {
    case "HELLO":
      helloSeen = true;
      console.log(
        `[smoke] HELLO schema=v${msg.schemaVersion} tick=${msg.world.tick} events=${msg.recentEvents.length}`,
      );
      break;
    case "PONG":
      pongSeen = true;
      console.log("[smoke] PONG");
      break;
    case "SNAPSHOT":
      snapshotsSeen += 1;
      console.log(
        `[smoke] SNAPSHOT #${snapshotsSeen} tick=${msg.tick} solids=${msg.world.resources.solids.toFixed(2)}`,
      );
      // Exit po 2. snapshotu — máme důkaz, že tick loop běží.
      if (snapshotsSeen >= 2) {
        console.log(
          `[smoke] OK — hello=${helloSeen} pong=${pongSeen} snapshots=${snapshotsSeen} events=${eventsSeen}`,
        );
        ws.close();
        process.exit(0);
      }
      break;
    case "EVENT":
      eventsSeen += 1;
      console.log(`[smoke] EVENT ${msg.event.verb} ${msg.event.text ?? ""}`);
      break;
    default:
      console.warn("[smoke] neznámá zpráva:", msg);
  }
});

ws.on("error", (err) => {
  console.error("[smoke] error:", err.message);
  process.exit(1);
});

// Failsafe timeout — pokud server neodpoví do 10 s, něco je špatně.
setTimeout(() => {
  console.error("[smoke] timeout — server neposlal 2 snapshots do 10 s");
  process.exit(1);
}, 10_000);
