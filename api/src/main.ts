import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import fastifyWebsocket from "@fastify/websocket";
import fastifyRedis from "@fastify/redis";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import { DEFAULT_BOARD } from "./constants.js";
import { getEnvConfig, NodeEnv } from "./env.js";
import { Redis } from "ioredis";
import { Lobby, Player, WsMessage, WsMessageType } from "./types.js";
import { RedisStore } from "connect-redis";
import { generatePlayerName } from "./names.js";
import { WebSocket } from "ws";

const config = getEnvConfig();

const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
});

redis.on("error", (err) => console.error("Redis Client Error", err));
redis.on("connect", () => console.log("Redis Client Connected"));

const server = Fastify({
  logger: true,
});

server.register(fastifySensible);
server.register(cors, {
  origin: ["*"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});
server.register(fastifyRedis, {
  client: redis,
  closeClient: true, // automatically closes the client connection
});
server.register(fastifyWebsocket);
server.register(fastifyCookie);
server.register(fastifySession, {
  secret: config.SESSION_SECRET_KEY,
  store: new RedisStore({
    client: redis,
    prefix: "sesh:",
  }),
  cookie: {
    secure: config.NODE_ENV === NodeEnv.Production,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
});

const REDIS_KEYS = {
  LOBBY: (id: string) => `lobby:${id}`,
  LOBBY_PLAYERS: (id: string) => `lobby:${id}:players`,
  PLAYER: (id: string) => `player:${id}`,
  GAME: (id: string) => `game:${id}`,
};

async function createLobby(ownerId: string): Promise<string> {
  const lobbyId = crypto.randomUUID();
  const lobby: Lobby = {
    id: lobbyId,
    ownerId,
    players: [],
    settings: {
      mapName: "4 players",
      image: "",
      speed: "normal",
      maxPoints: 10,
    },
    createdAt: Date.now(),
  };

  await redis.set(REDIS_KEYS.LOBBY(lobbyId), JSON.stringify(lobby));
  return lobbyId;
}

async function joinLobby(
  lobbyId: string,
  player: Player
): Promise<Lobby | null | undefined> {
  const lobbyData = await redis.get(REDIS_KEYS.LOBBY(lobbyId));
  if (!lobbyData) return undefined;

  const lobby: Lobby = JSON.parse(lobbyData);
  if (lobby.players.length >= 4) return null;

  lobby.players.push(player);
  await redis.set(REDIS_KEYS.LOBBY(lobbyId), JSON.stringify(lobby));
  return lobby;
}

server.get("/health", async () => {
  return { status: "ok" };
});

server.post("/lobby/create", async (request) => {
  if (!request.session.player) {
    request.session.player = {
      id: crypto.randomUUID(),
      name: generatePlayerName(),
    };
  }
  const lobbyId = await createLobby(request.session.player.id);

  return { lobbyId };
});

server.get("/lobby/:lobbyId", async (request) => {
  if (!request.session.player) {
    request.session.player = {
      id: crypto.randomUUID(),
      name: generatePlayerName(),
    };
  }
  const { lobbyId } = request.params as { lobbyId: string };
  const player: Player = {
    ...request.session.player,
    joinedAt: Date.now(),
  };
  const lobby = await joinLobby(lobbyId, player);
  if (lobby === undefined) {
    throw server.httpErrors.notFound("Lobby not found");
  } else if (lobby === null) {
    throw server.httpErrors.badRequest("Lobby is full");
  }

  return lobby;
});

server.get("/game/:gameId/board", async (request) => {
  const { gameId } = request.params as { gameId: string };
  const gameState = await redis.get(REDIS_KEYS.GAME(gameId));

  if (!gameState) {
    // Return default board for development
    if (config.NODE_ENV === NodeEnv.Development) {
      return DEFAULT_BOARD;
    }
    throw server.httpErrors.notFound("Game not found");
  }

  return JSON.parse(gameState);
});

// WebSocket handling
const connections = new Map<string, WebSocket>();

server.register(async function (fastify) {
  fastify.get("/stream", { websocket: true }, (connection, req) => {
    const playerId = req.session.player?.id;
    if (!playerId) {
      connection.close();
      return;
    }

    connections.set(playerId, connection);

    connection.on("message", async (rawData) => {
      try {
        const message: WsMessage = JSON.parse(rawData.toString());
        await handleWebSocketMessage(playerId, message, connection);
      } catch (error) {
        connection.send(
          JSON.stringify({
            type: WsMessageType.ERROR,
            payload: "Invalid message format",
          })
        );
      }
    });

    connection.on("close", () => {
      connections.delete(playerId);
    });
  });
});

async function handleWebSocketMessage(
  playerId: string,
  message: WsMessage,
  socket: WebSocket
) {
  switch (message.type) {
    case WsMessageType.JOIN_LOBBY:
      await handleJoinLobby(playerId, message.payload, socket);
      break;
    case WsMessageType.ROAD:
      await handleBuildRoad(playerId, message.payload);
      break;
    case WsMessageType.SETTLEMENT:
      await handleBuildSettlement(playerId, message.payload);
      break;
    case WsMessageType.CITY:
      await handleBuildCity(playerId, message.payload);
      break;
    default:
      socket.send(
        JSON.stringify({
          type: WsMessageType.ERROR,
          payload: "Unknown message type",
        })
      );
  }
}

async function handleJoinLobby(
  playerId: string,
  payload: any,
  socket: WebSocket
) {
  // Implement lobby join logic
}

async function handleBuildRoad(playerId: string, payload: any) {
  // Implement road building logic
}

async function handleBuildSettlement(playerId: string, payload: any) {
  // Implement settlement building logic
}

async function handleBuildCity(playerId: string, payload: any) {
  // Implement city building logic
}

try {
  await server.listen({ host: config.HOST, port: config.PORT });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
