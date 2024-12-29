import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Coordinates,
  PlayerColor,
  PlayerGamePiece,
  PlayerPieceName,
  CoordinatesHash,
  FiniteResourceType,
  HexSpriteName,
  Building,
} from "./types";
import { DIMENSIONS } from "./constants";
import { Point } from "./coordinate-system/point";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getVertexPosition(
  hexPos: Coordinates,
  vertex: number
): Coordinates {
  const angle = (vertex * 60 + 30) * (Math.PI / 180);
  return {
    x: hexPos.x + (DIMENSIONS.HEX.WIDTH / 1.75) * Math.cos(angle),
    y: hexPos.y + (DIMENSIONS.HEX.HEIGHT / 2) * Math.sin(angle),
  };
}

export function getBoardToCanvasCenterOffset(
  canvasWidth: number,
  canvasHeight: number
): Point {
  return new Point({
    x: (canvasWidth - DIMENSIONS.BOARD.WIDTH) / 2,
    y: (canvasHeight - DIMENSIONS.BOARD.HEIGHT) / 2,
  });
}

export function getGamePieceName(
  piece: PlayerGamePiece,
  player: PlayerColor
): PlayerPieceName {
  return `${piece}_${player}` as PlayerPieceName;
}

export function getBuildingSpriteName(
  building: Building.Settlement | Building.City,
  player: PlayerColor
): PlayerPieceName {
  switch (building) {
    case Building.Settlement:
      return `settlement_${player}`;
    case Building.City:
      return `city_${player}`;
  }
}

export function toHexHash(row: number, col: number): CoordinatesHash {
  return `${row},${col}`;
}
export function parseHexHash(s: string): [number, number] {
  assertHexHash(s);
  return s.split(",").map(Number) as [number, number];
}

export function assertHexHash(val: string): asserts val is CoordinatesHash {
  const parsed = val.split(",");
  if (parsed.length !== 2) {
    throw new Error(`${val} is not a valid hex hash`);
  }

  if (parsed.map(Number).filter(Number.isInteger).length !== 2) {
    throw new Error(`${val} is not a valid hex hash`);
  }
}

export function assertGamePiece(
  piece: string
): asserts piece is PlayerGamePiece {
  if (!["road", "city", "settlement"].includes(piece)) {
    throw new Error(`Unknown piece type: ${piece}`);
  }
}

export function assertPlayerColor(s: string): asserts s is PlayerColor {
  if (!["red", "blue"].includes(s)) {
    throw new Error(`Unknown player color: ${s}`);
  }
}

export function isEven(n: number): boolean {
  return n % 2 === 0;
}

export function toHexSpriteName(
  resourceType: FiniteResourceType
): HexSpriteName {
  return `hex_${resourceType}`;
}
