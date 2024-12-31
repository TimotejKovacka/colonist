import { DEFAULT_BOARD } from "./constants.js";
import { getEnvConfig, NodeEnv } from "./env.js";
import {
  type Lobby,
  type Player,
  type WsMessage,
  WsMessageType,
} from "./types.js";
import { generatePlayerName } from "./names.js";
import type { WebSocket } from "ws";
import { REDIS_KEYS } from "./redis.js";
import { RootService } from "./libs/service.js";
import { initServices, prepareServer, registerRoutes } from "./bootstrap.js";
import { ServerBooter } from "./server-booter.js";

async function main() {
  process.title = "Settlers API";

  const envConfig = getEnvConfig();

  const rootService = new RootService();

  const services = initServices(rootService, envConfig);
  const server = await prepareServer(services.redis, envConfig);

  await registerRoutes(server, rootService, services);

  new ServerBooter(rootService, server, {
    host: envConfig.HOST,
    port: envConfig.PORT,
  });

  await rootService.start();

  return async () => {
    await rootService.stop();
  };
}

const mainPromise = main();

process.on("SIGINT", async () => {
  const close = await mainPromise;
  await close();
});

// //
// async function createLobby(ownerId: string): Promise<string> {
//   const lobbyId = crypto.randomUUID();
//   const lobby: Lobby = {
//     id: lobbyId,
//     ownerId,
//     players: [],
//     settings: {
//       mapName: "4 players",
//       image: "",
//       speed: "normal",
//       maxPoints: 10,
//     },
//     createdAt: Date.now(),
//   };

//   await redis.set(REDIS_KEYS.LOBBY(lobbyId), JSON.stringify(lobby));
//   return lobbyId;
// }

// async function joinLobby(
//   lobbyId: string,
//   player: Player
// ): Promise<Lobby | null | undefined> {
//   const lobbyData = await redis.get(REDIS_KEYS.LOBBY(lobbyId));
//   if (!lobbyData) return undefined;

//   const lobby: Lobby = JSON.parse(lobbyData);
//   if (lobby.players.length >= 4) return null;

//   lobby.players.push(player);
//   await redis.set(REDIS_KEYS.LOBBY(lobbyId), JSON.stringify(lobby));
//   return lobby;
// }

// server.get("/health", async () => {
//   return { status: "ok" };
// });

// server.post("/lobby/create", async (request) => {
//   if (!request.session.player) {
//     request.session.player = {
//       id: crypto.randomUUID(),
//       name: generatePlayerName(),
//     };
//   }
//   const lobbyId = await createLobby(request.session.player.id);

//   return { lobbyId };
// });

// server.get("/lobby/:lobbyId", async (request) => {
//   if (!request.session.player) {
//     request.session.player = {
//       id: crypto.randomUUID(),
//       name: generatePlayerName(),
//     };
//   }
//   const { lobbyId } = request.params as { lobbyId: string };
//   const player: Player = {
//     ...request.session.player,
//     joinedAt: Date.now(),
//   };
//   const lobby = await joinLobby(lobbyId, player);
//   if (lobby === undefined) {
//     throw server.httpErrors.notFound("Lobby not found");
//   }
//   if (lobby === null) {
//     throw server.httpErrors.badRequest("Lobby is full");
//   }

//   return lobby;
// });

// server.get("/game/:gameId/board", async (request) => {
//   const { gameId } = request.params as { gameId: string };
//   const gameState = await redis.get(REDIS_KEYS.GAME(gameId));

//   if (!gameState) {
//     // Return default board for development
//     if (config.NODE_ENV === NodeEnv.Development) {
//       return DEFAULT_BOARD;
//     }
//     throw server.httpErrors.notFound("Game not found");
//   }

//   return JSON.parse(gameState);
// });

// // WebSocket handling
// const connections = new Map<string, WebSocket>();

// server.register(async (fastify) => {
//   fastify.get("/stream", { websocket: true }, (connection, req) => {
//     const playerId = req.session.player?.id;
//     if (!playerId) {
//       connection.close();
//       return;
//     }

//     connections.set(playerId, connection);

//     connection.on("message", async (rawData) => {
//       try {
//         const message: WsMessage = JSON.parse(rawData.toString());
//         await handleWebSocketMessage(playerId, message, connection);
//       } catch (error) {
//         connection.send(
//           JSON.stringify({
//             type: WsMessageType.ERROR,
//             payload: "Invalid message format",
//           })
//         );
//       }
//     });

//     connection.on("close", () => {
//       connections.delete(playerId);
//     });
//   });
// });

// async function handleWebSocketMessage(
//   playerId: string,
//   message: WsMessage,
//   socket: WebSocket
// ) {
//   switch (message.type) {
//     case WsMessageType.JOIN_LOBBY:
//       await handleJoinLobby(playerId, message.payload, socket);
//       break;
//     case WsMessageType.ROAD:
//       await handleBuildRoad(playerId, message.payload);
//       break;
//     case WsMessageType.SETTLEMENT:
//       await handleBuildSettlement(playerId, message.payload);
//       break;
//     case WsMessageType.CITY:
//       await handleBuildCity(playerId, message.payload);
//       break;
//     default:
//       socket.send(
//         JSON.stringify({
//           type: WsMessageType.ERROR,
//           payload: "Unknown message type",
//         })
//       );
//   }
// }

// async function handleJoinLobby(
//   playerId: string,
//   payload: any,
//   socket: WebSocket
// ) {
//   // Implement lobby join logic
// }

// async function handleBuildRoad(playerId: string, payload: any) {
//   // Implement road building logic
// }

// async function handleBuildSettlement(playerId: string, payload: any) {
//   // Implement settlement building logic
// }

// async function handleBuildCity(playerId: string, payload: any) {
//   // Implement city building logic
// }

// try {
//   await server.listen({ host: config.HOST, port: config.PORT });
// } catch (err) {
//   server.log.error(err);
//   process.exit(1);
// }
