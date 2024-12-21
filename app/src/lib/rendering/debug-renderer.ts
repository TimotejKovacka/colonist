import { HexPoint } from "../coordinate-system/hex-point";
import type { DrawingService } from "./drawing.service";
import type { GameState } from "../game-state";
import type { Coordinates, HexStateIndex, HexHash } from "../types";
import { assertHexHash, getVertexPosition, parseHexHash } from "../utils";
import type { RenderState } from "./render-state";
import { Hex } from "../coordinate-system/hex";
import { HEX_LAYOUT } from "../coordinate-system/hex-layout";
import {
  DEFAULT_VERTICES,
  DIMENSIONS,
  EDGE_X_UNIT,
  EDGE_Y_UNIT,
  VERTEX_X_UNIT,
  VERTEX_Y_UNIT,
} from "../constants";
import { Point } from "../coordinate-system/point";

export class DebugRenderer {
  private readonly hexes: Hex[];
  constructor(
    private readonly gameState: GameState,
    private readonly renderState: RenderState,
    private readonly drawingService: DrawingService
  ) {
    this.hexes = Object.values(gameState.board);
  }

  drawVertexGrid(): void {
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
      this.drawingService.drawDebugLine(start, end);
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
      this.drawingService.drawDebugLine(start, end);
    }
  }

  drawEdgeGrid(): void {
    const color = "rgba(0, 0, 255, 0.5)";
    const offset = new Point({
      x: 0,
      y: DIMENSIONS.HEX.HEIGHT / 8,
    });
    const xLines = Math.round(1200 / EDGE_X_UNIT);
    for (let i = 0; i < xLines; i++) {
      const start = new Point({
        x: EDGE_X_UNIT * i,
        y: 0,
      }).add(offset);
      const end = new Point({
        x: EDGE_X_UNIT * i,
        y: 1200,
      }).add(offset);
      this.drawingService.drawDebugLine(start, end, color);
    }
    const yLines = Math.round(1200 / EDGE_Y_UNIT);
    for (let i = 0; i < yLines; i++) {
      const start = new Point({
        x: 0,
        y: EDGE_Y_UNIT * i,
      }).add(offset);
      const end = new Point({
        x: 1200,
        y: EDGE_Y_UNIT * i,
      }).add(offset);
      this.drawingService.drawDebugLine(start, end, color);
    }
  }

  drawVertices(offset: Coordinates): void {
    DEFAULT_VERTICES.forEach((v) => {
      this.drawingService.drawDebugCircle(v, 15);
    });
    // HEX_LAYOUT.polygonCorners(new Hex(2, 0)).forEach((corner) => {
    //   this.drawingService.drawDebugCircle(corner.add(offset), 15);
    // });
    // all hex positions, it should only get those that are valid
    // for (const hex of this.hexes) {
    //   // const hexPos = new HexPoint(row, col, offset);
    //   // Draw all vertices
    //   HEX_LAYOUT.polygonCorners(hex).forEach((corner) => {
    //     this.drawingService.drawDebugCircle(corner.add(offset), 15);
    //   });
    // }
  }
  drawEdges(
    positions: Array<[HexHash, HexStateIndex]>,
    offset: Coordinates
  ): void {
    // for (const [hash, vertexI] of positions) {
    //   const [row, col] = parseHexHash(hash);
    //   const hexPos = new HexPoint(row, col, offset);
    //   const vertexPos1 = getVertexPosition(hexPos, vertexI);
    //   const vertexPos2 = getVertexPosition(hexPos, (vertexI + 1) % 6);
    //   const edgeMidpoint = {
    //     x: (vertexPos1.x + vertexPos2.x) / 2,
    //     y: (vertexPos1.y + vertexPos2.y) / 2,
    //   };
    //   const vertex = this.renderState.selectedVertex;
    //   // Make selected vertex larger and different color
    //   if (
    //     vertex &&
    //     vertex.row === row &&
    //     vertex.col === col &&
    //     vertex.vertex === vertexI
    //   ) {
    //     this.drawingService.drawDebugCircle(edgeMidpoint, 30);
    //     this.drawingService.drawCoordinateText(
    //       edgeMidpoint,
    //       vertexI.toString()
    //     );
    //   } else {
    //     this.drawingService.drawDebugCircle(edgeMidpoint, 15);
    //     this.drawingService.drawCoordinateText(
    //       edgeMidpoint,
    //       vertexI.toString()
    //     );
    //   }
    // }
  }
  drawGrid(): void {
    for (const [hash, hex] of Object.entries(this.gameState.board)) {
    }
    // for (const [row, col] of this.hexPositions) {
    //   const hexPos = new HexPoint(row, col, offset);
    //   this.drawingService.drawHexagonPath(hexPos);
    //   this.drawingService.drawCoordinateText(hexPos, `${row}-${col}`);
    // }
  }
}
