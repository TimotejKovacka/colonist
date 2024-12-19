import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  Coordinates,
  VertexCoordinates,
  PlayerColor,
  PlayerGamePiece,
  PlayerPieceName,
  HexagonVerticeIndex,
  HexHash,
} from "./types";
import { DIMENSIONS } from "./constants";
import { Point2D } from "./coordinate-system/point";
import { HexPoint } from "./coordinate-system/hex-point";

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
): Point2D {
  return new Point2D({
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

export function getEdgePosition(vertice: VertexCoordinates): Coordinates {
  return new Point2D(new HexPoint(vertice.hex)).add(
    getEdgeDelta(vertice.vertexIndex)
  );
}

function getEdgeDelta(vertexIndex: HexagonVerticeIndex): Coordinates {
  switch (vertexIndex) {
    case 0:
      return { x: DIMENSIONS.HEX.WIDTH / 4, y: DIMENSIONS.HEX.HEIGHT / 2 - 32 };
    case 1:
      return {
        x: -DIMENSIONS.HEX.WIDTH / 4,
        y: DIMENSIONS.HEX.HEIGHT / 2 - 32,
      };
    case 2:
      return {
        x: -DIMENSIONS.HEX.WIDTH / 2,
        y: 0,
      };
    case 3:
      return {
        x: -DIMENSIONS.HEX.WIDTH / 4,
        y: -DIMENSIONS.HEX.HEIGHT / 2 + 32,
      };
    case 4:
      return {
        x: DIMENSIONS.HEX.WIDTH / 4,
        y: -DIMENSIONS.HEX.HEIGHT / 2 + 32,
      };
    case 5:
      return { x: DIMENSIONS.HEX.WIDTH / 2, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

export function getEdgeRotation(vertice: VertexCoordinates): number {
  // Return rotation in degrees
  return 60 + vertice.vertexIndex * 60;
}

export function getValidHexVerticeIndex(index: string): HexagonVerticeIndex {
  const val = Number(index);
  assertHexVerticeIndex(val);

  return val;
}

export function toHexHash(row: number, col: number): HexHash {
  return `${row}-${col}`;
}
export function parseHexHash(s: string): [number, number] {
  assertHexHash(s);
  return s.split("-").map(Number) as [number, number];
}

export function assertHexHash(val: string): asserts val is HexHash {
  const parsed = val.split("-");
  if (parsed.length !== 2) {
    throw new Error(`${val} is not a valid hex hash`);
  }

  if (parsed.map(Number).filter(Number.isInteger).length !== 2) {
    throw new Error(`${val} is not a valid hex hash`);
  }
}

export function assertHexVerticeIndex(
  index: number
): asserts index is HexagonVerticeIndex {
  if (
    Number.isNaN(index) &&
    !Number.isInteger(index) &&
    index > 5 &&
    index < 0
  ) {
    throw new Error(`${index} is not a valid hex vertice index`);
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
