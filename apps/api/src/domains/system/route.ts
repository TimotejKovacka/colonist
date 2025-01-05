import type { FastifyTypeboxInstance } from "../../utils/fastify.js";

export async function systemRoutes(fastify: FastifyTypeboxInstance) {
  fastify.get("/ping", {}, async () => ({
    message: "pong",
  }));
}
