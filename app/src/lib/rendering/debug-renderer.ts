import { HexPoint } from "../coordinate-system/hex-point";
import type { DrawingService } from "./drawing.service";
import type { GameState } from "../game-state";
import type { Coordinates, HexagonVerticeIndex, HexHash } from "../types";
import { assertHexHash, getVertexPosition, parseHexHash } from "../utils";
import type { RenderState } from "./render-state";

export class DebugRenderer {
  private readonly hexPositions: Array<[number, number]>;
  constructor(
    private readonly gameState: GameState,
    private readonly renderState: RenderState,
    private readonly drawingService: DrawingService
  ) {
    this.hexPositions = Object.keys(this.gameState.board).map((hash) => {
      assertHexHash(hash);
      return parseHexHash(hash);
    });
  }

  drawVertices(offset: Coordinates): void {
    // all hex positions, it should only get those that are valid
    for (const [row, col] of this.hexPositions) {
      const hexPos = new HexPoint(row, col, offset);

      // Draw all vertices
      for (let vertexI = 0; vertexI < 6; vertexI++) {
        const vertexPos = getVertexPosition(hexPos, vertexI);
        const vertex = this.renderState.selectedVertex;
        // Make selected vertex larger and different color
        if (
          vertex &&
          vertex.row === row &&
          vertex.col === col &&
          vertex.vertex === vertexI
        ) {
          this.drawingService.drawDebugCircle(vertexPos, 30);
          this.drawingService.drawCoordinateText(vertexPos, vertexI.toString());
        } else {
          this.drawingService.drawDebugCircle(vertexPos, 15);
          this.drawingService.drawCoordinateText(vertexPos, vertexI.toString());
        }
      }
    }
  }
  drawEdges(
    positions: Array<[HexHash, HexagonVerticeIndex]>,
    offset: Coordinates
  ): void {
    for (const [hash, vertexI] of positions) {
      const [row, col] = parseHexHash(hash);
      const hexPos = new HexPoint(row, col, offset);
      const vertexPos1 = getVertexPosition(hexPos, vertexI);
      const vertexPos2 = getVertexPosition(hexPos, (vertexI + 1) % 6);
      const edgeMidpoint = {
        x: (vertexPos1.x + vertexPos2.x) / 2,
        y: (vertexPos1.y + vertexPos2.y) / 2,
      };
      const vertex = this.renderState.selectedVertex;
      // Make selected vertex larger and different color
      if (
        vertex &&
        vertex.row === row &&
        vertex.col === col &&
        vertex.vertex === vertexI
      ) {
        this.drawingService.drawDebugCircle(edgeMidpoint, 30);
        this.drawingService.drawCoordinateText(
          edgeMidpoint,
          vertexI.toString()
        );
      } else {
        this.drawingService.drawDebugCircle(edgeMidpoint, 15);
        this.drawingService.drawCoordinateText(
          edgeMidpoint,
          vertexI.toString()
        );
      }
    }
  }
  drawGrid(offset: Coordinates): void {
    for (const [row, col] of this.hexPositions) {
      const hexPos = new HexPoint(row, col, offset);
      this.drawingService.drawHexagonPath(hexPos);
      this.drawingService.drawCoordinateText(hexPos, `${row}-${col}`);
    }
  }
}
