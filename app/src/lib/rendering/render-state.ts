import type { HexPoint } from "../coordinate-system/hex-point";
import { Point2D } from "../coordinate-system/point";
import type { Coordinates, HexagonVerticeIndex } from "../types";

export class RenderState {
  private _pan = {
    isPanning: false,
    start: new Point2D(0, 0),
    offset: new Point2D(0, 0),
  };
  private _canvas: HTMLCanvasElement | null = null;
  private _centerOffset: Point2D = new Point2D(0, 0);

  selectedEdge: {
    row: number;
    col: number;
    vertex: HexagonVerticeIndex;
  } | null = null;
  hoveredHex: HexPoint | null = null;
  selectedVertex: { row: number; col: number; vertex: number } | null = null;
  buildingType: "settlement" | "city" | null = "settlement";

  initialize(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
  }

  resetPan() {
    this._pan = {
      isPanning: false,
      start: new Point2D(0, 0),
      offset: new Point2D(0, 0),
    };
  }

  get pan() {
    return this._pan;
  }

  set centerOffset(coordinates: Coordinates) {
    this._centerOffset = Point2D.from(coordinates);
  }

  get canvas(): HTMLCanvasElement {
    if (this._canvas === null) {
      throw new Error("Canvas is not available");
    }

    return this._canvas;
  }

  get offset() {
    return this._centerOffset.add(this.pan.offset);
  }
}
