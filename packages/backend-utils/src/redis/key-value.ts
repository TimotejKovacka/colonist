import type { Redis } from "ioredis";
import { REDIS_DATA_EXPIRATION_S } from "./constants.js";

export class RedisKeyValue<T> {
  constructor(
    private redis: Redis,
    private validatorFn?: (value: T) => boolean
  ) {}

  async set(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);

    await this.redis
      .pipeline()
      .set(key, serialized)
      .expire(key, REDIS_DATA_EXPIRATION_S, "NX")
      .exec();
  }

  async get(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    const parsed = value ? (JSON.parse(value) as T) : null;

    if (parsed != null && this.validatorFn) {
      if (!this.validatorFn(parsed)) {
        throw new Error(`Invalid value: ${value}`);
      }
    }

    return parsed;
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
