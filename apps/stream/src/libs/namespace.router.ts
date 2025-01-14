import { ServiceContainer, type ServiceParent } from "@pilgrim/backend-utils";
import type { IoServer } from "../utils/websocket.js";
import type { ExtendedError, Namespace, Socket } from "socket.io";
import {
  createResourcePathRegex,
  parseResourcePath,
  stringifyResourcePath,
  type BaseResource,
  type ClientToServerEvents,
  type InterServerEvents,
  type PathPattern,
  type ResourceIds,
  type ResourceRef,
  type ServerToClientEvents,
  type SocketData,
} from "@pilgrim/api-contracts";
import type { ResourceNamespaceHandler } from "./resource-namespace.handler.js";

export type ResourceNamespace<TResource extends BaseResource> = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData<TResource>
>;

export type ResourceSocket<TResource extends BaseResource> = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData<TResource>
>;

export type RegisteredNamespace<TResource extends BaseResource = BaseResource> =
  {
    nsp: ResourceNamespace<TResource>;
    resource: TResource;
  };

function throwOnMissingPatchHandler<TResource extends BaseResource>(
  ref: ResourceRef<TResource>
) {
  throw new Error(
    `Server doesn't provide implementation to handle patch. namespace=${ref.type}`
  );
}

export class NamespaceRouter extends ServiceContainer {
  private readonly namespaces: Map<string, RegisteredNamespace> = new Map();
  constructor(parent: ServiceParent, private readonly io: IoServer) {
    super(parent, NamespaceRouter.name);
  }

  register<TResource extends BaseResource>(
    nspHandler: ResourceNamespaceHandler<TResource>
  ): void {
    const resource = nspHandler.resource;
    const nspName = resource.type;
    const nspPathPattern = createResourcePathRegex(resource, resource.idsOrder);
    if (this.namespaces.has(nspName)) {
      throw new Error(`Namespace already registered. name=${nspName}`);
    }
    const newNsp: ResourceNamespace<TResource> = this.io.of(
      nspPathPattern.regex
    );

    const onPatch = nspHandler.onPatch || throwOnMissingPatchHandler;

    // TODO:
    // - namespace middlewares
    // - namespace event handlers

    this.resourceIdsRoomMiddleware(resource, newNsp, nspPathPattern);

    newNsp.on("connection", (socket) => {
      this.logger.info("New connection", {
        name: nspName,
        sid: socket.id,
        ids: socket.data.ids,
        rooms: Array.from(socket.rooms),
      });
      nspHandler.onConnection?.(socket);

      socket.on("patch", onPatch);
    });

    this.namespaces.set(nspName, {
      nsp: newNsp,
      resource,
    });
    this.logger.debug("Handler registered", { namespace: nspName });
  }

  tryGetNsp(nspName: string): RegisteredNamespace | undefined {
    return this.namespaces.get(nspName);
  }

  getNsp(nspName: string): RegisteredNamespace {
    const nsp = this.tryGetNsp(nspName);
    if (!nsp) {
      throw new Error(`Namespace not found. name=${nspName}`);
    }
    return nsp;
  }

  resourceIdsRoomMiddleware<TResource extends BaseResource>(
    resource: TResource,
    nsp: ResourceNamespace<TResource>,
    nspPathPattern: PathPattern
  ) {
    nsp.use((socket, next) => {
      const ids = parseResourcePath<TResource>(nspPathPattern, socket.nsp.name);
      if (ids === null) {
        const err: ExtendedError = new Error("FATAL_ERROR");
        err.data = { content: "Couldn't resolve resource's ids" };
        next(err);
      } else {
        (socket.data.ids as ResourceIds<TResource>) = ids;
        socket.join(stringifyResourcePath(resource, socket.data.ids));
        next();
      }
    });
  }
}
