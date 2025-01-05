import { assert, type Logger } from "@colonist/utils";
import { createLogger } from "./logger";
import { Promised } from "./promised";
import type { NoOverride } from "./no-override";

export interface Service {
  readonly serviceName: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  assertAlive(): void;
}

export class ServiceNotAlive extends Error {
  constructor({
    message,
    cause,
  }: {
    message: string;
    readonly cause: unknown;
  }) {
    super(message, { cause });
  }
}

export interface ServiceParent {
  logger: Logger;
  servicePath: string[];
  addChild: (service: Service) => void;
}

type ServiceState = "initial" | "starting" | "running" | "stopping";

export type ServiceExecutionMode = "sequential" | "parallel";

export abstract class ServiceNode implements Service, ServiceParent {
  readonly serviceName: string;
  readonly servicePath: string[];

  readonly logger: Logger;
  readonly #children: Service[] = [];
  readonly #nodeService: Service;
  readonly #executionMode: ServiceExecutionMode;
  #state: ServiceState = "initial";
  #stopped?: Promised<void> = undefined;

  constructor(
    parent: ServiceParent,
    serviceName: string,
    serviceMeta: Record<string, unknown> = {},
    executionMode: ServiceExecutionMode = "sequential"
  ) {
    this.serviceName = serviceName;
    this.servicePath = [...parent.servicePath, serviceName];
    this.#executionMode = executionMode;
    this.#nodeService = {
      serviceName,
      start: async () => this.nodeStart(),
      stop: async () => this.nodeStop(),
      assertAlive: () => this.nodeAssertAlive(),
    };
    this.logger = parent.logger.child(serviceName, serviceMeta);
    parent.addChild(this);
  }

  async start(): Promise<void> {
    assert(
      this.#state === "initial",
      `Cannot (re)start service. state:${this.#state}`
    );
    this.#state = "starting";

    const childrenToStart = [...this.#children, this.#nodeService];
    if (this.#executionMode === "sequential") {
      for (const child of childrenToStart) {
        this.logger.debug(`Starting child ${child.serviceName}`);
        await child.start();
      }
    } else {
      await Promise.all(
        childrenToStart.map((child) => {
          this.logger.debug(`Starting child ${child.serviceName}`);
          return child.start();
        })
      );
    }
    this.#state = "running";
  }

  async stop(): Promise<void> {
    if (this.#stopped) {
      await this.#stopped;
    } else {
      this.#stopped = new Promised<void>();
      this.#state = "stopping";

      const childrenToStop = [...this.#children, this.#nodeService].reverse();
      if (this.#executionMode === "sequential") {
        for (const child of childrenToStop) {
          try {
            this.logger.debug(`Stopping child ${child.serviceName}`);
            await child.stop();
          } catch (err) {
            this.logger.error(`Stop ${child.serviceName} failed`, {}, err);
          }
        }
      } else {
        await Promise.all(
          childrenToStop.map((child) => {
            this.logger.debug(`Stopping child ${child.serviceName}`);
            return child.stop().catch((err) => {
              this.logger.error(`Stop ${child.serviceName} failed`, {}, err);
            });
          })
        );
      }
    }
    this.#stopped.resolve();
  }

  assertAlive(): NoOverride {
    assert(
      this.#state === "running",
      "Cannot assert liveness of service that is not running"
    );

    for (const child of [...this.#children, this.#nodeService]) {
      const childPath = () => [...this.servicePath, child.serviceName];
      try {
        const childResult = child.assertAlive();
        assert(
          childResult === undefined,
          `assertAlive must return undefined on success. path:${childPath()}`
        );
      } catch (err) {
        if (err instanceof ServiceNotAlive) {
          throw err;
        }

        const message = `Service ${childPath()} not alive`;
        this.logger.warn(message, {}, err);
        throw new ServiceNotAlive({ message, cause: err });
      }
    }
  }

  get isRunning(): boolean {
    return this.#state === "running";
  }

  get isStopping(): boolean {
    return this.#state === "stopping";
  }

  protected abstract nodeStart(): Promise<void>;
  protected abstract nodeStop(): Promise<void>;
  protected abstract nodeAssertAlive(): void;

  addChild(service: Service): void {
    this.#children.push(service);
  }
}

export class ServiceContainer extends ServiceNode {
  protected override async nodeStart(): Promise<NoOverride> {}
  protected override async nodeStop(): Promise<NoOverride> {}
  protected override nodeAssertAlive(): NoOverride {}
}

export class RootService implements ServiceParent {
  readonly logger: Logger;
  readonly servicePath: string[] = ["root"];
  readonly container: ServiceContainer;

  constructor(executionMode?: ServiceExecutionMode) {
    this.logger = createLogger("root");
    this.container = new ServiceContainer(
      {
        logger: this.logger,
        servicePath: this.servicePath,
        addChild: () => {
          //
        },
      },
      "",
      {},
      executionMode
    );
  }

  async start() {
    const startedAt = Date.now();
    await this.container.start();

    this.assertAlive();
    this.logger.info("Up and running", { elapsedMs: Date.now() - startedAt });
  }

  async stop() {
    const startedAt = Date.now();
    await this.container.stop();
    this.logger.info("Gracefully stopped", {
      elapsedMs: Date.now() - startedAt,
    });
  }

  assertAlive() {
    this.container.assertAlive();
  }

  addChild(service: Service) {
    this.container.addChild(service);
  }
}
