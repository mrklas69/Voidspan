// WsClient — tenký wrapper kolem browser WebSocket (Osa 2 etapa 4).
//
// Axiom: klient read-only projekce autoritativního serveru. Tenhle modul řeší
// jen transport: připojení, reconnect backoff, PING heartbeat, JSON parse +
// dispatch typovaných zpráv. Aplikační logika (apply HELLO do World, push EVENT
// do events[]) žije v GameScene — wrapper jen volá handler callbacky.
//
// Reconnect strategy: exponential backoff 1s → 2s → 4s → 8s → 16s → max 30s
// s jitterem ±20 % (rozprostří re-connect storm při výpadku serveru). Backoff
// resetuje na 0 po úspěšném HELLO (ne jen po open — open bez HELLO nic nedělá).
//
// Heartbeat: PING každých PING_INTERVAL_MS wall (server očekává < 30 s mezi
// zprávami, jinak uzavírá socket). PONG reply zahazujeme — slouží jen jako
// keep-alive pro NAT/proxy timeouty, ne jako liveness probe (ws "close" je
// autoritativní signál).

import type { ServerMsg, ClientMsg, Event, World } from "@voidspan/shared";

// Public handler API. Všechny callbacky optional — GameScene si zaregistruje
// jen ty, které potřebuje. Dispatch je synchronní (žádné Promise).
export type WsClientHandlers = {
  onHello?: (world: World, recentEvents: Event[]) => void;
  onSnapshot?: (tick: number, world: World) => void;
  onEvent?: (event: Event) => void;
  // Status změny pro UI indicator ("connecting" / "connected" / "reconnecting").
  onStatus?: (status: WsStatus) => void;
};

export type WsStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

// Heartbeat interval — server timeout je 30 s, posíláme s marginem.
const PING_INTERVAL_MS = 10_000;

// Exp backoff — start 1 s, zdvojnásobuje, cap 30 s.
const BACKOFF_START_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

// Jitter ±20 % násobí finální delay. Rozprostře reconnect storm (100 klientů
// najednou nespadne na server v přesně stejný moment).
function jitter(delayMs: number): number {
  const spread = 0.2;
  const factor = 1 + (Math.random() * 2 - 1) * spread;
  return Math.round(delayMs * factor);
}

export class WsClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly handlers: WsClientHandlers;

  // Flag „uživatel explicitně zavolal close()" — zabrání auto-reconnectu.
  private closedByUser = false;

  // Aktuální backoff delay. Zdvojnásobuje po každém close(), resetuje po HELLO.
  private backoffMs = BACKOFF_START_MS;

  // Timers pro cleanup (reconnect scheduling + heartbeat interval).
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  private status: WsStatus = "disconnected";

  constructor(url: string, handlers: WsClientHandlers = {}) {
    this.url = url;
    this.handlers = handlers;
  }

  /** Zahájí připojení. Idempotent — volání na již připojeného klienta se ignoruje. */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.closedByUser = false;
    this.setStatus("connecting");
    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      // Malformed URL apod. — naplánuj reconnect, ať to neskončí tichem.
      console.error(`[ws] connect error: ${String(err)}`);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      // Nečekáme na HELLO — PING heartbeat startuje hned, aby server
      // viděl activity i v edge case, kdy HELLO zpoždí (shouldn't happen).
      this.startHeartbeat();
    };

    this.ws.onmessage = (ev) => {
      this.handleMessage(ev.data);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      if (this.closedByUser) {
        this.setStatus("disconnected");
        return;
      }
      this.setStatus("reconnecting");
      this.scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      // Nepouštíme sem reconnect — po error vždy následuje close, který
      // reconnect naplánuje (jinak bychom reconnect volali 2×).
      console.error(`[ws] error`, err);
    };
  }

  /** Pošle typovanou zprávu na server. Pokud socket není OPEN, tiše dropne. */
  send(msg: ClientMsg): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /** Uzavře spojení a zablokuje auto-reconnect. */
  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  getStatus(): WsStatus {
    return this.status;
  }

  // === Internal ============================================================

  private handleMessage(data: unknown): void {
    if (typeof data !== "string") {
      // Binary frames zatím nepodporujeme — full JSON protocol v1.1.
      return;
    }
    let msg: ServerMsg;
    try {
      msg = JSON.parse(data) as ServerMsg;
    } catch {
      console.warn("[ws] malformed JSON, dropping");
      return;
    }
    switch (msg.type) {
      case "HELLO":
        // Po úspěšném HELLO reset backoff — další disconnect začne znovu od 1s.
        this.backoffMs = BACKOFF_START_MS;
        this.setStatus("connected");
        this.handlers.onHello?.(msg.world, msg.recentEvents);
        break;
      case "SNAPSHOT":
        this.handlers.onSnapshot?.(msg.tick, msg.world);
        break;
      case "EVENT":
        this.handlers.onEvent?.(msg.event);
        break;
      case "PONG":
        // Keep-alive reply — bez business logiky. Zdroj pravdy o liveness
        // je ws "close", ne chybějící PONG.
        break;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      this.send({ type: "PING" });
    }, PING_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    const delay = jitter(this.backoffMs);
    console.log(`[ws] reconnect za ${delay}ms (backoff ${this.backoffMs}ms)`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
    // Zdvojnásob pro příští round, strop BACKOFF_MAX_MS.
    this.backoffMs = Math.min(this.backoffMs * 2, BACKOFF_MAX_MS);
  }

  private setStatus(next: WsStatus): void {
    if (this.status === next) return;
    this.status = next;
    this.handlers.onStatus?.(next);
  }
}
