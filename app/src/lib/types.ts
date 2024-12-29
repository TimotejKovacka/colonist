import { StatefulHex } from "./state/stateful-hex";

export interface Coordinates {
  x: number;
  y: number;
}

export interface HexCoordinates {
  q: number;
  r: number;
  s: number;
}

export interface PartialHexCoordinates {
  q: number;
  r: number;
  s?: number;
}

export interface HexCoords {
  row: number;
  col: number;
}

export interface PanState {
  isPanning: boolean;
  start: Coordinates;
  offset: Coordinates;
}

export interface Sprite extends Coordinates {
  width: number;
  height: number;
}

export type ResourceType = "wood" | "brick" | "stone" | "wheat" | "sheep";
export type FiniteResourceType = ResourceType | "desert";

export type HexSpriteName = `hex_${FiniteResourceType}`;

export type PlayerColor = "red" | "blue";

export type PlayerGamePiece = "road" | "settlement" | "city";

export type PlayerPieceName = `${PlayerGamePiece}_${PlayerColor}`;

export type SpriteName =
  | HexSpriteName
  | PlayerPieceName
  | "robber"
  | "port"
  | DiceCombination;

export enum TurnStage {
  PreDice = 0,
  Dice = 1,
  Action = 2,
  Stale = 3,
}

export enum Actions {
  RollDice = 0,
  MoveRobber = 1,
  BuildRoad = 2,
  BuildSettlement = 3,
  BuildCity = 4,
  TradeBank = 5,
  TradePort = 6,
  TradePlayer = 7,
  BuyActionCard = 8,
  UseActionCard = 9,
}

export type DiceCombination = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type CoordinatesHash = `${number},${number}`;
export type DiceToHexMap = Record<DiceCombination, CoordinatesHash[]>;

export type VertexStatePatch = {
  building: Building.Settlement | Building.City;
  player: PlayerColor;
};

export type EdgeStatePatch = {
  player: PlayerColor;
};

export type HexStatePatch = {
  robber: boolean;
};

export type HexYield = Record<PlayerColor, number>;

export type PlayerHand = Array<ResourceType>;

export type PlayerHandPatch = Record<PlayerColor, PlayerHand>;

export type NullablePlayer = PlayerColor | null;
export type BuildingState = [Building, PlayerColor] | null;

export type IndexedHexState<T> = [T, T, T, T, T, T];

export type PlaneDimensions = {
  width: number;
  height: number;
};

export type ApiBoard = {
  hex: PlaneDimensions;
  hexes: {
    resource: FiniteResourceType;
    coords: PartialHexCoordinates;
  }[];
};

export enum Building {
  None = 0,
  Settlement = 1,
  City = 2,
}
