import fastifySensible from "@fastify/sensible";
import fastifyRequestContext from "@fastify/request-context";
import type { EnvConfig } from "./env.js";
import type {
  RootService,
  ServiceParent,
} from "../../../packages/backend-utils/src/service.js";
import { type FastifyTypeboxInstance, initFastify } from "./utils/fastify.js";
import { RedisService } from "./utils/redis.client.js";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import type { Redis } from "ioredis";
import fastifyWebsocket from "@fastify/websocket";
import fastifySwagger from "@fastify/swagger";
import { debugTweaks } from "./utils/debug-tweaks.js";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { systemRoutes } from "./domains/system/route.js";
import { streamDomain } from "./domains/stream/route.js";
import { ORMService } from "./utils/orm.client.js";
import type { EntityManager } from "typeorm";
import { authDomain } from "./domains/auth/route.js";
import { User } from "./domains/auth/user.entity.js";
import { authPlugin } from "./libs/auth/fastify-auth.plugin.js";
import { AuthIssuer } from "./libs/auth/auth-issuer.js";
import { AuthVerifier } from "./libs/auth/auth-verifier.js";
import { SessionService } from "./domains/session/session.service.js";
import type { ServiceContext } from "./libs/service-context.js";
import { AuthService } from "./domains/auth/auth-service.js";
import type { BaseResource } from "@colonist/api-contracts";
import {
  registerResourceRoutes,
  type ResourceRoute,
} from "./libs/resource-route.js";
import { createLogger, requestContextStorage } from "@colonist/backend-utils";
import { SessionSettingsService } from "./domains/session/session-settings.service.js";
import { LobbyService } from "./domains/session/lobby.service.js";

export interface ApiServices {
  redis: Redis;
  entityManager: EntityManager;
  authIssuer: AuthIssuer;
  authVerifier: AuthVerifier;
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

  const authIssuer = new AuthIssuer(parent, { redis });

  const authVerifier = new AuthVerifier(parent);

  return {
    authIssuer,
    authVerifier,
    redis,
    entityManager,
  };
}

export async function prepareServer(
  services: ApiServices,
  envConfig: EnvConfig
) {
  const server = initFastify({
    logger: createLogger("fastify").pinoLogger,
    ajv: {
      customOptions: {
        removeAdditional: "all",
        useDefaults: false,
      },
    },
  });

  await server.register(fastifySensible);
  await server.register(fastifyCors, {
    origin: ["http://localhost"],
    credentials: true,
  });
  await server.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB
      clientTracking: true, // Enable client tracking
    },
  });
  await server.register(fastifyCookie);
  await server.register(fastifyRequestContext, {
    asyncLocalStorage: requestContextStorage,
  });
  // await server.register(fastifySession, {
  //   secret: envConfig.SESSION_SECRET_KEY,
  //   store: new RedisStore({
  //     client: services.redis,
  //     prefix: "sessions:",
  //   }),
  //   cookieName: "sessionId",
  //   cookie: {
  //     secure: envConfig.NODE_ENV === NodeEnv.Production,
  //     maxAge: 24 * 60 * 60 * 1000, // 1 day
  //   },
  // });

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
  authPlugin(server, { authVerifier: services.authVerifier });

  return server;
}

export async function registerRoutes(
  server: FastifyTypeboxInstance,
  rootService: RootService,
  { authIssuer, authVerifier, redis, entityManager }: ApiServices
) {
  const context: ServiceContext = {
    redis,
    entityManager,
  };
  const register = <TResource extends BaseResource>(
    service: ResourceRoute<TResource>
  ) => {
    registerResourceRoutes({
      fastify: server,
      service,
    });
  };

  await server.register(systemRoutes);
  await server.register(authDomain, {
    authService: new AuthService(context),
    authIssuer,
    authVerifier,
    entityManager,
  });

  {
    // This should provide a ws info about participants
    const service = new SessionService(rootService, context);
    register(service.route());
  }
  {
    // This should provide a ws info about settings
    const service = new SessionSettingsService(rootService, context);
    register(service.route());
    service.createConsumers();
  }
  {
    // Same as session settings
    const service = new LobbyService(rootService, context);
    register(service.route());
  }

  await server.register(streamDomain);
}
