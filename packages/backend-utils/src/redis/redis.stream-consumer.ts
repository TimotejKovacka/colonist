import type { Redis } from "ioredis";
import { ServiceNode, type ServiceParent } from "../service.js";
import { sleep, JsonDecoder } from "@colonist/utils";

export type StreamProcessorResult<Message> = {
  errors?: unknown[];
  deadLetters?: Message[];
};

export type StreamProcessor<Message> = (
  messages: Message[]
) => Promise<StreamProcessorResult<Message>>;

// export const createItemBatchProcessor =
//   <Message>(
//     processItem: (message: Message) => Promise<void>
//   ): StreamProcessor<Message> =>
//   async (messages: Message[]) => {
//     const errors: unknown[] = [];
//     const deadLetters: Message[] = [];
//     await Promise.all(
//       messages.map(async (message) => {
//         try {
//           await processItem(message);
//         } catch (err) {
//           deadLetters.push(message);
//           errors.push(err);
//         }
//       })
//     );

//     return { errors, deadLetters } satisfies StreamProcessorResult<Message>;
//   };

export class RedisStreamConsumer<Message> extends ServiceNode {
  readonly redis: Redis;
  readonly groupId: string;
  readonly streamKey: string;
  readonly processor: StreamProcessor<Message>;
  readonly batchForMs: number;
  readonly maxBatchSize: number;
  private runFinished: Promise<void> | undefined;
  private decoder = new JsonDecoder<Message>();
  lastStreamId = "0-0";

  constructor(
    parent: ServiceParent,
    {
      redis,
      streamKey,
      consumerId,
      processor,
      batchForMs = 700,
      maxBatchSize = 128,
    }: {
      redis: Redis;
      streamKey: string;
      consumerId: string;
      processor: StreamProcessor<Message>;
      batchForMs?: number;
      maxBatchSize?: number;
    }
  ) {
    const groupId = `${consumerId}/${streamKey}`;
    super(parent, `${RedisStreamConsumer.name}/${streamKey}`, { groupId });
    this.redis = redis.duplicate(); // blocking operations are used thus a new connection so we don't block others
    this.groupId = groupId;
    this.streamKey = streamKey;
    this.processor = processor;
    this.batchForMs = batchForMs;
    this.maxBatchSize = maxBatchSize;
  }

  protected override async nodeStart(): Promise<void> {
    await this.redis.connect();
    this.runFinished = this.run();
  }

  protected override async nodeStop(): Promise<void> {
    await this.runFinished;
    this.redis.disconnect();
  }

  protected override nodeAssertAlive(): void {}

  async run() {
    this.lastStreamId = await this.redisLastStreamKey(this.streamKey);
    while (!this.isStopping) {
      const startTime = performance.now();
      await this.runOnce();
      const duration = performance.now() - startTime;

      this.logger.debug(`Run took ${duration}ms`);
    }
  }

  async runOnce() {
    const reply = await this.redis.xread(
      "COUNT",
      this.maxBatchSize,
      "BLOCK", // block stops immediately after the first message being available
      1000, // affects graceful shutdown
      "STREAMS",
      this.streamKey,
      this.lastStreamId
    );
    let sleepForMs = this.batchForMs;
    if (
      reply &&
      reply.length > 0 &&
      reply[0] &&
      reply[0][0] === this.streamKey
    ) {
      const items = reply[0][1];
      const itemsLength = items.length;
      try {
        const messages: Message[] = items.map(
          ([_, fields]): Message => this.decoder.decode(fields[1])
        );
        let deadLetters: Message[] = messages;
        try {
          const result = await this.processor(messages);
          if (result.deadLetters) {
            deadLetters = result.deadLetters;
          }
          const errors = result.errors ?? [];
          if (errors.length > 0) {
            for (const error of errors.slice(1)) {
              this.logger.error("Swallowed consumer error", {}, error);
            }
            throw errors[0];
          }
        } catch (err) {
          await this.publishDeadLetters(deadLetters);
          throw err;
        }
        if (items.length >= this.maxBatchSize) {
          sleepForMs = 0;
        }
      } catch (err) {
        this.logger.error("Consume failed", {}, err);
      }
      this.lastStreamId = items[itemsLength - 1]?.[0] as string;
    }
    await sleep(sleepForMs);
  }

  async publishDeadLetters(messages: Message[]) {
    try {
      for (const message of messages) {
        this.logger.info("Consumer dead letter message", { message });
      }
    } catch (err) {
      this.logger.error("Failed to publish dead letter", {}, err);
    }
  }

  private async redisLastStreamKey(key: string): Promise<string> {
    const lastRecord = await this.redis.xrevrange(key, "+", "-", "COUNT", 1);
    if (lastRecord.length === 0) {
      return "0-0";
    }
    if (lastRecord[0] === undefined) {
      throw new Error(`cannot read last record ${key}`);
    }
    return lastRecord[0][0];
  }
}
