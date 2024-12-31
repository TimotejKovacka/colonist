import { Type } from "@sinclair/typebox";
import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import { createSessionPlayer } from "../../utils/player.js";

export async function sharedDomain(fastify: FastifyTypeboxInstance) {
  fastify.get("/session", {}, async (req) => {
    if (!req.session.player) {
      req.session.player = createSessionPlayer();
    }
    return req.session.player;
  });

  fastify.patch(
    "/session",
    {
      schema: {
        body: Type.Object({
          name: Type.String(),
        }),
      },
    },
    async (req) => {
      if (!req.session.player) {
        req.session.player = createSessionPlayer();
      }

      req.session.player.name = req.body.name;
      return req.session.player;
    }
  );
}
