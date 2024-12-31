import type { Redis } from "ioredis";
import { ServiceContainer, type ServiceParent } from "../../libs/service.js";
import type { GameSettings, SessionPlayer } from "../../types.js";
import { NotFound } from "http-errors";
import { validate } from "../../libs/validate.js";

export interface Lobby {
  id: string;
  ownerId: string;
  players: SessionPlayer[];
  settings: GameSettings;
  createdAt: number;
}

const redisLobby = (id: string) => `lobby:${id}`;

export class LobbyStore extends ServiceContainer {
  constructor(parent: ServiceParent, readonly redis: Redis) {
    super(parent, LobbyStore.name);
  }

  async tryGetRaw(key: string): Promise<Lobby | undefined> {
    try {
      const val = await this.redis.get(redisLobby(key));
      return val === null ? undefined : JSON.parse(val);
    } catch (e) {
      this.logger.error("Failed to get state from storage", key, e);
      return undefined;
    }
  }

  async tryGet(key: string): Promise<Lobby | undefined> {
    return this.tryGetRaw(key);
  }

  async get(key: string): Promise<Lobby> {
    const resource = await this.tryGet(key);
    validate(resource !== undefined, "Resource not found", NotFound);
    return resource;
  }

  async set(key: string): Promise<Lobby> {
    // TODO(soon): minification, doesnt need to store defauts
  }
}
