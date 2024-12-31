import type { Redis } from "ioredis";
import { ServiceContainer, type ServiceParent } from "./service.js";
import type { WebSocket } from "ws";
import { NoOverride } from "./no-override.js";

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
        const wsMsg: { type: string; payload: { lobbyId: string } } = JSON.parse(message);

        const lobby = 
      }
    });
  }

  addConnection(id: string, socket: WebSocket) {
    this.connections.set(id, socket);
  }

  removeConnection(id: string) {
    this.connections.delete(id);
  }

  broadcast(envelope: WebSocketEnvelope) {
    const message = JSON.stringify(envelope);
    for (const socket of this.connections.values()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }

  sendToUser(userId: string, envelope: WebSocketEnvelope) {
    const socket = this.connections.get(userId);
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(envelope));
    }
  }
}
