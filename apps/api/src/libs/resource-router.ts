import {
  stringifyResourcePath,
  type BaseResource,
  type ResourcePatch,
  type ResourceRef,
} from "@pilgrim/api-contracts";
import { ServiceContainer, type ServiceParent } from "@pilgrim/backend-utils";
import type { Socket } from "socket.io";

export type ResourceHandler<TResource extends BaseResource> = {
  resource: TResource;

  onSubscribe?: (socket: Socket, ref: ResourceRef<TResource>) => Promise<void>;
  onUnsubscribe?: (
    socket: Socket,
    ref: ResourceRef<TResource>
  ) => Promise<void>;
  onPatch?: (
    socket: Socket,
    ref: ResourceRef<TResource>,
    patch: unknown
  ) => Promise<void>;
};

export class ResourceRouter extends ServiceContainer {
  // biome-ignore lint/suspicious/noExplicitAny: arbitrary resource handler
  private readonly handlers = new Map<string, ResourceHandler<any>>();

  constructor(parent: ServiceParent) {
    super(parent, ResourceRouter.name);
  }

  registerHandler<TResource extends BaseResource>(
    handler: ResourceHandler<TResource>
  ) {
    const type = handler.resource.type;
    if (this.handlers.has(type)) {
      throw new Error(`Handler already registered for type=${type}`);
    }
    this.handlers.set(type, handler);
    this.logger.info("Registered resource handler", {
      resourceType: type,
    });
  }

  private findHandler<TResource extends BaseResource>(
    ref: ResourceRef<TResource>
  ): ResourceHandler<TResource> | undefined {
    return this.handlers.get(ref.type);
  }

  async handleSubscribe<TResource extends BaseResource>(
    socket: Socket,
    ref: ResourceRef<TResource>
  ): Promise<void> {
    const handler = this.findHandler(ref);

    if (!handler) {
      this.logger.warn("No handler found for resource type", {
        type: ref.type,
      });
      socket.emit("error", { message: "Invalid resource type" });
      return;
    }

    try {
      await handler.onSubscribe?.(socket, ref);

      // Use stringifyResourcePath to create a consistent room identifier
      const room = stringifyResourcePath(handler.resource, ref);
      await socket.join(room);

      this.logger.debug("Client subscribed to resource", {
        socketId: socket.id,
        resourceType: ref.type,
        ref,
      });
    } catch (error) {
      this.logger.error("Error handling subscribe", { ref }, error);
      socket.emit("error", {
        message: `Failed to subscribe: ${(error as Error).message}`,
      });
    }
  }

  async handleUnsubscribe<TResource extends BaseResource>(
    socket: Socket,
    ref: ResourceRef<TResource>
  ): Promise<void> {
    const handler = this.findHandler(ref);

    if (!handler) {
      return; // Silently ignore unsubscribe for invalid types
    }

    try {
      await handler.onUnsubscribe?.(socket, ref);

      const room = stringifyResourcePath(handler.resource, ref);
      await socket.leave(room);

      this.logger.debug("Client unsubscribed from resource", {
        socketId: socket.id,
        resourceType: ref.type,
        ref,
      });
    } catch (error) {
      this.logger.error("Error handling unsubscribe", { error, ref });
    }
  }

  async handlePatch<TResource extends BaseResource>(
    socket: Socket,
    ref: ResourceRef<TResource>,
    patch: ResourcePatch
  ): Promise<void> {
    const handler = this.findHandler(ref);

    if (!handler) {
      socket.emit("error", { message: "Invalid resource type for patch" });
      return;
    }

    if (!handler.onPatch) {
      socket.emit("error", {
        message: "Patches not supported for this resource",
      });
      return;
    }

    try {
      await handler.onPatch(socket, ref, patch);
    } catch (error) {
      this.logger.error("Error handling patch", { error, ref });
      socket.emit("error", {
        message: `Failed to apply patch: ${(error as Error).message}`,
      });
    }
  }
}
