import { Type } from "@sinclair/typebox";
import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import { createSessionPlayer } from "../../utils/player.js";
import type { LobbyService } from "./lobby.service.js";

export async function lobbyRoutes(
  fastify: FastifyTypeboxInstance,
  {
    lobbyService,
  }: {
    lobbyService: LobbyService;
  }
) {
  fastify.post("/lobby", {}, async (req) => {
    req.session.player ??= createSessionPlayer();

    return await lobbyService.createLobby(req.session.player);
  });

  fastify.post(
    "/lobby/:shareCode",
    {
      schema: {
        description: "Join lobby",
        params: Type.Object({
          shareCode: Type.String(),
        }),
      },
    },
    async (req) => {
      req.session.player ??= createSessionPlayer();

      const shareCode = req.params.shareCode;

      return await lobbyService.joinLobby(shareCode, req.session.player);
    }
  );
}
