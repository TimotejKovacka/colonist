import {
  idsRef,
  SOCKET_PATH,
  stringifyResourcePath,
  type BaseResource,
  type ClientToServerEvents,
  type InterServerEvents,
  type ResourceIds,
  type ResourcePatch,
  type ServerToClientEvents,
  type SocketData,
} from "@pilgrim/api-contracts";
import {
  ServiceContainer,
  type Message,
  type Publisher,
  type ServiceParent,
} from "@pilgrim/backend-utils";
import { Server } from "socket.io";
import type { FastifyTypeboxInstance } from "./fastify.js";
import { generatePatch } from "@pilgrim/utils";
import { ResourceRouter } from "../libs/resource-router.js";

export type IoServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export class WebSocketServer extends ServiceContainer implements Publisher {
  readonly ioPath = SOCKET_PATH;
  readonly ioConnectionStateRecoveryMs = 120_000; // 2 minutes
  readonly io: IoServer;
  readonly router: ResourceRouter;

  constructor(parent: ServiceParent, httpServer: FastifyTypeboxInstance) {
    super(parent, WebSocketServer.name, { ioPath: SOCKET_PATH });
    this.io = new Server(httpServer.server, {
      path: this.ioPath,
      connectionStateRecovery: {
        maxDisconnectionDuration: this.ioConnectionStateRecoveryMs,
      },
    });
    this.router = new ResourceRouter(this);

    this.setupMiddlewares();
    this.setupConnectionHandlers();
  }

  public get server() {
    return this.io;
  }

  private setupMiddlewares() {
    // Auth Middleware
    this.io.use(async (_socket, next) => {
      // const token = socket.handshake.auth.token;
      try {
        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });
    // No clue what this is yet but will be needed
    this.io.use(async (socket, next) => {
      socket.data.subscribedResources = new Set();
      next();
    });
  }

  private setupConnectionHandlers() {
    this.io.on("connection", (socket) => {
      this.logger.info("Client connected", { socketId: socket.id });

      socket.on("subscribe", (ref) => {
        this.router.handleSubscribe(socket, ref);
      });

      socket.on("unsubscribe", (ref) => {
        this.router.handleUnsubscribe(socket, ref);
      });

      socket.on("patch", (ref, patch) => {
        // Validate patch.ref matches ref
        // if (ref.type !== patch.ref.type) {
        //   socket.emit('error', { message: 'Resource type mismatch' });
        //   return;
        // }
        this.router.handlePatch(socket, ref, patch);
      });

      socket.on("disconnect", (reason) => {
        this.logger.info("Client disconnected", {
          socketId: socket.id,
          reason,
        });
      });
    });
  }

  public broadcastPatch<TResource extends BaseResource>(
    resource: TResource,
    ids: ResourceIds<TResource>,
    patch: ResourcePatch,
    excludeSocket?: string
  ) {
    const resourcePath = stringifyResourcePath(resource, ids);
    this.logger.debug("Broadcasting patch", { resourcePath, patch });

    if (excludeSocket) {
      this.io
        .to(resourcePath)
        .except(excludeSocket)
        .emit("patch", idsRef(resource, ids), patch);
    } else {
      this.io.to(resourcePath).emit("patch", idsRef(resource, ids), patch);
    }
  }

  async publish<TResource extends BaseResource>(
    resource: TResource,
    message: Message<TResource>
  ): Promise<void> {
    const patch: ResourcePatch = {
      patch: generatePatch(message.oldDto, message.dto),
      oldModifiedAtMs: message.oldDto?.modifiedAtMs,
    };
    this.broadcastPatch(resource, message.ref, patch);
  }
}
