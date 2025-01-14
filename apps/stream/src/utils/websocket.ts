import {
  ServiceContainer,
  type NoOverride,
  type ServiceParent,
} from "@pilgrim/backend-utils";
import type { RawServer } from "./fastify.js";
import { Server, type ServerOptions } from "socket.io";
import {
  stringifyResourcePath,
  type BaseResource,
  type ClientToServerEvents,
  type InterServerEvents,
  type ResourcePatch,
  type ResourceRef,
  type ServerToClientEvents,
  type SocketData,
} from "@pilgrim/api-contracts";
import { NamespaceRouter } from "../libs/namespace.router.js";

export type IoServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export class WebSocketServer extends ServiceContainer {
  readonly ioConfig: Partial<ServerOptions> = {
    path: "/socket.io",
    connectionStateRecovery: {
      maxDisconnectionDuration: 120_000, // 2 minutes
    },
    allowEIO3: true,
    transports: ["websocket"],
  };
  readonly io: IoServer;
  readonly router: NamespaceRouter;
  constructor(parent: ServiceParent, httpServer: RawServer) {
    super(parent, WebSocketServer.name);
    this.io = new Server(httpServer);
    this.router = new NamespaceRouter(this, this.io);

    this.io.on("connection", (socket) => {
      this.logger.info("Client connected", { socketId: socket.id });
    });
    // TODO:
    // - namespace router
    // - setup middleware
    // - attach handlers
  }

  publish<TResource extends BaseResource>(
    ref: ResourceRef<TResource>,
    patch: ResourcePatch
  ): void {
    const { resource, nsp } = this.router.getNsp(ref.type);
    const room = stringifyResourcePath(resource, ref);
    nsp.to(room).emit("patch", ref, patch);
  }

  protected override async nodeStart(): Promise<NoOverride> {
    this.logger.info("Socket.io listening", this.ioConfig);
  }
}
