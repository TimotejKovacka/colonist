export interface PlayerData {
  id: string;
  name: string;
}

export interface SessionPlayer extends PlayerData {
  joinedAt: number;
}

export interface GameSettings {
  mapName: string;
  image: string;
  speed: "normal";
  maxPoints: number;
}

// REDIS
export type PipelineResult<T> = [Error | null, T];
