import { ServiceContainer, type ServiceParent } from "@pilgrim/backend-utils";
import type { RawServer } from "./fastify.js";
import { Server } from "socket.io";
import {
  SOCKET_PATH,
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
  readonly io: IoServer;
  readonly router: NamespaceRouter;
  constructor(parent: ServiceParent, httpServer: RawServer) {
    super(parent, WebSocketServer.name);
    this.io = new Server(httpServer, {
      path: SOCKET_PATH,
      connectionStateRecovery: {
        maxDisconnectionDuration: 120_000, // 2 minutes
      },
    });
    this.router = new NamespaceRouter(this, this.io);

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
}
