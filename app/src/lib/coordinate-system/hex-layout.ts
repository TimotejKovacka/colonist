import {
  HEX_CENTER_OFFSET,
  HEX_HALF_HEIGHT,
  HEX_HALF_WIDTH,
} from "../constants";
import { Edge } from "./edge";
import { Hex } from "./hex";
import { Orientation } from "./orientation";
import { Point } from "./point";
import { Vertex } from "./vertex";

class HexLayout {
  static pointy: Orientation = new Orientation(
    Math.sqrt(3.0),
    Math.sqrt(3.0) / 2.0,
    0.0,
    3.0 / 2.0,
    Math.sqrt(3.0) / 3.0,
    -1.0 / 3.0,
    0.0,
    2.0 / 3.0,
    0.5
  );
  static flat: Orientation = new Orientation(
    3.0 / 2.0,
    0.0,
    Math.sqrt(3.0) / 2.0,
    Math.sqrt(3.0),
    2.0 / 3.0,
    0.0,
    -1.0 / 3.0,
    Math.sqrt(3.0) / 3.0,
    0.0
  );

  constructor(
    public orientation: Orientation,
    public size: Point,
    public origin: Point
  ) {}

  hexToPixel(h: Hex): Point {
    const M: Orientation = this.orientation;
    return new Point({
      x: M.f0 * h.q + M.f1 * h.r,
      y: M.f2 * h.q + M.f3 * h.r,
    })
      .scale(this.size)
      .add(this.origin);
  }

  pixelToHex(p: Point): Hex {
    const M: Orientation = this.orientation;
    const size: Point = this.size;
    const origin: Point = this.origin;
    const pt: Point = new Point(
      (p.x - origin.x) / size.x,
      (p.y - origin.y) / size.y
    );
    const q: number = M.b0 * pt.x + M.b1 * pt.y;
    const r: number = M.b2 * pt.x + M.b3 * pt.y;
    return new Hex(q, r, -q - r);
  }

  hexCornerOffset(corner: number): Point {
    const M: Orientation = this.orientation;
    const angle: number = (2.0 * Math.PI * (M.start_angle - corner)) / 6.0;
    return new Point({
      x: Math.cos(angle),
      y: Math.sin(angle),
    })
      .scale(this.size)
      .add(HEX_CENTER_OFFSET);
  }

  polygonCorners(h: Hex): Point[] {
    const corners: Point[] = [];
    const center: Point = this.hexToPixel(h);
    for (let i = 0; i < 6; i++) {
      corners.push(center.add(this.hexCornerOffset(i)));
    }
    return corners;
  }

  // hexToEdges(h: Hex): Edge[] {
  //   // const offset = new Point({
  //   //   x: h.q * 3 + (h.r % 2),
  //   //   y: h.r * 4,
  //   // });
  //   const offset = new Point({
  //     x: h.q * 4,
  //     y: h.r * 3 + (h.q % 2),
  //   });

  //   return [
  //     new Edge(offset.add({ x: 2, y: 1 })),
  //     new Edge(offset.add({ x: 1, y: 0 })),
  //     new Edge(offset.add({ x: 0, y: 1 })),
  //     new Edge(offset.add({ x: 0, y: 3 })),
  //     new Edge(offset.add({ x: 1, y: 4 })),
  //     new Edge(offset.add({ x: 1, y: 3 })),
  //   ];
  // }
}

export const HEX_LAYOUT = new HexLayout(
  HexLayout.pointy,
  new Point(HEX_HALF_WIDTH, HEX_HALF_HEIGHT),
  new Point(0, 0)
);
