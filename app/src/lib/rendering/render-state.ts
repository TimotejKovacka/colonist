import { Edge } from "../coordinate-system/edge";
import { Hex } from "../coordinate-system/hex";
import { Point } from "../coordinate-system/point";
import { Vertex } from "../coordinate-system/vertex";
import { PlaneDimensions, Building } from "../types";

export class RenderState {
  private _pan = {
    isPanning: false,
    start: new Point(0, 0),
    offset: new Point(0, 0),
  };
  private _canvas: HTMLCanvasElement | null = null;
  private _centerOffset: Point = new Point(0, 0);

  constructor(
    readonly boardDimensions: PlaneDimensions,
    readonly hexDimensions: PlaneDimensions
  ) {}

  selectedEdge: Edge | null = null;
  hoveredHex: Hex | null = null;
  selectedVertex: Vertex | null = null;
  buildingType: Building = Building.None;

  initialize(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._centerOffset = new Point({
      x:
        canvas.width / 2 -
        (this.boardDimensions.width / 2) * this.hexDimensions.width,
      y:
        canvas.height / 2 -
        (this.boardDimensions.height / 2) *
          ((3 / 4) * this.hexDimensions.height),
    });
  }

  resetPan() {
    this._pan = {
      isPanning: false,
      start: new Point(0, 0),
      offset: new Point(0, 0),
    };
  }

  get pan() {
    return this._pan;
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
