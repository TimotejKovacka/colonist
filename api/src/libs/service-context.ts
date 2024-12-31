import type { Redis } from "ioredis";

export type ServiceContext = {
  redis: Redis;
};
