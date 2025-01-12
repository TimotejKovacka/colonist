import {
  type BaseResource,
  minifyValue,
  patchResource,
  idsModifiedAtOfResourcce,
  putResource,
  type ResourceBody,
  type ResourceDto,
  type ResourceIds,
  type ResourceIdsModifiedAt,
  touchResource,
  idsRef,
  pickIds,
} from "@pilgrim/api-contracts";
import * as uuid from "uuid";

import type { Redis } from "ioredis";
import { validate } from "../validate.js";
import { redisKey, redisStreamKey } from "./redis.js";
import type { ServiceContext } from "./service-context.js";
import { StateReader, stateRedisTag } from "./state-reader.js";
import { ServiceContainer, type ServiceParent } from "../service.js";
import { RedisStreamProducer } from "../redis/redis.stream-producer.js";
import type { Message } from "./state-consumer.js";
import { JsonDecoder } from "@pilgrim/utils";
import type { Publisher } from "./publisher.js";

const nullValue = "null";
const stateTtl = 24 * 3600_000;

/**
 * State store stores resource states.
 *
 * Provides api to fetch and mutate the resource from the persistent storage.
 * Mutating operation publish resource change notifications.
 *
 * Implementation details:
 * store - json stored
 * notifications - redis stream shared for resource type
 */
export class StateStore<
  TResource extends BaseResource
> extends StateReader<TResource> {
  readonly service: ServiceContainer;
  override readonly redis: Redis;
  override readonly resource: TResource;
  readonly type: string;
  readonly publisher: Publisher;
  readonly producer: RedisStreamProducer<Message<TResource>>;
  readonly decoder = new JsonDecoder<ResourceDto<TResource>>();

  constructor(
    parent: ServiceParent,
    context: ServiceContext,
    resource: TResource
  ) {
    super(context, resource);
    this.service = new ServiceContainer(parent, StateStore.name);
    this.redis = context.redis;
    this.resource = resource;
    this.type = resource.type;
    this.publisher = context.publisher;
    this.producer = new RedisStreamProducer({
      redis: this.redis,
      streamKey: redisStreamKey(this.type),
    });
  }

  private async set(
    ids: ResourceIds<TResource>,
    dto: ResourceDto<TResource>,
    oldDto: ResourceDto<TResource> | undefined
  ): Promise<void> {
    minifyValue(this.resource.schema, dto);
    const value = JSON.stringify(dto);
    const key = redisKey(stateRedisTag, this.resource, ids);
    const oldValue = JSON.stringify(oldDto) ?? nullValue;
    if (oldValue === value) {
      return;
    }
    const message: Message<TResource> = {
      ref: idsRef(this.resource, dto),
      dto,
      oldDto,
    };
    await Promise.all([
      this.redis.set(key, value, "PX", stateTtl),
      this.producer.publish(message),
      this.publisher.publish(this.resource, message),
    ]);
  }

  async delete(ids: ResourceIds<TResource>): Promise<void> {
    const key = redisKey(stateRedisTag, this.resource, ids);
    const oldValue = (await this.redis.get(key)) ?? nullValue;
    if (oldValue === nullValue) {
      return;
    }
    const message: Message<TResource> = {
      ref: {
        type: this.type,
        ...pickIds(this.resource, ids),
      },
      dto: undefined,
      oldDto: this.decoder.decode(oldValue),
    };

    await Promise.all([
      this.redis.del(key),
      this.producer.publish(message),
      this.publisher.publish(this.resource, message),
    ]);
  }

  async post(
    hashIds: ResourceIds<TResource>,
    body: ResourceBody<TResource>,
    idGenerator?: () => Promise<string>
  ): Promise<ResourceDto<TResource>> {
    const postIdKey = this.resource.createIdKey;
    validate(
      postIdKey !== undefined,
      `Resource type ${this.resource.type} cannot create new ids`
    );
    const id = idGenerator ? await idGenerator() : uuid.v4();
    const now = Date.now();
    const ids = { ...hashIds, [postIdKey]: id } as ResourceIds<TResource>;
    const resource = {
      type: this.type,
      ...ids,
      createdAtMs: now,
      modifiedAtMs: now,
      ...body,
    };
    minifyValue(this.resource.schema, resource);
    const oldDto = undefined; // We generated new random uuid, oldDto does not exist
    await this.set(ids, resource, oldDto);
    return resource;
  }

  async put(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>
  ): Promise<ResourceDto<TResource>> {
    const oldMaybeResource = await this.tryGet(ids);
    const resource = putResource(this.resource, ids, oldMaybeResource, body);
    if (resource !== oldMaybeResource) {
      await this.set(ids, resource, oldMaybeResource);
    }
    return resource;
  }

  async patchExisting(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>
  ): Promise<ResourceIdsModifiedAt<TResource>> {
    // TODO(someday): atomic patch
    return await this.patch(ids, body, await this.get(ids));
  }

  async patchOrCreate(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>
  ): Promise<ResourceIdsModifiedAt<TResource>> {
    return await this.patch(ids, body, await this.tryGet(ids));
  }

  async patchIfExists(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>
  ): Promise<void> {
    const oldDto = await this.tryGet(ids);
    if (oldDto) {
      await this.patch(ids, body, oldDto);
    }
  }

  async patch(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>,
    oldDto: ResourceDto<TResource> | undefined
  ): Promise<ResourceIdsModifiedAt<TResource>> {
    const resource = patchResource(this.resource, ids, oldDto, body);
    if (resource !== oldDto) {
      await this.set(ids, resource, oldDto);
    }
    return idsModifiedAtOfResourcce(this.resource, resource);
  }

  async touch(ids: ResourceIds<TResource>): Promise<void> {
    const oldMaybeResource = await this.tryGet(ids);
    const resource = touchResource(this.resource, ids, oldMaybeResource);
    await this.set(ids, resource, oldMaybeResource);
  }
}
