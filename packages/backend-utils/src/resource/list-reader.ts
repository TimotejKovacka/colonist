import {
  type BaseListDto,
  type BaseListResource,
  type BaseResource,
  type ListQuery,
  listQuerySchema,
  type OptionsOfListResource,
  optionsOfListResource,
  pickIds,
  type ResourceDto,
  type ResourceIds,
  setValueDefaults,
} from "@colonist/api-contracts";

import type { Redis } from "ioredis";
import { RedisSortedSet } from "../redis/redis.sorted-set.js";
import { redisKey, type RedisTag } from "./redis.js";
import type { ServiceContext } from "./service-context.js";
import { StateReader } from "./state-reader.js";

export const listRedisTag = "list" as RedisTag;

/**
 * List store maintains and queries sorted array of items.
 */
export class ListReader<TResource extends BaseListResource> {
  readonly redis: Redis;
  readonly resource: TResource;
  readonly options: OptionsOfListResource<TResource>;
  readonly redisSortedSet: RedisSortedSet;
  readonly stateStore: StateReader<BaseResource>;

  constructor(context: ServiceContext, resource: TResource) {
    this.redis = context.redis;
    this.resource = resource;
    this.options = optionsOfListResource(resource);
    this.redisSortedSet = new RedisSortedSet(context.redis, 30);
    this.stateStore = new StateReader(context, resource);
  }

  async tryGet(
    ids: ResourceIds<TResource>,
    queryIn: ListQuery
  ): Promise<ResourceDto<TResource> | undefined> {
    try {
      const query = setValueDefaults(listQuerySchema, queryIn);
      const state = await this.stateStore.tryGet(ids);
      if (!state) {
        return undefined;
      }
      const key = redisKey(listRedisTag, this.resource, ids);
      const offset = query.offset;
      const limit = this.options.pageSize;
      // TODO(someday, perf): use redis pipeline
      const rawItems = await this.redisSortedSet.list(
        key,
        offset,
        offset + limit
      );
      const count = await this.redisSortedSet.count(key);
      // TODO(soon): validate content from persistent storage?
      // TODO(soon): recover from parsing errors of individual items?
      const hasMore = rawItems.length > limit;
      if (hasMore) {
        rawItems.pop();
      }
      const page = rawItems.map((rawItem) => JSON.parse(rawItem) as object);
      return {
        type: this.resource.type,
        ...pickIds(this.resource, ids),
        createdAtMs: state.createdAtMs,
        modifiedAtMs: state.modifiedAtMs,
        page,
        count,
      } satisfies BaseListDto as unknown as ResourceDto<TResource>;
    } catch (e) {
      console.error("Failed to read list from storage", ids, e);
      throw new Error("Failed to read list from storage"); // TODO add { cause: e });
    }
  }

  async count(ids: ResourceIds<TResource>): Promise<number> {
    const key = redisKey(listRedisTag, this.resource, ids);
    return await this.redisSortedSet.count(key);
  }
}
