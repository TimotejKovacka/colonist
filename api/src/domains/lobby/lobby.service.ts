import type { Redis } from "ioredis";
import type { ServiceContext } from "../../libs/service-context.js";
import { ServiceContainer, type ServiceParent } from "../../libs/service.js";
import type {
  GameSettings,
  Player,
  PlayerData,
  SessionPlayer,
} from "../../types.js";
import { assert } from "../../libs/assert.js";
import { LobbyStore } from "./lobby.store.js";

const redisShareCode = (c: string) => `share:${c}`;
const redisLobbyShareCode = (c: string) => `lobby:share:${c}`;

export class LobbyService extends ServiceContainer {
  readonly redis: Redis;
  readonly lobbyStore: LobbyStore;

  constructor(parent: ServiceParent, context: ServiceContext) {
    super(parent, LobbyService.name);
    this.redis = context.redis;
    this.lobbyStore = new LobbyStore(this, context.redis);
  }

  async createLobby(owner: PlayerData) {
    const lobbyId = crypto.randomUUID();
    const lobby: Lobby = {
      id: lobbyId,
      ownerId: owner.id,
      players: [
        {
          ...owner,
          joinedAt: Date.now(),
        },
      ],
      settings: {
        mapName: "4 players",
        image: "",
        speed: "normal",
        maxPoints: 10,
      },
      createdAt: Date.now(),
    };

    const shareCode = await this.createShareCode(lobbyId);
    await this.redis.set(redisLobby(lobbyId), JSON.stringify(lobby));

    return { lobby, shareCode };
  }

  // TODO(now): playerData should be comming from session storage
  async joinLobby(shareCode: string, playerData: PlayerData) {
    const lobbyId = await this.getLobbyIdFromShareCode(shareCode);
    assert(lobbyId !== null);
    const lobby = await this.lobbyStore.get(lobbyId);

    if (lobby.players.some((player) => player.id === playerData.id)) {
      return lobby;
    }

    if (lobby.players.length >= 4) {
      // full lobby
      return null;
    }

    const player: Player = {
      ...playerData,
      joinedAt: Date.now(),
    };

    lobby.players.push(player);
    await this.redis.set(lobbyRedisKey, JSON.stringify(lobby));

    return lobby;
  }

  async getLobby(lobbyId: string) {}

  private async getLobbyIdFromShareCode(code: string): Promise<string | null> {
    return this.redis.get(redisShareCode(code));
  }

  private async createShareCode(lobbyId: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = generateShareCode();

      // Use multi to perform atomic operations
      const multi = this.redis.multi();

      // Check if code exists and try to set it
      multi.setnx(redisShareCode(code), lobbyId);
      multi.set(`lobby:share:${code}`, code);

      const [setShareCode] = await multi.exec();

      // If we successfully set the share code (it was unique)
      if (setShareCode && setShareCode[1] === 1) {
        return code;
      }

      attempts++;
    }

    throw new Error(
      "Failed to generate unique share code after maximum attempts"
    );
  }
}

/**
 * Generates a random 6-character alphanumeric code
 * @returns string
 */
function generateShareCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
