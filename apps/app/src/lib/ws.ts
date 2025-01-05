import type {
  PayloadFromMessageType,
  WebSocketMessage,
  WebSocketStatus,
} from "@/types/websocket";
import { ConsoleLogger, type Logger } from "./logger";

export class WebSocketClient {
  private static instance: WebSocketClient;
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: Map<
    WebSocketMessage["type"],
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    Set<(payload: any) => void>
  > = new Map();
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();
  private logger: Logger = new ConsoleLogger({
    module: "WebSocketClient",
  });

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  connect(url: string) {
    if (this.ws) {
      this.logger.info("existing connection found, closing websocket");
      this.ws.close();
    }

    this.logger.info(`opening connection to: ${url}`);
    this.ws = new WebSocket(url);
    this.updateStatus("connecting");

    this.ws.onopen = () => {
      this.updateStatus("connected");
      this.reconnectAttempts = 0;
      this.startPingInterval();
    };

    this.ws.onclose = () => {
      this.updateStatus("disconnected");
      this.reconnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.logger.info("Received message:", { ...message });
        this.notifyListeners(message);
      } catch (error) {
        this.logger.error("Failed to parse WebSocket message:", {}, error);
      }
    };
  }

  private reconnect() {
    if (this.reconnectAttempts >= 5) return;

    this.updateStatus("reconnecting");
    this.reconnectAttempts++;

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000);
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.ws?.url ?? "");
    }, delay);
  }

  private updateStatus(newStatus: WebSocketStatus) {
    this.logger.info(`status updating: ${newStatus}`);
    this.status = newStatus;
    for (const listener of this.statusListeners) {
      listener(newStatus);
    }
  }

  addMessageListener<T extends WebSocketMessage["type"]>(
    type: T,
    callback: (payload: PayloadFromMessageType<T>) => void
  ) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(callback);

    // Return cleanup function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  addStatusListener(callback: (status: WebSocketStatus) => void) {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notifyListeners(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type);
    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(message.type);
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }
    this.ws.send(JSON.stringify(message));
  }

  private startPingInterval() {
    this.send({
      type: "ping",
      payload: null,
    });
    setInterval(() => {
      if (this.status === "connected") {
        this.send({
          type: "ping",
          payload: null,
        });
      }
    }, 30000); // Send ping every 30 seconds
  }
}
