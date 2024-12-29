import { Coordinates } from "../types";
import { Hex } from "./hex";
import { Point } from "./point";

export class Vertex extends Point {
  static fromCube(h: Hex): Vertex[] {
    const offset = -1;
    const col: number = h.q + (h.r + offset * (h.r & 1)) / 2;
    const row: number = h.r;
    const midway = new Point({
      x: col * 2 + 1 + (row % 2),
      y: row * 3 + 2,
    });

    return [
      new Vertex(midway.add({ x: 1, y: -1 })),
      new Vertex(midway.add({ x: 0, y: -2 })),
      new Vertex(midway.add({ x: -1, y: -1 })),
      new Vertex(midway.add({ x: -1, y: 1 })),
      new Vertex(midway.add({ x: 0, y: 2 })),
      new Vertex(midway.add({ x: 1, y: 1 })),
    ];
  }

  constructor(coords: Coordinates) {
    // TODO(now): Validate coords
    super(coords);
  }

  neighbours(): Vertex[] {
    const isPointy = this.y % 3 == 0;
    if (isPointy) {
      return [
        // top
        new Vertex({
          x: this.x,
          y: this.y - 2,
        }),
        // left
        new Vertex({
          x: this.x - 1,
          y: this.y + 1,
        }),
        // right
        new Vertex({
          x: this.x + 1,
          y: this.y + 1,
        }),
      ];
    }
    return [
      // right
      new Vertex({
        x: this.x + 1,
        y: this.y - 1,
      }),
      // left
      new Vertex({
        x: this.x - 1,
        y: this.y - 1,
      }),
      // bottom
      new Vertex({
        x: this.x,
        y: this.y + 2,
      }),
    ];
  }

  override toString(): string {
    return `Vertex(${this.x}, ${this.y})`;
  }
}

export class InvalidVertexConstructorError extends Error {
  constructor(
    public x: number,
    public y: number,
    message: string = `Invalid arguments for Vertex constructor. Got: ${x}, ${y}`
  ) {
    super(message);
    this.name = "InvalidVertexConstructorError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidVertexConstructorError);
    }
  }
}
