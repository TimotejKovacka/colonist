export interface Coordinates {
  x: number;
  y: number;
}

export interface HexCoordinates {
  row: number;
  col: number;
}

/**
 * **4**
 * 3***5
 * 2***0
 * **1**
 */
export type HexagonVerticeIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface VertexCoordinates {
  hex: HexCoordinates;
  vertexIndex: HexagonVerticeIndex; // Starting from top, going clockwise
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

export type ResourceName = "wood" | "brick" | "stone" | "wheat" | "sheep";

export type HexName = `hex_${ResourceName}` | "hex_desert";

export type PlayerColor = "red" | "blue";

export type PlayerGamePiece = "road" | "settlement" | "city";

export type PlayerPieceName = `${PlayerGamePiece}_${PlayerColor}`;

export type SpriteName =
  | HexName
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

export type GameVertexState = {
  road?: PlayerColor;
  settlement?: PlayerColor;
  city?: PlayerColor;
};

export type GameHexState = {
  resource: ResourceName | "desert";
  vertices: Record<HexagonVerticeIndex, GameVertexState>;
  robber: boolean;
  diceVal: DiceCombination;
};

export type HexHash = `${number}-${number}`;
export type GameBoard = Record<HexHash, GameHexState>;
export type DiceToHexMap = Record<DiceCombination, HexHash[]>;

export type HexStatePatch = {
  vertices: {
    [vertexIndex in HexagonVerticeIndex]?: {
      [piece in PlayerGamePiece]?: PlayerColor | undefined;
    };
  };
};

export type HexYield = Record<PlayerColor, number>;

export type PlayerHand = Array<ResourceName>;

export type PlayerHandPatch = Record<PlayerColor, PlayerHand>;
