import {
  stringifyResourcePath,
  type BaseResource,
  type ResourceDto,
  type ResourceId,
  type ResourceIds,
} from "@colonist/api-contracts";
import type {
  WebSocketMessage,
  WebSocketResourceRoute,
  WebSocketRouteContext,
} from "./ws-resource-route.js";
import { ServiceContainer, type Message, type ServiceParent } from "@colonist/backend-utils";
import { matchPath } from "./path-matcher.js";
import { isObject } from "@colonist/utils";

export type ResourcePatch = {
    patch: unknown; // null / undefined for delete
    oldModifiedAtMs: number | undefined // undefined for newly created resource
}

export function isResourcePatch(obj: unknown): obj is ResourcePatch {
    return isObject(obj) && "patch" in obj;
}

export class MessageRouter extends ServiceContainer {
  // biome-ignore lint/suspicious/noExplicitAny: We don't care at this level about the type
  private routes = new Map<string, WebSocketResourceRoute<any>>();
  private subscribers = new Map<string, Set<WebSocketRouteContext>>();

  constructor(parent: ServiceParent) {
    super(parent, MessageRouter.name);
  }

  /**
   * Register a new route handler
   */
  register<TResource extends BaseResource>(
    route: WebSocketResourceRoute<TResource>
  ): void {
    const resource = route.resource;
    const ids = Object.fromEntries(
      resource.idsOrder.map((idKey) => [
        idKey,
        `:${idKey as string}` as ResourceId,
      ])
    );
    const instancePath = stringifyResourcePath(resource, ids);
    this.routes.set(instancePath, route);
    this.logger.debug("Registered new route", { path: instancePath });
  }

  /**
   * Add a subscriber to a concrete path
   */
  async subcribe(
    target: string,
    context: WebSocketRouteContext
  ): Promise<boolean> {
    // Resolve target to route
    const { route, ids } = this.resolveTarget(target);

    const allowed = await route.onSubscribe(ids);
    if (allowed) {
      if (!this.subscribers.has(target)) {
        this.subscribers.set(target, new Set());
      }
      this.subscribers.get(target)?.add(context);
      this.logger.info("Added subscriber", { target, ids });
    }

    return allowed;
  }

  /**
   * Remove a subscriber
   */
  unsubscribe(target: string, context: WebSocketRouteContext): void {
    const subs = this.subscribers.get(target);
    if (subs) {
      subs.delete(context);
      if (subs.size === 0) {
        this.subscribers.delete(target);
      }
      this.logger.info("Removed subscriber", { target });
    }
  }

  /**
   * Broadcast a message to all subscribers of a path
   */
  broadcast<TResource extends BaseResource>(
    resource: TResource,
    message: Message<TResource>
  ): void {
    const path = stringifyResourcePath(resource, message.ref);
    const patch: ResourcePatch = {
        patch: 
    }

    const subs = this.subscribers.get(path);
    if (subs) {
      for (const context of subs) {
        context.send(message);
      }
    }
  }

  /**
   * Resolves a target path to a registered route and extracts Ids
   */
  resolveTarget<TResource extends BaseResource>(
    target: string
  ): {
    route: WebSocketResourceRoute<TResource>;
    ids: ResourceIds<TResource>;
  } {
    const match = matchPath([...this.routes.keys()], target) || {
      path: "",
      params: {},
    };
    const route = this.routes.get(match.path);
    if (!route) {
      throw new Error(`No matching route found for target: ${target}`);
    }
    return {
      route,
      ids: match.params as ResourceIds<typeof route.resource>,
    };
  }
}
