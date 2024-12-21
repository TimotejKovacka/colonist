import { DIMENSIONS } from "../constants";
import type { Coordinates, HexCoords, HexHash } from "../types";

export class HexPoint implements Coordinates, HexCoords {
  readonly row: number;
  readonly col: number;
  readonly x: number;
  readonly y: number;

  constructor(
    val: number | HexCoords,
    other?: number | Coordinates,
    offset?: Coordinates
  ) {
    if (
      typeof val === "number" &&
      other !== undefined &&
      typeof other === "number"
    ) {
      this.row = val;
      this.col = other;
    } else if (typeof val === "object" && "row" in val && "col" in val) {
      this.row = val.row;
      this.col = val.col;
    } else {
      throw new Error("Invalid arguments for HexPoint constructor");
    }

    const resolvedOffset =
      offset ?? (other && typeof other === "object" ? other : undefined);

    this.x =
      DIMENSIONS.HEX.WIDTH * this.col -
      Math.round(this.row % 2) * (DIMENSIONS.HEX.WIDTH / 2) +
      DIMENSIONS.HEX.WIDTH / 2 +
      (resolvedOffset?.x ?? 0);
    this.y =
      DIMENSIONS.HEX.ROW_HEIGHT * this.row +
      DIMENSIONS.HEX.HEIGHT / 2 +
      (resolvedOffset?.y ?? 0);
  }

  toHash(): HexHash {
    return `${this.row}-${this.col}`;
  }

  distanceTo(point: Coordinates): number {
    return Math.sqrt((point.x - this.x) ** 2 + (point.y - this.y) ** 2);
  }
}
