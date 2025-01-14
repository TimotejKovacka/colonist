import { Type } from "@sinclair/typebox";
import type { FastifyTypeboxInstance } from "./utils/fastify.js";
import type { WebSocketServer } from "./utils/websocket.js";
import fastifySensible from "@fastify/sensible";
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import {
  debugTweaks,
  ServiceContainer,
  type ServiceParent,
} from "@pilgrim/backend-utils";
import { SessionService } from "./domains/resource/session.service.js";

export async function prepareFastify(fastify: FastifyTypeboxInstance) {
  await fastify.register(fastifySensible);
  await fastify.register(fastifyCors, {
    origin: ["http://localhost"],
    credentials: true,
  });

  //////////// docs ////////////
  await fastify.register(fastifySwagger, {
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
  fastify.addHook("onReady", async () => {
    fastify.swagger();
  });

  if (debugTweaks) {
    await fastify.register(fastifySwaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        deepLinking: false,
      },
      staticCSP: true,
    });
  }
  //////////////////////////////
}

export async function registerHttpRoutes(
  fastify: FastifyTypeboxInstance,
  websocket: WebSocketServer
) {
  fastify.get("/ping", {}, async () => {
    return { message: "pong" };
  });

  fastify.post(
    "/publish",
    {
      schema: {
        tags: ["Relays resource patches to intended clients in real-time"],
        body: Type.Object({
          ref: Type.Intersect([
            Type.Object({
              type: Type.String(),
            }),
            Type.Record(Type.String(), Type.String()),
          ]),
          patch: Type.Object({
            patch: Type.Union([Type.Object({}), Type.Null()]),
            oldModifiedAtMs: Type.Optional(
              Type.Union([Type.Number(), Type.Null()])
            ),
          }),
        }),
        response: {
          204: Type.Null(),
        },
      },
    },
    async (request, reply) => {
      const { ref, patch } = request.body;
      websocket.publish(ref, patch);

      reply.statusCode = 204;
      return;
    }
  );
}

export async function registerSocketNamespaces(
  parent: ServiceParent,
  { router }: WebSocketServer
) {
  const resourceNspContainer = new ServiceContainer(
    parent,
    "ResourceNamespaces",
    {},
    "parallel"
  );

  router.register(new SessionService(resourceNspContainer).handler());
}
