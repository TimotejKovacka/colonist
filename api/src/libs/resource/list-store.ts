import type {
  BaseListResource,
  BaseResource,
  ItemOfList,
  ResourceDto,
  ResourceIds,
} from "../types/index.js";

import type { Redis } from "ioredis";
import { ServiceContainer, type ServiceParent } from "../service.js";
import { RedisSortedSet } from "../data-structures/redis.sorted-set.js";
import { ListReader, listRedisTag } from "./list-reader.js";
import { redisKey } from "./redis.js";
import type { ServiceContext } from "../service-context.js";
import { StateStore } from "./state-store.js";

/**
 * List store maintains and queries sorted array of items.
 */
export class ListStore<
  TResource extends BaseListResource
> extends ListReader<TResource> {
  readonly service: ServiceContainer;
  readonly redis: Redis;
  readonly resource: TResource;
  readonly listType: string;
  readonly redisSortedSet: RedisSortedSet;
  readonly stateStore: StateStore<BaseResource>;

  constructor(
    parent: ServiceParent,
    context: ServiceContext,
    resource: TResource
  ) {
    super(context, resource);
    this.service = new ServiceContainer(parent, ListStore.name);
    this.redis = context.redis;
    this.resource = resource;
    this.listType = resource.type;
    this.redisSortedSet = new RedisSortedSet(context.redis, 30);
    this.stateStore = new StateStore(this.service, context, resource);
  }

  async upsert(
    ids: ResourceIds<TResource>,
    items: {
      score: number;
      value: ItemOfList<ResourceDto<TResource>>;
    }[],
    actionsAtMs?: ActionsAtMs
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }
    const key = redisKey(listRedisTag, this.resource, ids);
    if (
      await this.redisSortedSet.upsert(
        key,
        ...items.flatMap(({ score, value }) => ({
          score,
          member: JSON.stringify(value),
        }))
      )
    ) {
      await this.stateStore.touch(ids, actionsAtMs);
    }
  }

  async delete(
    ids: ResourceIds<TResource>,
    values: ItemOfList<ResourceDto<TResource>>[],
    actionsAtMs?: ActionsAtMs
  ): Promise<void> {
    if (values.length === 0) {
      return;
    }
    const key = redisKey(listRedisTag, this.resource, ids);
    if (
      await this.redisSortedSet.delete(
        key,
        ...values.map((value) => JSON.stringify(value))
      )
    ) {
      await this.stateStore.touch(ids, actionsAtMs);
    }
  }
}
