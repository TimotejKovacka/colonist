import {
  assertHexHash,
  assertHexVerticeIndex,
  getVertexPosition,
  parseHexHash,
} from "@/lib/utils";
import type { RenderState } from "../render-state";
import type { GameState } from "@/lib/game-state";
import type { Coordinates } from "@/lib/types";
import { HexPoint } from "@/lib/coordinate-system/hex-point";
import { Point } from "@/lib/coordinate-system/point";
import { Hex } from "@/lib/coordinate-system/hex";
import { HEX_LAYOUT } from "@/lib/coordinate-system/hex-layout";

export class TransientEventHandlers {
  private readonly hexPositions: Array<[number, number]>;
  constructor(
    private readonly renderState: RenderState,
    private readonly renderCb: () => void,
    private readonly gameState: GameState
  ) {
    this.hexPositions = Object.keys(this.gameState.board).map((hash) => {
      assertHexHash(hash);
      return parseHexHash(hash);
    });
  }

  handleVertexHover = (e: MouseEvent) => {
    if (!this.renderState.buildingType) return;

    const rect = this.renderState.canvas.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    let foundVertex = false;
    for (const [hash, index] of this.gameState.playerAvailableVertices) {
      const [row, col] = parseHexHash(hash);
      const vertexOffset = HEX_LAYOUT.hexCornerOffset(index);
      const hex = new Hex(col, row);
      const hexPos = HEX_LAYOUT.hexToPixel(hex).add(this.renderState.offset);
      const vertexPos = hexPos.add(vertexOffset);
      const distance = Point.distance(mousePos, vertexPos);
      if (distance < 20) {
        foundVertex = true;
        const vertex = this.renderState.selectedVertex;
        if (
          !vertex ||
          vertex.row !== row ||
          vertex.col !== col ||
          vertex.vertex !== index
        ) {
          this.renderState.selectedVertex = { row, col, vertex: index };
          this.renderCb();
        }
        break;
      }
      if (foundVertex) break;
    }

    if (!foundVertex && this.renderState.selectedVertex) {
      this.renderState.selectedVertex = null;
      this.renderCb();
    }
  };

  handleVertexClick = () => {
    if (!this.renderState.selectedVertex || !this.renderState.buildingType)
      return;

    this.gameState.updateBoardState(
      new HexPoint(this.renderState.selectedVertex).toHash(),
      {
        vertices: {
          [this.renderState.selectedVertex.vertex]: {
            [this.renderState.buildingType]: "red",
          },
        },
      }
    );
  };

  handleEdgeHover = (e: MouseEvent) => {
    if (!this.renderState.buildingType) return;

    const rect = this.renderState.canvas.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    this.checkEdgeHover(mousePos, this.renderState.offset);
  };

  handleEdgeClick = () => {
    if (!this.renderState.selectedEdge) return;

    this.gameState.updateBoardState(
      new HexPoint(this.renderState.selectedEdge).toHash(),
      {
        vertices: {
          [this.renderState.selectedEdge.vertex]: {
            road: "red",
          },
        },
      }
    );
  };

  handleHexHover = (e: MouseEvent) => {
    const rect = this.renderState.canvas.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    this.checkHexHover(mousePos, this.renderState.offset);
  };

  handleHexClick = () => {
    if (!this.renderState.hoveredHex) return;

    const hexHash = new HexPoint(
      this.renderState.hoveredHex.row,
      this.renderState.hoveredHex.col
    ).toHash();

    this.gameState.updateBoardState(hexHash, "robber");
    this.renderCb();
  };

  private checkHexHover(mousePos: Coordinates, offset: Coordinates): void {
    let foundHex = false;

    for (const [row, col] of this.hexPositions) {
      const hexPos = new HexPoint(row, col, offset);
      const distance = hexPos.distanceTo(mousePos);

      if (distance < 32) {
        foundHex = true;
        if (
          !this.renderState.hoveredHex ||
          this.renderState.hoveredHex.row !== row ||
          this.renderState.hoveredHex.col !== col
        ) {
          this.renderState.hoveredHex = hexPos;
          this.renderCb();
        }
        break;
      }
    }

    if (!foundHex && this.renderState.hoveredHex) {
      this.renderState.hoveredHex = null;
      this.renderCb();
    }
  }

  private checkEdgeHover(mousePos: Coordinates, offset: Coordinates): void {
    let foundEdge = false;
    for (const [hash, vertexI] of this.gameState.playerAvailableEdges) {
      const [row, col] = parseHexHash(hash);
      const hexPos = new HexPoint(row, col, offset);
      const vertexPos1 = getVertexPosition(hexPos, vertexI);
      const vertexPos2 = getVertexPosition(hexPos, (vertexI + 1) % 6);
      const edgeMidpoint = {
        x: (vertexPos1.x + vertexPos2.x) / 2,
        y: (vertexPos1.y + vertexPos2.y) / 2,
      };
      const distance = Point.distance(mousePos, edgeMidpoint);
      if (distance < 20) {
        foundEdge = true;
        if (
          !this.renderState.selectedEdge ||
          this.renderState.selectedEdge.row !== row ||
          this.renderState.selectedEdge.col !== col ||
          this.renderState.selectedEdge.vertex !== vertexI
        ) {
          assertHexVerticeIndex(vertexI);
          this.renderState.selectedEdge = { row, col, vertex: vertexI };
          this.renderCb();
        }
        break;
      }
    }

    if (!foundEdge && this.renderState.selectedEdge) {
      this.renderState.selectedEdge = null;
      this.renderCb();
    }
  }
}
