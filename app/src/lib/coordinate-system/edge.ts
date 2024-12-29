import { Coordinates } from "../types";
import { Hex } from "./hex";
import { Point } from "./point";

export class Edge extends Point {
  static fromCube(h: Hex): Edge[] {
    const offset = -1;
    const col: number = h.q + (h.r + offset * (h.r & 1)) / 2;
    const row: number = h.r;
    const midway = new Point({
      x: col * 4 + 2 + (row % 2 === 0 ? 0 : 2),
      y: row * 2 + 1,
    });

    return [
      new Edge(midway.add({ x: 1, y: -1 })),
      new Edge(midway.add({ x: -1, y: -1 })),
      new Edge(midway.add({ x: -2, y: 0 })),
      new Edge(midway.add({ x: -1, y: 1 })),
      new Edge(midway.add({ x: 1, y: 1 })),
      new Edge(midway.add({ x: 2, y: 0 })),
    ];
  }

  public readonly rotation: number;
  private readonly type: "v" | "l" | "r";

  constructor(coords: Coordinates) {
    // TODO(now): Validate coords
    super(coords);
    // const isEdgeOddRow = this.y % 2 === 1;
    const xOffset = (this.y / 2) % 2 ? -2 : 0;
    const type = Math.abs((this.x + xOffset) % 4);
    switch (type) {
      case 0:
        this.type = "v"; // vertical
        this.rotation = 0;
        break;
      case 1:
        this.type = "l"; // left
        this.rotation = 60;
        break;
      case 2:
        this.type = "v";
        this.rotation = 0;
        break;
      // throw new InvalidEdgeConstructorError(coords.x, coords.y);
      case 3:
        this.type = "r"; // right
        this.rotation = -60;
        break;
      default:
        throw new InvalidEdgeConstructorError(coords.x, coords.y);
    }
  }

  // TODO(soon): simplify
  neighbours(): Edge[] {
    switch (this.type) {
      case "v":
        return [
          // right-top
          new Edge({
            x: this.x + 1,
            y: this.y - 1,
          }),
          // left-top
          new Edge({
            x: this.x - 1,
            y: this.y - 1,
          }),
          // left-bottom
          new Edge({
            x: this.x - 1,
            y: this.y + 1,
          }),
          // right-bottom
          new Edge({
            x: this.x + 1,
            y: this.y + 1,
          }),
        ];
      case "l":
        return [
          // right
          new Edge({
            x: this.x + 2,
            y: this.y,
          }),
          // right-top
          new Edge({
            x: this.x + 1,
            y: this.y - 1,
          }),
          // left
          new Edge({
            x: this.x - 2,
            y: this.y,
          }),
          // left-bottom
          new Edge({
            x: this.x - 1,
            y: this.y + 1,
          }),
        ];
      case "r":
        return [
          // right
          new Edge({
            x: this.x + 2,
            y: this.y,
          }),
          // left-top
          new Edge({
            x: this.x - 1,
            y: this.y - 1,
          }),
          // left
          new Edge({
            x: this.x - 2,
            y: this.y,
          }),
          // right-bottom
          new Edge({
            x: this.x + 1,
            y: this.y + 1,
          }),
        ];
    }
  }

  override toString(): string {
    return `Edge(${this.x}, ${this.y})`;
  }
}

export class InvalidEdgeConstructorError extends Error {
  constructor(
    public x: number,
    public y: number,
    message: string = `Invalid arguments for Edge constructor. Got: ${x}, ${y}`
  ) {
    super(message);
    this.name = "InvalidEdgeConstructorError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidEdgeConstructorError);
    }
  }
}
