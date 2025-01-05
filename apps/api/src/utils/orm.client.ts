import {
  ServiceNode,
  type ServiceParent,
} from "../../../../packages/backend-utils/src/service.js";
import {
  DataSource,
  type EntitySchema,
  type MixedList,
  type EntityManager,
} from "typeorm";
import { assert } from "../../../../packages/utils/src/assert.js";

type TypeORMConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  entities?: MixedList<Function | string | EntitySchema>;
  migrations?: string[];
  maxConnections?: number;
  logging?: boolean;
  runMigrationsOnStart?: boolean;
};

export class ORMService extends ServiceNode {
  readonly dataSource: DataSource;
  private readonly config: TypeORMConfig;

  constructor(parent: ServiceParent, config: TypeORMConfig) {
    super(parent, ORMService.name);
    this.config = config;
    this.dataSource = new DataSource({
      type: "postgres",
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      ssl: config.ssl,
      entities: config.entities ?? ["dist/**/*.entity.js"],
      // migrations: config.migrations ?? ["dist/migrations/*.js"],
      synchronize: false, // Disable in production
      logging: config.logging ?? false,
      poolSize: config.maxConnections ?? 20,
    });
  }

  get entityManager(): EntityManager {
    return this.dataSource.manager;
  }

  async runMigrations(): Promise<void> {
    try {
      this.logger.info("Running database migrations");
      await this.dataSource.runMigrations();
      this.logger.info("Database migrations completed successfully");
    } catch (error) {
      this.logger.error("Failed to run migrations", {}, error);
      throw error;
    }
  }

  async getPendingMigrations() {
    return this.dataSource.showMigrations();
  }

  protected override async nodeStart(): Promise<void> {
    await this.dataSource.initialize();
    this.logger.info("ORM connected to database");

    if (this.config.runMigrationsOnStart) {
      this.logger.warn(
        "Running migrations on service start (not recommended for production)"
      );
      await this.runMigrations();
    }
  }

  protected override async nodeStop(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  protected override nodeAssertAlive(): void {
    assert(this.dataSource.isInitialized, "TypeORM DataSource not initialized");
  }
}
