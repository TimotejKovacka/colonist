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
