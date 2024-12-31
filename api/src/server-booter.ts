import { assert } from "./libs/assert.js";
import { ServiceNode, type ServiceParent } from "./libs/service.js";
import { debugTweaks } from "./utils/debug-tweaks.js";
import type { FastifyTypeboxInstance } from "./utils/fastify.js";

export type ServerConfig = {
  host: string;
  port: number;
};

export class ServerBooter extends ServiceNode {
  constructor(
    parent: ServiceParent,
    private readonly server: FastifyTypeboxInstance,
    private readonly config: ServerConfig
  ) {
    super(parent, ServerBooter.name);
  }

  override async nodeStart(): Promise<void> {
    await new Promise((resolve, reject) => {
      this.server.listen(this.config, (err: unknown) => {
        if (err instanceof Error) {
          reject(err);
        } else {
          if (debugTweaks) {
            this.server.log.info(
              `[ docs ] http://${this.config.host}:${this.config.port}/docs`
            );
          }
          resolve(err);
        }
      });
    });
  }

  override async nodeStop(): Promise<void> {
    await this.server.close();
  }

  protected override nodeAssertAlive(): void {
    assert(this.server.server.listening);
  }
}
