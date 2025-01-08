import { JsonEncoder } from "@colonist/utils";
import type { Redis } from "ioredis";

export class RedisStreamProducer<Message> {
  readonly redis: Redis;
  readonly streamKey: string;
  readonly ttlMs: number;
  private encoder = new JsonEncoder<Message>();

  constructor({
    redis,
    streamKey,
    ttlMs = 3600_000, // 1 hour
  }: {
    redis: Redis;
    streamKey: string;
    ttlMs?: number;
  }) {
    this.redis = redis;
    this.streamKey = streamKey;
    this.ttlMs = ttlMs;
  }

  async publish(message: Message) {
    await this.redis.xadd(
      this.streamKey,
      // trim messages approx older than
      "MINID",
      "~",
      (Date.now() - this.ttlMs).toString(),
      // auto create stream id
      "*",
      // payload
      "message",
      this.encoder.encode(message)
    );
  }
}
