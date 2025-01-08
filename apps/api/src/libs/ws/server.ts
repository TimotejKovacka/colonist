import { JsonSerde } from "@colonist/utils";
import type {
  WebSocketMessage,
  WebSocketRouteContext,
} from "./ws-resource-route.js";
import { MessageRouter } from "./message-router.js";
import { ServiceContainer, type ServiceParent } from "@colonist/backend-utils";
import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import { assertSubscriptionMessage } from "./is-resource-message.js";

/**
 * Main WebSocket server that manages connections and delegates to MessageRouter
 */
export class WebSocketServer extends ServiceContainer {
  readonly jsonSerde = new JsonSerde<WebSocketMessage>();
  readonly router: MessageRouter = new MessageRouter(this);

  constructor(
    parent: ServiceParent,
    {
      fastify,
    }: {
      fastify: FastifyTypeboxInstance;
    }
  ) {
    super(parent, WebSocketServer.name, {}, "parallel");

    fastify.get(
      "/stream",
      {
        websocket: true,
        schema: {
          description: "WebSocket endpoint for real-time updates",
          tags: ["stream"],
        },
      },
      async (socket, request) =>
        this.handleConnection({
          request,
          socket,
          send: (message) => socket.send(this.jsonSerde.encode(message)),
        })
    );
  }

  private handleConnection(context: WebSocketRouteContext) {
    context.socket.on("message", (rawMessage) => {
      try {
        const messageString = rawMessage.toString("utf-8");
        const message = this.jsonSerde.decode(messageString);
        this.handleMessage(message, context);
      } catch (error) {
        this.logger.error("Error processing message", {}, error);
      }
    });

    context.socket.on("close", () => {
      this.logger.info("Connection closed");
      // Cleanup subscriptions
    });

    context.socket.on("error", (error) => {
      this.logger.error("WebSocket error", {}, error);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleMessage(
    message: WebSocketMessage,
    context: WebSocketRouteContext
  ): Promise<void> {
    switch (message.type) {
      case "subscribe": {
        assertSubscriptionMessage(message);
        this.router.subcribe(message.payload.target, context);
        break;
      }
      case "unsubscribe": {
        assertSubscriptionMessage(message);
        this.router.unsubscribe(message.payload.target, context);
        break;
      }
      case "ping": {
        context.send(pingReply);
        break;
      }
      default: {
        this.logger.error("Unhandled message type", { type: message.type });
        throw new Error("Unhandled message type");
      }
    }
  }

  getRouter(): MessageRouter {
    return this.router;
  }
}

const pingReply: WebSocketMessage = {
  type: "pong",
  payload: null,
};
