import type {
  DiceCombination,
  DiceToHexMap,
  GameBoard,
  GameHexState,
  HexYield,
  ResourceName,
  Sprite,
  SpriteName,
} from "./types";

export const DIMENSIONS = {
  HEX: {
    WIDTH: 224,
    HEIGHT: 256,
    ROW_HEIGHT: 256 * 0.75, // Hexes overlap vertically
  },
  BOARD: {
    WIDTH: 224 * 5,
    HEIGHT: 256 * 3 + 2 * (256 / 2),
  },
} as const;

export const HEX_HALF_WIDTH = DIMENSIONS.HEX.WIDTH / 1.75;
export const HEX_HALF_HEIGHT = DIMENSIONS.HEX.HEIGHT / 2;

export const VERTEX_CLICK_RADIUS = 32 as const;

export const SPRITE_DEFINITIONS: Record<SpriteName, Sprite> = {
  // Terrain hexes
  hex_wood: { x: 0, y: 0, width: 224, height: 256 },
  hex_brick: { x: 0, y: 256, width: 224, height: 256 },
  hex_stone: { x: 0, y: 512, width: 224, height: 256 },
  hex_wheat: { x: 0, y: 768, width: 224, height: 256 },
  hex_sheep: { x: 0, y: 1024, width: 224, height: 256 },
  hex_desert: { x: 0, y: 1280, width: 224, height: 256 },

  // Pieces
  settlement_red: { x: 224, y: 0, width: 64, height: 64 },
  settlement_blue: { x: 224, y: 64, width: 64, height: 64 },
  city_red: { x: 288, y: 0, width: 64, height: 64 },
  city_blue: { x: 288, y: 64, width: 64, height: 64 },

  // Roads
  road_red: { x: 352, y: 0, width: 32, height: 128 },
  road_blue: { x: 352, y: 128, width: 32, height: 128 },

  // Unique pieces
  robber: { x: 224, y: 128, width: 64, height: 64 },
  port: { x: 288, y: 128, width: 64, height: 64 },

  // Dice rolls
  2: { x: 384, y: 0, width: 48, height: 48 },
  3: { x: 384, y: 48, width: 48, height: 48 },
  4: { x: 384, y: 96, width: 48, height: 48 },
  5: { x: 384, y: 144, width: 48, height: 48 },
  6: { x: 384, y: 192, width: 48, height: 48 },
  7: { x: 384, y: 240, width: 48, height: 48 },
  8: { x: 384, y: 288, width: 48, height: 48 },
  9: { x: 384, y: 336, width: 48, height: 48 },
  10: { x: 384, y: 384, width: 48, height: 48 },
  11: { x: 384, y: 432, width: 48, height: 48 },
  12: { x: 384, y: 480, width: 48, height: 48 },
} as const;

export const SPRITES: Map<SpriteName, Sprite> = new Map(
  Object.entries(SPRITE_DEFINITIONS)
) as Map<SpriteName, Sprite>;

export const DEFAULT_BOARD: GameBoard = {
  "0-1": getDefaultBoardHex("wood"),
  "0-2": getDefaultBoardHex("brick"),
  "0-3": getDefaultBoardHex("wheat"),
  "1-1": getDefaultBoardHex("wheat"),
  "1-2": getDefaultBoardHex("sheep"),
  "1-3": getDefaultBoardHex("brick"),
  "1-4": getDefaultBoardHex("stone"),
  "2-0": getDefaultBoardHex("brick"),
  "2-1": getDefaultBoardHex("wood"),
  "2-2": getDefaultBoardHex("desert", true),
  "2-3": getDefaultBoardHex("sheep"),
  "2-4": getDefaultBoardHex("stone"),
  "3-1": getDefaultBoardHex("wheat"),
  "3-2": getDefaultBoardHex("wood"),
  "3-3": getDefaultBoardHex("sheep"),
  "3-4": getDefaultBoardHex("stone"),
  "4-1": getDefaultBoardHex("wood"),
  "4-2": getDefaultBoardHex("sheep"),
  "4-3": getDefaultBoardHex("wheat"),
} as const;

export const DEFAULT_DICE_HEX_MAP: DiceToHexMap = {
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  8: [],
  9: [],
  10: [],
  11: [],
  12: [],
};

export const PAN_LIMITS = {
  MIN_X: -200,
  MIN_Y: -200,
  MAX_X: 200,
  MAX_Y: 200,
} as const;

export const DEFAULT_HEX_YIELD: HexYield = {
  blue: 0,
  red: 0,
};

// const values: DiceCombination[] = [2,3,3,4,4,4,5,5,5,5,6,6,6,6,6,7,7,7,7,7,7,8,8,8,8,8,9,9,9,9,10,10,10,11,11,12];
function getDefaultBoardHex(
  resource: ResourceName | "desert",
  robber = false
): GameHexState {
  return {
    resource,
    diceVal: (Math.floor(Math.random() * (12 - 2 + 1)) + 2) as DiceCombination,
    robber,
    vertices: {
      0: {},
      1: {},
      2: {},
      3: {},
      4: {},
      5: {},
    },
  };
}
