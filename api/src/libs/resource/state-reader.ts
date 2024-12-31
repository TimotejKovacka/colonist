import {
  areResourceIdsEqual,
  type BaseResource,
  requiredResourceCreateIdKey,
  type ResourceDto,
  type ResourceId,
  type ResourceIds,
} from "../types/index.js";
import { Forbidden } from "http-errors";

import { Redis } from "ioredis";
import { validate } from "../validate.js";
import { redisKey, type RedisTag } from "./redis.js";
import type { ServiceContext } from "../service-context.js";

export const stateRedisTag = "state" as RedisTag;

/**
 * Reading interface to the state store.
 *
 * TODO(perf): local cache, what about cache invalidation?
 */
export class StateReader<TResource extends BaseResource> {
  readonly redis: Redis;
  readonly resource: TResource;
  constructor(context: ServiceContext, resource: TResource) {
    this.redis = context.redis;
    this.resource = resource;
  }
  async tryGetRaw(key: string): Promise<ResourceDto<TResource> | undefined> {
    try {
      const jsonResource = await this.redis.get(key);
      if (!jsonResource) {
        return undefined;
      }
      // TODO(someday): validate / sanitize data read from db. Shall we?
      return JSON.parse(jsonResource) as ResourceDto<TResource>;
    } catch (e) {
      console.error("Failed to get state from storage", key, e);
      return undefined;
    }
  }

  async tryGet(
    ids: ResourceIds<TResource>
  ): Promise<ResourceDto<TResource> | undefined> {
    const key = redisKey(stateRedisTag, this.resource, ids);
    const resource = await this.tryGetRaw(key);
    if (resource) {
      // authorization against all ids, not only against those in state key
      validate(
        areResourceIdsEqual(this.resource, ids, resource),
        `Unauthorized access of ${this.resource.type}`,
        Forbidden
      );
    }
    return resource;
  }

  async unauthorizedTryGet(
    id: ResourceId | undefined
  ): Promise<ResourceDto<TResource> | undefined> {
    if (!id) {
      return undefined;
    }
    const createIdKey = requiredResourceCreateIdKey(this.resource);
    const ids = { [createIdKey]: id };
    const key = redisKey(stateRedisTag, this.resource, ids);
    return await this.tryGetRaw(key);
  }
}
