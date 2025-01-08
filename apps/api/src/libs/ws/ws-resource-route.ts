import {
  stringifyResourcePath,
  type BaseResource,
  type ResourceDto,
  type ResourceId,
  type ResourceIds,
} from "@colonist/api-contracts";
import type { FastifyRequest } from "fastify";
import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import type { WebSocket } from "ws";

export type RouteParams = Record<string, string>;

export type WebSocketMessageType =
  | "ping"
  | "pong"
  | "subscribe"
  | "unsubscribe";

/**
 * Core WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
}

export interface ResourceMessage<TResource extends BaseResource> {
  target: string;
  data: ResourceDto<TResource>;
}

export type WebSocketResourceRoute<TResource extends BaseResource> = {
  resource: TResource;

  /**
   * Handler called when a client subscribes to this route
   * Returns true if subscription is allowed, false otherwise
   */
  onSubscribe: (ids: ResourceIds<TResource>) => Promise<boolean>;

  /**
   * Optional handler for incoming messages on this route
   */
  onMessage?: (
    ids: ResourceIds<TResource>,
    message: WebSocketMessage<ResourceDto<TResource>>,
    context: WebSocketRouteContext
  ) => Promise<void>;

  /**
   * Optional handler called when a client unsubscribes
   */
  onUnsubscribe?: (
    ids: ResourceIds<TResource>,
    context: WebSocketRouteContext
  ) => Promise<void>;
};

export type WebSocketRouteContext = {
  request: FastifyRequest;
  socket: WebSocket;
  send: (message: WebSocketMessage) => void;
};

export function registerWebSocketRoute<TResource extends BaseResource>({
  fastify,
  router,
  service,
}: {
  fastify: FastifyTypeboxInstance;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  router: any; // Here we are going to attach our route
  service: WebSocketResourceRoute<TResource>;
}) {
  const resource = service.resource;
  const auth = fastify.authResource(resource);
  const ids = Object.fromEntries(
    resource.idsOrder.map((idKey) => [
      idKey,
      `:${idKey as string}` as ResourceId,
    ])
  );
  const instancePath = stringifyResourcePath(resource, ids);

  const handleSubscribe = async (
    ids: ResourceIds<TResource>,
    context: WebSocketRouteContext
  ) => {
    await auth(context.request);
    // Maybe allowed is not what we want here as auth makes sure we can make the subscription
    // Perhaps it would be better to return data as http route would
    const allowed = await service.onSubscribe(ids);
    if (allowed) {
      // subscriptionStore.addSubscription(path, context);
      router.register(service); // Maybe not router but a subscription store
    }
    return allowed;
  };

  const handleMessage = async (
    ids: ResourceIds<TResource>,
    message: WebSocketMessage<TResource>,
    context: WebSocketRouteContext
  ) => service.onMessage?.(ids, message, context);

  const handleUnsubscribe = async (
    ids: ResourceIds<TResource>,
    context: WebSocketRouteContext
  ) => {
    await service.onUnsubscribe?.(ids, context);
    // subscriptionStore.removeSubscription(path, context);
  };
}
