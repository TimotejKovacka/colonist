import { Point } from "./point";

export class GridLayout {
  constructor(public size: Point, public origin: Point) {}

  pointToPixel(p: Point): Point {
    return p.scale(this.size).add(this.origin);
  }
}
