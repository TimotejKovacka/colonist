import type { Redis } from "ioredis";
import {
  ServiceContainer,
  type ServiceParent,
} from "../../../../packages/backend-utils/src/service.js";
import { WebSocket } from "ws";
import type { NoOverride } from "../../../../packages/backend-utils/src/no-override.js";

export class WebSocketService extends ServiceContainer {
  private connections: Map<string, WebSocket> = new Map();
  private redis: Redis;

  constructor(parent: ServiceParent, redis: Redis) {
    super(parent, WebSocketService.name);
    this.redis = redis.duplicate();
  }

  protected override async nodeStart(): Promise<NoOverride> {
    this.redis.connect();
    const lobbyChannel = "lobby_events";
    this.redis.subscribe(lobbyChannel); // sub to messages associated with lobby
    this.redis.on("message", (channel, message) => {
      if (channel === lobbyChannel) {
        this.logger.info(message);
      }
    });
  }

  addConnection(id: string, socket: WebSocket) {
    this.connections.set(id, socket);
  }

  removeConnection(id: string) {
    this.connections.delete(id);
  }

  broadcast(envelope: unknown) {
    const message = JSON.stringify(envelope);
    for (const socket of this.connections.values()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }

  sendToUser(userId: string, envelope: unknown) {
    const socket = this.connections.get(userId);
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(envelope));
    }
  }
}
