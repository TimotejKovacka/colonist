import type { Redis } from "ioredis";
// import { REDIS_DATA_EXPIRATION_S } from '../constants';

export class RedisCounter {
  constructor(private redis: Redis) {}

  async increment(key: string): Promise<number> {
    const result = await this.redis
      .pipeline()
      .incr(key)
      .expire(key, REDIS_DATA_EXPIRATION_S, "NX")
      .exec();
    return result![0][1] as number;
  }

  async decrement(key: string): Promise<number> {
    return await this.redis.decr(key);
  }

  async count(key: string): Promise<number> {
    const result = await this.redis.get(key);
    if (result === null) {
      return 0;
    }
    return parseInt(result, 10);
  }

  async countMany(keys: string[]): Promise<number[]> {
    const pipeline = this.redis.pipeline();
    keys.forEach((k) => pipeline.get(k));
    const pipelineResult = await pipeline.exec();

    return pipelineResult!.map((result) => {
      if (result[0]) {
        throw result[0];
      }
      return result[1] == null ? 0 : parseInt(result[1] as string, 10);
    });
  }

  async deleteCounter(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
