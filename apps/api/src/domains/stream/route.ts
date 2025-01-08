import { JsonSerde, type Logger } from "@colonist/utils";
import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import type { MessageRouter } from "../../libs/ws/message-router.js";
import type {
  WebSocketMessage,
  WebSocketRouteContext,
} from "../../libs/ws/ws-resource-route.js";

export interface StreamDomainOptions {
  logger: Logger;
  router: MessageRouter;
}

export async function streamDomain(
  fastify: FastifyTypeboxInstance,
  { logger }: StreamDomainOptions
) {
  const jsonSerde = new JsonSerde<WebSocketMessage>();
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
      const context: WebSocketRouteContext = {
        request: req,
        send: (message) => socket.send(jsonSerde.encode(message)),
      };
      req.log.info("New connection established");
      socket.on("message", (rawMessage) => {
        try {
          const messageString = rawMessage.toString("utf-8");
          const message = jsonSerde.decode(messageString);
          router.getMessageRouter().handleMessage(message, context);
        } catch (err) {
          logger.error("Failed to process message", { rawMessage }, err);
        }
      });
      socket.on("open", () => req.log.info("Connection open"));
      socket.on("close", () => {
        logger.info("Connection closed");
      });

      socket.on("error", (error) => {
        logger.error("WebSocket error", {}, error);
      });
      socket.on("upgrade", (request) =>
        req.log.info(request, "Connection upgrade")
      );
      socket.on("unexpected-response", () =>
        req.log.info("Unexpected response")
      );
    }
  );
}
