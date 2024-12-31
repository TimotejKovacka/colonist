import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import type { LobbyService } from "../lobby/lobby.service.js";

interface WebSocketMessage {
  type: string;
  payload: unknown;
}

export async function streamDomain(
  fastify: FastifyTypeboxInstance,
  {
    lobbyService,
  }: {
    lobbyService: LobbyService;
  }
) {
  fastify.get(
    "/stream",
    {
      websocket: true,
      schema: {
        description: "WebSocket endpoint for real-time updates",
        tags: ["stream"],
      },
    },
    async (socket, req) => {
      req.log.info("New connection established");
      socket.on("message", (rawMessage) => {
        try {
          // Parse the Buffer into a string and then into JSON
          const messageString = rawMessage.toString("utf-8");
          const message = JSON.parse(messageString) as WebSocketMessage;
          req.log.info({ message }, "Received message");

          // Handle different message types
          switch (message.type) {
            case "ping":
              socket.send(
                JSON.stringify({
                  type: "pong",
                  payload: null,
                })
              );
              break;
            default:
              req.log.info({ type: message.type }, "Unhandled message type");
          }
        } catch (error) {
          req.log.error(error, "Error processing message");
        }
      });
      socket.on("open", () => req.log.info("Connection open"));
      socket.on("close", () => {
        req.log.info("Connection closed");
      });

      socket.on("error", (error) => {
        req.log.error(error, "WebSocket error");
      });
      socket.on("message", (msg) =>
        req.log.info(JSON.stringify(msg), "new message")
      );
      socket.on("upgrade", (request) =>
        req.log.info(request, "Connection upgrade")
      );
      socket.on("unexpected-response", () =>
        req.log.info("Unexpected response")
      );
    }
  );
}
