import { io, type Socket } from "socket.io-client";
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  type ResourcePatch,
  SOCKET_PATH,
  type BaseResource,
  type ResourceRef,
} from "@pilgrim/api-contracts";
import { ConsoleLogger, EventEmitter, type Logger } from "@pilgrim/utils";

type WebSocketEvents = {
  connected: () => void;
  disconnected: () => void;
  error: (e: Error) => void;
  patch: <TResource extends BaseResource>(
    ref: ResourceRef<TResource>,
    patch: ResourcePatch
  ) => void;
};
type PatchCallback = (patch: ResourcePatch) => void;
type Subscription<TResource extends BaseResource> = {
  ref: ResourceRef<TResource>;
  callbacks: Set<PatchCallback>;
};
type ResourceType = string;

export class WebSocketClient {
  private logger: Logger;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private eventEmitter: EventEmitter<WebSocketEvents> = new EventEmitter();
  // biome-ignore lint/suspicious/noExplicitAny: We allow subscriptions for any resource
  private subscriptions: Map<ResourceType, Subscription<any>> = new Map();
  private readonly ACK_TIMEOUT = 5_000;
  private _isConnected = false;

  constructor(
    url: string,
    logger = new ConsoleLogger({
      module: "WebSocketClient",
      meta: { url, socketPath: SOCKET_PATH },
    })
  ) {
    this.logger = logger;

    this.socket = io(url, {
      path: SOCKET_PATH,
      autoConnect: true,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
    });

    this._isConnected = this.socket.connected;
    this.setupEventHandlers();
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  private setupEventHandlers() {
    this.logger.debug("Attaching event handlers");
    this.socket.on("connect", () => {
      this._isConnected = true;
      this.logger.info("Connected to server");
      this.eventEmitter.emit("connected");

      for (const [_, subscription] of this.subscriptions) {
        this.socket.emit("subscribe", subscription.ref); // TODO convert to emitWithAck
        this.logger.debug("Resubscribed to resource after connect", {
          ref: subscription.ref,
        });
      }
    });

    this.socket.on("disconnect", (reason, description) => {
      this._isConnected = false;
      this.logger.info("Disconnected from server", { reason, description });
      this.eventEmitter.emit("disconnected");
    });

    this.socket.on("error", (error) => {
      this.logger.error("Socket error", {}, error);
      this.eventEmitter.emit("error", new Error(error.message));
    });

    this.socket.on("patch", (ref, patch) => {
      this.logger.debug("Received patch", { patch });
      const subscription = this.subscriptions.get(ref.type);
      if (subscription) {
        for (const callback of subscription.callbacks) {
          callback(patch);
        }
      }
      this.eventEmitter.emit("patch", ref, patch);
      // TODO: resolve to the right callbacks
    });
  }

  subscribe<TResource extends BaseResource>(
    ref: ResourceRef<TResource>,
    callback: (patch: ResourcePatch) => void
  ) {
    let subscription = this.subscriptions.get(ref.type);
    if (!subscription) {
      subscription = {
        ref,
        callbacks: new Set(),
      };
      this.subscriptions.set(ref.type, subscription);
      if (this.socket.connected) {
        this.socket.emit("subscribe", ref);
        this.logger.debug("Subscribed to resource", { ref });
      } else {
        this.logger.debug("Queued subscription for when socket connects", {
          ref,
        });
      }
    }
    subscription.callbacks.add(callback);
    this.logger.debug("Callback registered", { ref });

    return () => {
      const subscription = this.subscriptions.get(ref.type);
      if (subscription) {
        subscription.callbacks.delete(callback);
        this.logger.debug("Callback un-registered", { ref });
        if (subscription.callbacks.size === 0) {
          this.subscriptions.delete(ref.type);
          if (this.socket.connected) {
            this.socket.emit("unsubscribe", ref);
            this.logger.debug("Unsubscribed from resource", { ref });
          }
        }
      }
    };
  }

  on<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): () => void {
    this.eventEmitter.on(event, callback);
    return () => this.eventEmitter.off(event, callback);
  }

  sendPatch<TResource extends BaseResource>(
    ref: ResourceRef<TResource>,
    patch: ResourcePatch
  ) {
    // Validate ref matches patch.ref
    // if (!isRefType(resource, patch.ref)) {
    //   throw new Error("Patch ref does not match resource ref");
    // }

    this.socket.emit("patch", ref, patch);
  }

  disconnect() {
    this.socket.disconnect();
  }

  get connected() {
    return this.socket.connected;
  }
}
