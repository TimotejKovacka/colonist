import fastifySensible from "@fastify/sensible";
import fastifyRequestContext from "@fastify/request-context";
import type { EnvConfig } from "./env.js";
import type {
  RootService,
  ServiceParent,
} from "../../../packages/backend-utils/src/service.js";
import type { FastifyTypeboxInstance } from "./utils/fastify.js";
import { RedisService } from "./utils/redis.client.js";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import type { Redis } from "ioredis";
import fastifySwagger from "@fastify/swagger";
import { debugTweaks } from "../../../packages/backend-utils/src/debug-tweaks.js";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { systemRoutes } from "./domains/system/route.js";
import { ORMService } from "./utils/orm.client.js";
import type { EntityManager } from "typeorm";
import { authDomain } from "./domains/auth/route.js";
import { User } from "./domains/auth/user.entity.js";
import { authPlugin } from "./libs/auth/fastify-auth.plugin.js";
import { AuthIssuer } from "./libs/auth/auth-issuer.js";
import { AuthVerifier } from "./libs/auth/auth-verifier.js";
import { SessionService } from "./domains/session/session.service.js";
import type { ServiceContext } from "./libs/service-context.js";
import { UserService } from "./domains/auth/user-service.js";
import type { BaseResource } from "@pilgrim/api-contracts";
import {
  registerResourceRoutes,
  type ResourceRoute,
} from "./libs/resource-route.js";
import { requestContextStorage, type Publisher } from "@pilgrim/backend-utils";
import { SessionSettingsService } from "./domains/session/session-settings.service.js";
import { LobbyService } from "./domains/session/lobby.service.js";
import { WebSocketServer, type IoServer } from "./utils/websocket.server.js";
import type { ResourceHandler } from "./libs/resource-router.js";

export interface ApiServices {
  redis: Redis;
  entityManager: EntityManager;
}

export function initServices(
  parent: ServiceParent,
  envConfig: EnvConfig
): ApiServices {
  const { redis } = new RedisService(parent, {
    host: envConfig.REDIS_HOST,
    port: envConfig.REDIS_PORT,
  });

  const { entityManager } = new ORMService(parent, {
    host: envConfig.POSTGRES_HOST,
    port: envConfig.POSTGRES_PORT,
    username: envConfig.POSTGRES_USERNAME,
    password: envConfig.POSTGRES_PASSWORD,
    database: "test_db",
    entities: [User],
  });

  return {
    redis,
    entityManager,
  };
}

export interface AuthServices {
  authIssuer: AuthIssuer;
  authVerifier: AuthVerifier;
}

export function initAuthServices(
  parent: ServiceParent,
  context: ServiceContext
) {
  const authIssuer = new AuthIssuer(parent, context);

  const authVerifier = new AuthVerifier(parent);

  return {
    authIssuer,
    authVerifier,
  };
}

export async function prepareHttpServer(
  server: FastifyTypeboxInstance,
  authVerifier: AuthVerifier
) {
  await server.register(fastifySensible);
  await server.register(fastifyCors, {
    origin: ["http://localhost"],
    credentials: true,
  });
  await server.register(fastifyCookie);
  await server.register(fastifyRequestContext, {
    asyncLocalStorage: requestContextStorage,
  });

  // docs
  await server.register(fastifySwagger, {
    swagger: {
      info: {
        title: "Settlers API",
        version: "0.0.1",
      },
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
    },
  });
  server.addHook("onReady", async () => {
    server.swagger();
  });

  if (debugTweaks) {
    await server.register(fastifySwaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        deepLinking: false,
      },
      staticCSP: true,
    });
  }

  // Business logic plugins
  authPlugin(server, { authVerifier });

  return server;
}

export async function prepareWebsocketServer(
  parent: ServiceParent,
  httpServer: FastifyTypeboxInstance
) {
  const websocketServer = new WebSocketServer(parent, httpServer);

  return websocketServer;
}

export async function registerRoutes(
  server: FastifyTypeboxInstance,
  wsServer: WebSocketServer,
  rootService: RootService,
  { authIssuer, redis, entityManager }: ApiServices & AuthServices
) {
  const context: ServiceContext = {
    redis,
    entityManager,
    publisher: wsServer,
  };
  const registerHttp = <TResource extends BaseResource>(
    service: ResourceRoute<TResource>
  ) => {
    registerResourceRoutes({
      fastify: server,
      service,
    });
  };
  const registerWs = <TResource extends BaseResource>(
    service: ResourceHandler<TResource>
  ) => {
    wsServer.router.registerHandler(service);
  };

  await server.register(systemRoutes);
  await server.register(authDomain, {
    userService: new UserService(context),
    authIssuer,
  });

  {
    // This should provide a ws info about participants
    const service = new SessionService(rootService, context);
    registerHttp(service.route());
    registerWs(service.wsHandler());
  }
  {
    // This should provide a ws info about settings
    const service = new SessionSettingsService(rootService, context);
    registerHttp(service.route());
    registerWs(service.wsHandler());
    service.createConsumers();
  }
  {
    // Same as session settings
    const service = new LobbyService(rootService, context);
    registerHttp(service.route());
    service.createConsumers();
  }
  // await server.register(streamDomain);
}
