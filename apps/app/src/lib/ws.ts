import {
  ConsoleLogger,
  EventEmitter,
  JsonSerde,
  type Logger,
} from "@colonist/utils";

type WebSocketMessage = {
  type: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  payload: any;
};

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private serde = new JsonSerde<WebSocketMessage>();
  private eventEmitter = new EventEmitter();
  private logger: Logger;

  constructor(url: string) {
    this.url = url;
    this.logger = new ConsoleLogger({ module: "WebSocket", meta: { url } });
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.logger.info("Connected");
        this.reconnectAttempts = 0;
        this.eventEmitter.emit("connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const message = this.serde.decode(event.data);
          this.eventEmitter.emit(message.type, message.payload);
        } catch (error) {
          this.logger.error("Failed to parse message", { ...event }, error);
        }
      };

      this.ws.onclose = () => {
        this.logger.info("Disconnected");
        this.eventEmitter.emit("disconnected");
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        this.logger.error("Error", {}, error);
        this.eventEmitter.emit("error", error);
      };
    } catch (error) {
      this.logger.info("Failed to connect", {}, error);
      console.error("Failed to connect to WebSocket:", error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error("Max reconnection attempts reached", {
        reconnectAttempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      });
      this.eventEmitter.emit("maxReconnectAttemptsReached");
      return;
    }

    this.reconnectAttempts++;
    this.logger.info("Attempting to reconnect", {
      reconnectAttempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
    });

    setTimeout(() => {
      this.connect();
    }, this.reconnectTimeout * this.reconnectAttempts);
  }

  subscribe<T>(event: string, callback: (data: T) => void) {
    this.eventEmitter.on(event, callback);
    return () => this.eventEmitter.off(event, callback);
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  send(type: string, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    const message = this.serde.encode({ type, payload });
    this.ws.send(message);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsManager = new WebSocketManager(import.meta.env.VITE_STREAM_HOST);
