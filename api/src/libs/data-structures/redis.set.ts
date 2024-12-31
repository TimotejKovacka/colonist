import type { Redis } from "ioredis";
// import { REDIS_DATA_EXPIRATION_S } from "../constants";

/**
 * A wrapper around Redis sorted set operations.
 */
export class RedisSet {
  constructor(private redis: Redis) {}

  async add(key: string, member: string): Promise<void> {
    await this.redis
      .pipeline()
      .sadd(key, member)
      .expire(key, REDIS_DATA_EXPIRATION_S, "NX")
      .exec();
  }

  async delete(key: string, member: string): Promise<void> {
    await this.redis.srem(key, member);
  }

  async contains(key: string, member: string): Promise<boolean> {
    return (await this.redis.sismember(key, member)) === 1;
  }

  async count(key: string): Promise<number> {
    return await this.redis.scard(key);
  }

  async countMany(key: string[]): Promise<number[]> {
    const pipeline = this.redis.pipeline();
    key.forEach((k) => pipeline.scard(k));
    const pipelineResult = await pipeline.exec();

    return pipelineResult!.map((result) => {
      if (result[0]) {
        throw result[0];
      }
      return result[1] as number;
    });
  }

  async deleteSet(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async members(key: string): Promise<string[]> {
    return await this.redis.smembers(key);
  }
}
