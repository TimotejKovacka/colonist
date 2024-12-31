import * as otel from "@opentelemetry/api";
import {
  type BaseResource,
  idsRef,
  minifyValue,
  patchResource,
  pickDtoIdsModifiedAt,
  pickIds,
  putResource,
  type ResourceBody,
  type ResourceDto,
  type ResourceIds,
  type ResourceIdsModifiedAt,
  stringifyResourcePath,
  touchResource,
} from "@slido/api-contracts";
import { NotFound } from "http-errors";
import * as uuid from "uuid";

import {
  type ActionsAtMs,
  type Redis,
  ServiceContainer,
  type ServiceParent,
  transactionContext,
} from "../../";
import { histogramAdvice } from "../histogram";
import { ProducerWorker } from "../kafka/producer-worker";
import { validate } from "../validate";
import { NchanPublisher } from "./nchan-publisher";
import { redisKey } from "./resource-redis";
import type { ServiceContext } from "./service-context";
import type { Message } from "./state-consumer";
import { StateReader, stateRedisTag } from "./state-reader";

const nullValue = "null";
const stateTtl = 24 * 3600_000;

const meter = otel.metrics.getMeter("StateStore");
const actionLagHistogram = meter.createHistogram("store.action.lag", {
  description: "Lag between StateStore and API resource actions",
  unit: "ms",
  advice: histogramAdvice,
});
const processLagHistogram = meter.createHistogram("store.process.lag", {
  description: "Lag between StateStore and stream resource processing",
  unit: "ms",
  advice: histogramAdvice,
});

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
  readonly redis: Redis;
  readonly resource: TResource;
  readonly type: string;
  readonly publisher: NchanPublisher;
  readonly kafkaProducer: ProducerWorker<Message<TResource>>;

  constructor(
    parent: ServiceParent,
    context: ServiceContext,
    resource: TResource
  ) {
    super(context, resource);
    this.service = new ServiceContainer(parent, StateStore.name);
    this.redis = context.redis;
    this.publisher = new NchanPublisher(this.service);
    this.resource = resource;
    this.type = resource.type;
    this.kafkaProducer = new ProducerWorker(this.service, {
      kafka: context.kafka,
      topic: this.type,
    });
  }

  async get(ids: ResourceIds<TResource>): Promise<ResourceDto<TResource>> {
    const resource = await this.tryGet(ids);
    validate(resource !== undefined, "Resource not found.", NotFound);
    return resource;
  }

  private async set(
    ids: ResourceIds<TResource>,
    dto: ResourceDto<TResource>,
    oldDto: ResourceDto<TResource> | undefined,
    actionsAtMs: ActionsAtMs
  ): Promise<void> {
    minifyValue(this.resource.schema, dto);
    const value = JSON.stringify(dto);
    const key = redisKey(stateRedisTag, this.resource, ids);
    const oldValue = JSON.stringify(oldDto) ?? nullValue;
    if (oldValue === value) {
      return;
    }

    const mergedActionsAtMs: ActionsAtMs = {
      ...transactionContext.get("actionsAtMs"),
      ...actionsAtMs,
    };
    this.recordStateLagMetrics(mergedActionsAtMs);

    const message: Message<TResource> = {
      ref: idsRef(this.resource, dto),
      dto,
      oldDto,
      storedAtMs: Date.now(),
      actionsAtMs: {
        ...mergedActionsAtMs,
      },
    };
    await Promise.all([
      this.redis.set(key, value, "PX", stateTtl),
      this.kafkaProducer.produce([
        // TODO(soon): make API user/resource friendly
        {
          key: stringifyResourcePath(this.resource, ids),
          value: message,
        },
      ]),
      this.publisher.publish(this.resource, message),
    ]);
    //TODO(someday): avoid dual writes
  }

  async delete(
    ids: ResourceIds<TResource>,
    actionsAtMs: ActionsAtMs = {}
  ): Promise<void> {
    const key = redisKey(stateRedisTag, this.resource, ids);
    const oldValue = (await this.redis.get(key)) ?? nullValue;
    if (oldValue === nullValue) {
      return;
    }

    const mergedActionsAtMs: ActionsAtMs = {
      ...transactionContext.get("actionsAtMs"),
      ...actionsAtMs,
    };
    this.recordStateLagMetrics(mergedActionsAtMs);

    const message: Message<TResource> = {
      ref: {
        type: this.resource.type,
        ...pickIds(this.resource, ids),
      },
      dto: undefined,
      oldDto: JSON.parse(oldValue) as ResourceDto<TResource>,
      storedAtMs: Date.now(),
      actionsAtMs: {
        ...mergedActionsAtMs,
      },
    };
    await Promise.all([
      this.redis.del(key),
      this.kafkaProducer.produce([
        // TODO(soon): make API user/resource friendly
        {
          key: stringifyResourcePath(this.resource, ids),
          value: message,
        },
      ]),
      this.publisher.publish(this.resource, message),
    ]);
    //TODO(someday): avoid dual writes
  }

  async post(
    hashIds: ResourceIds<TResource>,
    body: ResourceBody<TResource>,
    actionsAtMs: ActionsAtMs = {}
  ): Promise<ResourceDto<TResource>> {
    const postIdKey = this.resource.createIdKey;
    validate(
      postIdKey !== undefined,
      `Resource type ${this.resource.type} cannot create new ids`
    );
    const id = uuid.v4();
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
    await this.set(ids, resource, oldDto, actionsAtMs);
    return resource;
  }

  async put(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>,
    actionsAtMs: ActionsAtMs = {}
  ): Promise<ResourceDto<TResource>> {
    const oldMaybeResource = await this.tryGet(ids);
    const resource = putResource(this.resource, ids, oldMaybeResource, body);
    if (resource !== oldMaybeResource) {
      await this.set(ids, resource, oldMaybeResource, actionsAtMs);
    }
    return resource;
  }

  async patchExisting(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>,
    actionsAtMs?: ActionsAtMs
  ): Promise<ResourceIdsModifiedAt<TResource>> {
    // TODO(someday): atomic patch
    return await this.patch(ids, body, await this.get(ids), actionsAtMs);
  }

  async patchOrCreate(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>,
    actionsAtMs?: ActionsAtMs
  ): Promise<ResourceIdsModifiedAt<TResource>> {
    return await this.patch(ids, body, await this.tryGet(ids), actionsAtMs);
  }

  async patchIfExists(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>,
    actionsAtMs?: ActionsAtMs
  ): Promise<void> {
    const oldDto = await this.tryGet(ids);
    if (oldDto) {
      await this.patch(ids, body, oldDto, actionsAtMs);
    }
  }

  async patch(
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>,
    oldDto: ResourceDto<TResource> | undefined,
    actionsAtMs: ActionsAtMs = {}
  ): Promise<ResourceIdsModifiedAt<TResource>> {
    const resource = patchResource(this.resource, ids, oldDto, body);
    if (resource !== oldDto) {
      await this.set(ids, resource, oldDto, actionsAtMs);
    }
    return pickDtoIdsModifiedAt(this.resource, resource);
  }

  async touch(
    ids: ResourceIds<TResource>,
    actionsAtMs: ActionsAtMs = {}
  ): Promise<void> {
    const oldMaybeResource = await this.tryGet(ids);
    const resource = touchResource(this.resource, ids, oldMaybeResource);
    await this.set(ids, resource, oldMaybeResource, actionsAtMs);
  }

  private recordStateLagMetrics(actionsAtMs: Record<string, number>): void {
    const now = Date.now();

    for (const [key, timestamp] of Object.entries(actionsAtMs)) {
      actionLagHistogram.record(now - timestamp, {
        store: this.resource.type,
        actor: key,
      });
    }
    for (const [key, timestamp] of Object.entries(
      transactionContext.get("startedAtMs") ?? {}
    )) {
      processLagHistogram.record(now - timestamp, {
        store: this.resource.type,
        actor: key,
      });
    }
  }
}
