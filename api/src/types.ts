export enum WsMessageType {
  SETTLEMENT = "settlement",
  CITY = "city",
  ROAD = "road",
  ERROR = "error",
  JOIN_LOBBY = "join-lobby",
}

export type WsMessage = {
  type: WsMessageType;
  payload: any;
};

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface GameSettings {
  mapName: string;
  image: string;
  speed: "normal";
  maxPoints: number;
}

export interface Lobby {
  id: string;
  ownerId: string;
  players: Player[];
  settings: GameSettings;
  createdAt: number;
}
