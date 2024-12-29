import type { DrawingService } from "./drawing.service";
import type { Coordinates } from "../types";
import {
  DIMENSIONS,
  EDGE_X_UNIT,
  EDGE_Y_UNIT,
  VERTEX_X_UNIT,
  VERTEX_Y_UNIT,
} from "../constants";
import { Point } from "../coordinate-system/point";

export class DebugRenderer {
  constructor(private readonly drawingService: DrawingService) {}

  drawVertexGrid(offset: Coordinates): void {
    const xLines = Math.round(1200 / VERTEX_X_UNIT);
    for (let i = 0; i < xLines; i++) {
      const start = new Point({
        x: VERTEX_X_UNIT * i,
        y: 0,
      });
      const end = new Point({
        x: VERTEX_X_UNIT * i,
        y: 1200,
      });
      this.drawingService.drawDebugLine(start.add(offset), end.add(offset));
    }
    const yLines = Math.round(1200 / VERTEX_Y_UNIT);
    for (let i = 0; i < yLines; i++) {
      const start = new Point({
        x: 0,
        y: VERTEX_Y_UNIT * i,
      });
      const end = new Point({
        x: 1200,
        y: VERTEX_Y_UNIT * i,
      });
      this.drawingService.drawDebugLine(start.add(offset), end.add(offset));
    }
  }

  drawEdgeGrid(offset: Coordinates): void {
    const color = "rgba(0, 0, 255, 0.5)";
    const gridOffset = new Point({
      x: 0,
      y: DIMENSIONS.HEX.HEIGHT / 8,
    });
    const xLines = Math.round(1200 / EDGE_X_UNIT);
    for (let i = 0; i < xLines; i++) {
      const start = new Point({
        x: EDGE_X_UNIT * i,
        y: 0,
      }).add(gridOffset);
      const end = new Point({
        x: EDGE_X_UNIT * i,
        y: 1200,
      }).add(gridOffset);
      this.drawingService.drawDebugLine(
        start.add(offset),
        end.add(offset),
        color
      );
    }
    const yLines = Math.round(1200 / EDGE_Y_UNIT);
    for (let i = 0; i < yLines; i++) {
      const start = new Point({
        x: 0,
        y: EDGE_Y_UNIT * i,
      }).add(gridOffset);
      const end = new Point({
        x: 1200,
        y: EDGE_Y_UNIT * i,
      }).add(gridOffset);
      this.drawingService.drawDebugLine(
        start.add(offset),
        end.add(offset),
        color
      );
    }
  }
}
