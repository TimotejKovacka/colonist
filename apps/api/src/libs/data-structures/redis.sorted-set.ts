import type { Redis } from "ioredis";
import { REDIS_DATA_EXPIRATION_S } from "../constants.js";

/**
 * A wrapper around Redis sorted set operations.
 */
export class RedisSortedSet {
  constructor(public redis: Redis, private defaultLimit: number) {}

  /**
   * @returns true if the sorted set was mutated.
   */
  async upsert(
    key: string,
    ...items: { score: number; member: string }[]
  ): Promise<boolean> {
    const result = await this.redis
      .pipeline()
      .zadd(key, "CH", ...items.flatMap(({ score, member }) => [score, member]))
      .expire(key, REDIS_DATA_EXPIRATION_S, "NX")
      .exec();

    if (!result?.[0]) {
      throw new Error("Redis pipeline failed");
    }

    return (result[0][1] as number) > 0;
  }

  /**
   * @returns true if the sorted set was mutated.
   */
  async delete(key: string, ...members: string[]): Promise<boolean> {
    return (await this.redis.zrem(key, ...members)) > 0;
  }

  async contains(key: string, memberId: string): Promise<boolean> {
    return (await this.redis.zrank(key, memberId)) != null;
  }

  async count(key: string): Promise<number> {
    return await this.redis.zcard(key);
  }

  async increaseScoreBy(
    key: string,
    memberId: string,
    increment = 1
  ): Promise<string> {
    return await this.redis.zincrby(key, increment, memberId);
  }

  async list(key: string, start: number, end?: number): Promise<string[]> {
    const actualEnd = end == null ? start + this.defaultLimit - 1 : end;
    return await this.redis.zrange(key, start, actualEnd, "REV");
  }

  async listAll(key: string): Promise<string[]> {
    return await this.redis.zrange(key, 0, -1, "REV");
  }
}
