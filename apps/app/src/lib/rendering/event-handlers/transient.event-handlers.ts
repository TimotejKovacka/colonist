import type { RenderState } from "../render-state";
import type { GameState } from "@/lib/game-state";
import { Point } from "@/lib/coordinate-system/point";
import { HEX_LAYOUT } from "@/lib/coordinate-system/hex-layout";
import { BoardNotFoundError } from "@/lib/board";
import { Building } from "@/lib/types";

export class TransientEventHandlers {
  constructor(
    private readonly renderState: RenderState,
    private readonly renderCb: () => void,
    private readonly gameState: GameState
  ) {}

  handleVertexHover = (e: MouseEvent) => {
    const rect = this.renderState.canvas.getBoundingClientRect();
    const mousePos = new Point({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }).minus(this.renderState.offset);
    const nearestVertex = HEX_LAYOUT.pixelToVertex(mousePos);
    try {
      const vertex = this.gameState.board.vertex(nearestVertex.hash);
      const vertexPos = HEX_LAYOUT.vertexToPixel(vertex);
      const distance = Point.distance(mousePos, vertexPos);
      if (distance < 20 && this.renderState.buildingType !== Building.City) {
        this.renderState.buildingType = vertex.building + 1;
        this.renderState.selectedVertex = vertex;
      } else {
        this.renderState.selectedVertex = null;
        this.renderState.buildingType = Building.None;
      }

      this.renderCb();
    } catch (err) {
      if (err instanceof BoardNotFoundError && err.type === "vertex") {
        return;
      }
      throw err;
    }
  };

  handleVertexClick = () => {
    if (!this.renderState.selectedVertex || !this.renderState.buildingType)
      return;

    this.gameState.updateVertexState(this.renderState.selectedVertex.hash, {
      building: this.renderState.buildingType,
      player: "red",
    });
  };

  handleEdgeHover = (e: MouseEvent) => {
    if (!this.renderState.buildingType) return;

    const rect = this.renderState.canvas.getBoundingClientRect();
    const mousePos = new Point({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }).minus(this.renderState.offset);
    const nearestEdge = HEX_LAYOUT.pixelToEdge(mousePos);
    try {
      const edge = this.gameState.board.edge(nearestEdge.hash);
      const edgePos = HEX_LAYOUT.edgeToPixel(edge);
      const distance = Point.distance(mousePos, edgePos);
      if (distance < 20) {
        this.renderState.selectedEdge = edge;
      } else {
        this.renderState.selectedEdge = null;
      }
      this.renderCb();
    } catch (err) {
      if (err instanceof BoardNotFoundError && err.type === "edge") {
        return;
      }
      throw err;
    }
  };

  handleEdgeClick = () => {
    if (!this.renderState.selectedEdge) return;

    this.gameState.updateEdgeState(this.renderState.selectedEdge.hash, {
      player: "red",
    });
  };

  handleHexHover = (e: MouseEvent) => {
    const rect = this.renderState.canvas.getBoundingClientRect();
    const mousePos = new Point({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }).minus(this.renderState.offset);

    const nearestHex = HEX_LAYOUT.pixelToHex(mousePos);
    try {
      const hex = this.gameState.board.hex(nearestHex.hash);
      const hexPos = HEX_LAYOUT.hexToPixel(hex);
      const distance = Point.distance(mousePos, hexPos);
      if (distance < 32) {
        this.renderState.hoveredHex = hex;
      } else {
        this.renderState.hoveredHex = null;
      }
      this.renderCb();
    } catch (err) {
      if (err instanceof BoardNotFoundError && err.type === "hex") {
        return;
      }
      throw err;
    }
  };

  handleHexClick = () => {
    if (!this.renderState.hoveredHex) return;

    this.gameState.updateHexState(this.renderState.hoveredHex.hash);
    this.renderCb();
  };
}
