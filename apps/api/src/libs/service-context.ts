import type { Redis } from "ioredis";
import type { EntityManager } from "typeorm";
import type { ServiceContext as StateServiceContext } from "@pilgrim/backend-utils";

export type ServiceContext = StateServiceContext & {
  redis: Redis;
  entityManager: EntityManager;
};
