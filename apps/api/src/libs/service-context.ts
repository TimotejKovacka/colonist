import type { Redis } from "ioredis";
import type { EntityManager } from "typeorm";

export type ServiceContext = {
  redis: Redis;
  entityManager: EntityManager;
};
