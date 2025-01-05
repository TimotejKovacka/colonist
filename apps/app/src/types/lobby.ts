export interface Player {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
}

export interface GameSettings {
  mapName: string;
  image: string;
  speed: "normal" | "fast" | "slow";
  maxPoints: number;
}

export interface Lobby {
  id: string;
  ownerId: string;
  players: Player[];
  settings: GameSettings;
  createdAt: number;
}
