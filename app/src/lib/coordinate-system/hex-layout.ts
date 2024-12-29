import { HEX_CENTER_OFFSET } from "../constants";
import { Edge } from "./edge";
import { Hex } from "./hex";
import { Orientation } from "./orientation";
import { Point } from "./point";
import { Vertex } from "./vertex";

class HexLayout {
  static pointy: Orientation = new Orientation(
    Math.sqrt(3.0), // f0
    Math.sqrt(3.0) / 2.0, // f1
    0.0, // f2
    3.0 / 2.0, // f3
    Math.sqrt(3.0) / 3.0, // b0
    -1.0 / 3.0, // b1
    0.0, // b2
    2.0 / 3.0, // b3
    0.5 // angle
  );

  constructor(
    public orientation: Orientation,
    public size: Point,
    public origin: Point
  ) {}

  /**
   * [f0, f2] * [x]
   * [f1, f3]   [y]
   */
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
    const pt: Point = p.minus(this.origin).scale(this.size);
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

  vertexToPixel(v: Vertex): Point {
    const M = this.orientation;
    return new Point(v.x * M.f1, v.y / 2).scale(this.size);
  }

  pixelToVertex(p: Point): Vertex {
    const M = this.orientation;
    return new Vertex({
      x: Math.round(p.x / this.size.x / M.f1),
      y: Math.round((p.y / this.size.y) * 2),
    });
  }

  edgeToPixel(e: Edge): Point {
    const M = this.orientation;
    const size = this.size;
    const xScale = (M.f1 / 2) * size.x;
    const yOffset = size.y / 4;
    const yScale = yOffset * 3;
    return new Point(e.x * xScale, e.y * yScale + yOffset);
  }

  pixelToEdge(p: Point): Edge {
    const M = this.orientation;
    const size = this.size;
    const xScale = (M.f1 / 2) * size.x;
    const yOffset = size.y / 4;
    const yScale = yOffset * 3;
    return new Edge({
      x: Math.round(p.x / xScale),
      y: Math.round((p.y - yOffset) / yScale),
    });
  }
}

export const HEX_LAYOUT = new HexLayout(
  HexLayout.pointy,
  new Point(128, 128),
  new Point(0, 0)
);
