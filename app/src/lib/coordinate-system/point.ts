import type { Coordinates } from "../types";

export class Point implements Coordinates {
  x: number;
  y: number;

  constructor(x: number | Coordinates, y?: number) {
    if (typeof x === "number" && y !== undefined) {
      this.x = x;
      this.y = y;
    } else if (typeof x === "object" && "x" in x && "y" in x) {
      this.x = x.x;
      this.y = x.y;
    } else {
      throw new Error("Invalid arguments for Point constructor");
    }
  }

  static from(point: Coordinates): Point {
    return new Point(point.x, point.y);
  }

  static distance(point1: Coordinates, point2: Coordinates): number {
    return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
  }

  scale(ratio: number): Point;
  scale(ratio: Coordinates): Point;
  scale(ratio: number | Coordinates): Point {
    if (typeof ratio === "number") {
      return new Point(this.x * ratio, this.y * ratio);
    }
    return new Point(this.x * ratio.x, this.y * ratio.y);
  }

  xScale(ratio: number): Point {
    return new Point(this.x * ratio);
  }

  yScale(ratio: number): Point {
    return new Point(this.x, this.y * ratio);
  }

  add(other: number): Point;
  add(other: Coordinates): Point;
  add(other: number | Coordinates): Point {
    if (typeof other === "number") {
      return new Point(this.x + other, this.y + other);
    }
    return new Point(this.x + other.x, this.y + other.y);
  }

  addX(other: number): Point {
    return new Point(this.x + other, this.y);
  }

  addY(other: number): Point {
    return new Point(this.x, this.y + other);
  }

  minus(other: number): Point;
  minus(other: Coordinates): Point;
  minus(other: number | Coordinates): Point {
    if (typeof other === "number") {
      return new Point(this.x - other, this.y - other);
    }
    return new Point(this.x - other.x, this.y - other.y);
  }

  minusX(other: number): Point {
    return new Point(this.x - other, this.y);
  }

  minusY(other: number): Point {
    return new Point(this.x, this.y - other);
  }

  clone(): Point {
    return new Point(this.x, this.y);
  }

  toString(): string {
    return `Point(${this.x}, ${this.y})`;
  }
}
