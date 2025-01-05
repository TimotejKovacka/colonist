import type { baseResource, ResourceIds } from "../types/resource.types.js";

declare const redisTagSymbol: "redisTag";
export type RedisTag = string & { [redisTagSymbol]: never };

export function redisKey<TResource extends typeof baseResource>(
  tag: RedisTag,
  resource: TResource,
  ids: ResourceIds<TResource>
): string {
  const createIdKey = resource.createIdKey;
  const idKeys = createIdKey ? [createIdKey] : resource.idsOrder;
  const idKey = idKeys
    .map((idKey) => (ids as Record<string, string>)[idKey])
    .join(":");
  return `${tag}:${resource.type}:${idKey}`;
}

/**
 * Redis stream key (topic name in Kafka) for given resource type and current app instances.
 *
 * We don't want different app instances to share the queue,
 * so we incorporate app instance suffix into the key.
 */
export function redisStreamKey(type: string) {
  return `stream:${type}`;
}
