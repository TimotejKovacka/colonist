import type { Redis } from "ioredis";
import { REDIS_DATA_EXPIRATION_S } from "../constants.js";

export class RedisHash<T> {
  constructor(
    public redis: Redis,
    private validatorFn: (value: unknown) => value is T
  ) {}

  async upsert(key: string, memberId: string, value: T): Promise<void> {
    await this.redis
      .pipeline()
      .hset(key, memberId, JSON.stringify(value))
      .expire(key, REDIS_DATA_EXPIRATION_S, "NX")
      .exec();
  }

  async delete(key: string, memberId: string): Promise<void> {
    await this.redis.hdel(key, memberId);
  }

  async contains(key: string, memberId: string): Promise<boolean> {
    return (await this.redis.hexists(key, memberId)) === 1;
  }

  async count(key: string): Promise<number> {
    return await this.redis.hlen(key);
  }

  async countMany(key: string[]): Promise<number[]> {
    const pipeline = this.redis.pipeline();
    for (const k of key) {
      pipeline.hlen(k);
    }
    const pipelineResult = await pipeline.exec();

    if (!pipelineResult) {
      throw new Error("Redis pipeline failed");
    }

    return pipelineResult.map((result) => {
      if (result[0]) {
        throw result[0];
      }
      return result[1] as number;
    });
  }

  async get(key: string, memberId: string): Promise<T | null> {
    const item = await this.redis.hget(key, memberId);
    if (item === null) {
      return null;
    }
    return this.parse(item);
  }

  async getMany(key: string, memberIds: string[]): Promise<T[]> {
    const items = await this.redis.hmget(key, ...memberIds);
    return items.filter((i) => i != null).map((i) => this.parse(i));
  }

  async listAll(key: string): Promise<T[]> {
    const items = await this.redis.hgetall(key);
    return Object.values(items).map((item) => this.parse(item));
  }

  async deleteAll(key: string): Promise<void> {
    await this.redis.del(key);
  }

  private parse(item: string): T {
    const parsed: unknown = JSON.parse(item);
    if (this.validatorFn(parsed)) {
      return parsed;
    }
    throw new Error(`Invalid item: ${item}`);
  }
}
