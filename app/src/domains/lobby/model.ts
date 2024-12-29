import { PlayerColor } from "@/lib/types";
import { makeAutoObservable } from "mobx";

export interface PlayerData {
  color: PlayerColor;
  name: string;
}

export interface MapInfo {
  name: string;
  image: string;
}

export interface LobbyData {
  owner: PlayerData;
  players: PlayerData[];
  map: MapInfo;
}

export class LobbyModel {
  owner: PlayerData | null = null;
  players: PlayerData[] = [];
  map: MapInfo | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  set data(data: LobbyData) {
    this.owner = data.owner;
    this.players = data.players;
    this.map = data.map;
  }
}
