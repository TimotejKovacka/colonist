import type { Redis } from "ioredis";
import { REDIS_DATA_EXPIRATION_S } from "../constants.js";

export class RedisCounter {
  constructor(private redis: Redis) {}

  async increment(key: string): Promise<number> {
    const pipelineResult = await this.redis
      .pipeline()
      .incr(key)
      .expire(key, REDIS_DATA_EXPIRATION_S, "NX")
      .exec();

    if (!pipelineResult || !pipelineResult[0]) {
      throw new Error("Redis pipeline failed");
    }

    if (pipelineResult[0][0]) {
      throw pipelineResult[0][0];
    }

    return pipelineResult[0][1] as number;
  }

  async decrement(key: string): Promise<number> {
    return await this.redis.decr(key);
  }

  async count(key: string): Promise<number> {
    const result = await this.redis.get(key);
    if (result === null) {
      return 0;
    }
    return Number.parseInt(result, 10);
  }

  async countMany(keys: string[]): Promise<number[]> {
    const pipeline = this.redis.pipeline();
    for (const k of keys) {
      pipeline.get(k);
    }
    const pipelineResult = await pipeline.exec();

    if (!pipelineResult) {
      throw new Error("Redis pipeline failed");
    }

    return pipelineResult.map((result) => {
      if (result[0]) {
        throw result[0];
      }
      return result[1] == null ? 0 : Number.parseInt(result[1] as string, 10);
    });
  }

  async deleteCounter(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
