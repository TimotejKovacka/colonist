import type {
  BaseResource,
  ResourceDto,
  ResourceRef,
} from "@pilgrim/api-contracts";
import {
  RedisStreamConsumer,
  type StreamProcessor,
} from "../redis/redis.stream-consumer.js";
import type { ServiceParent } from "../service.js";
import type { ServiceContext } from "./service-context.js";
import { redisStreamKey } from "./redis.js";

export type Message<TResource extends BaseResource> = {
  ref: ResourceRef<TResource>;
  /** undefined means delete */
  dto?: ResourceDto<TResource>;
  /** undefined means create */
  oldDto?: ResourceDto<TResource>;
};

export type ProcessBatch<TResource extends BaseResource> = (
  messages: Message<TResource>[]
) => Promise<void>;

export class StateConsumer<
  TResource extends BaseResource
> extends RedisStreamConsumer<Message<TResource>> {
  constructor(
    parent: ServiceParent,
    {
      context,
      consumerId,
      resource,
      processor,
      batchForMs = 700,
      maxBatchSize = 128,
    }: {
      context: ServiceContext;
      consumerId: string;
      resource: TResource;
      processor: StreamProcessor<Message<TResource>>;
      batchForMs?: number;
      maxBatchSize?: number;
    }
  ) {
    super(parent, {
      redis: context.redis,
      streamKey: redisStreamKey(resource.type),
      consumerId,
      processor,
      batchForMs,
      maxBatchSize,
    });
  }
}
