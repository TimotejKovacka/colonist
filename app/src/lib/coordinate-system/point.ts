import type { Coordinates } from "../types";

export class Point2D implements Coordinates {
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
      throw new Error("Invalid arguments for Point2D constructor");
    }
  }

  static from(point: Coordinates): Point2D {
    return new Point2D(point.x, point.y);
  }

  static distance(point1: Coordinates, point2: Coordinates): number {
    return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
  }

  scale(ratio: number): Point2D;
  scale(ratio: Coordinates): Point2D;
  scale(ratio: number | Coordinates): Point2D {
    if (typeof ratio === "number") {
      return new Point2D(this.x * ratio, this.y * ratio);
    }
    return new Point2D(this.x * ratio.x, this.y * ratio.y);
  }

  xScale(ratio: number): Point2D {
    return new Point2D(this.x * ratio);
  }

  yScale(ratio: number): Point2D {
    return new Point2D(this.x, this.y * ratio);
  }

  add(other: number): Point2D;
  add(other: Coordinates): Point2D;
  add(other: number | Coordinates): Point2D {
    if (typeof other === "number") {
      return new Point2D(this.x + other, this.y + other);
    }
    return new Point2D(this.x + other.x, this.y + other.y);
  }

  addX(other: number): Point2D {
    return new Point2D(this.x + other, this.y);
  }

  addY(other: number): Point2D {
    return new Point2D(this.x, this.y + other);
  }

  minus(other: number): Point2D;
  minus(other: Coordinates): Point2D;
  minus(other: number | Coordinates): Point2D {
    if (typeof other === "number") {
      return new Point2D(this.x - other, this.y - other);
    }
    return new Point2D(this.x - other.x, this.y - other.y);
  }

  minusX(other: number): Point2D {
    return new Point2D(this.x - other, this.y);
  }

  minusY(other: number): Point2D {
    return new Point2D(this.x, this.y - other);
  }

  clone(): Point2D {
    return new Point2D(this.x, this.y);
  }

  toString(): string {
    return `Point2D(${this.x}, ${this.y})`;
  }
}
