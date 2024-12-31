import fastifySensible from "@fastify/sensible";
import { type EnvConfig, NodeEnv } from "./env.js";
import { createLogger } from "./libs/logger.js";
import type { RootService, ServiceParent } from "./libs/service.js";
import { type FastifyTypeboxInstance, initFastify } from "./utils/fastify.js";
import { RedisService } from "./utils/redis.client.js";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import type { Redis } from "ioredis";
import fastifySession from "@fastify/session";
import { RedisStore } from "connect-redis";
import fastifyWebsocket from "@fastify/websocket";
import fastifySwagger from "@fastify/swagger";
import { debugTweaks } from "./utils/debug-tweaks.js";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { systemRoutes } from "./domains/system/route.js";
import { lobbyRoutes } from "./domains/lobby/route.js";
import { sharedDomain } from "./domains/shared/route.js";
import { streamDomain } from "./domains/stream/route.js";
import { LobbyService } from "./domains/lobby/lobby.service.js";

export interface ApiServices {
  redis: Redis;
}

export function initServices(
  parent: ServiceParent,
  envConfig: EnvConfig
): ApiServices {
  const { redis } = new RedisService(parent, {
    host: envConfig.REDIS_HOST,
    port: envConfig.REDIS_PORT,
  });

  return {
    redis,
  };
}

export async function prepareServer(redis: Redis, envConfig: EnvConfig) {
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
  await server.register(fastifySession, {
    secret: envConfig.SESSION_SECRET_KEY,
    store: new RedisStore({
      client: redis,
      prefix: "sessions:",
    }),
    cookieName: "sessionId",
    cookie: {
      secure: envConfig.NODE_ENV === NodeEnv.Production,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  });

  // docs
  await server.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.1",
      info: {
        title: "Settlers API",
        version: "0.0.1",
      },
      tags: [],
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

  return server;
}

export async function registerRoutes(
  server: FastifyTypeboxInstance,
  rootService: RootService,
  services: ApiServices
) {
  await server.register(systemRoutes);

  await server.register(sharedDomain);

  const lobbyService = new LobbyService(rootService, services);
  await server.register(streamDomain, {
    lobbyService,
  });

  await server.register(lobbyRoutes, {
    lobbyService,
  });
}
