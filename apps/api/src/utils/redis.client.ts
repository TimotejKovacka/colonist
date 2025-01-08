import { Redis } from "ioredis";
import { ServiceNode, type ServiceParent } from "@colonist/backend-utils";
import { assert } from "@colonist/utils";

type RedisConfig = {
  host: string;
  port: number;
};

export class RedisService extends ServiceNode {
  readonly redis: Redis;
  constructor(parent: ServiceParent, config: RedisConfig) {
    super(parent, RedisService.name);

    this.redis = new Redis({
      ...config,
      lazyConnect: true,
    });
    this.redis.once("ready", () => this.logger.info("Redis ready"));
    this.redis.once("connect", () => this.logger.info("Redis connected"));
    this.redis.once("close", () => this.logger.info("Redis closed"));
    this.redis.once("error", (err) =>
      this.logger.error("Redis failed", {}, err)
    );
  }

  protected async nodeStart() {
    await this.redis.connect();
  }

  protected async nodeStop() {
    if (this.redis.status === "connect" || this.redis.status === "connecting") {
      await new Promise((resolve) => {
        this.redis.on("ready", resolve);
      });
    }

    const closedPromise = new Promise((resolve) => {
      this.redis.on("close", resolve);
    });

    this.redis.disconnect();

    await closedPromise;
  }

  protected nodeAssertAlive(): void {
    assert(this.redis.status === "ready");
  }
}
