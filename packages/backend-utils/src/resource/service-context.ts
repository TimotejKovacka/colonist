import type { Redis } from "ioredis";
import type { Publisher } from "./publisher.js";

export type ServiceContext = {
  redis: Redis;
  publisher: Publisher;
};
