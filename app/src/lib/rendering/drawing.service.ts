import { DIMENSIONS, SPRITES } from "../constants";
import { HexPoint } from "../coordinate-system/hex-point";
import { Point2D } from "../coordinate-system/point";
import type {
  Coordinates,
  VertexCoordinates,
  PlayerColor,
  SpriteName,
  DiceCombination,
  GameBoard,
  HexHash,
  HexagonVerticeIndex,
} from "../types";
import {
  assertHexVerticeIndex,
  getEdgePosition,
  getEdgeRotation,
  getGamePieceName,
  getVertexPosition,
  parseHexHash,
} from "../utils";

export class DrawingService {
  private spriteSheet: HTMLImageElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private scale = 1;

  get isInit(): boolean {
    return Boolean(this.isCanvasReady() && this.spriteSheet);
  }

  initialize({
    canvas,
    ctx,
    spriteSheet,
  }: {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    spriteSheet: HTMLImageElement;
  }) {
    this.spriteSheet = spriteSheet;
    this.canvas = canvas;
    this.ctx = ctx;
  }

  private getCanvasContext(): {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
  } {
    if (!this.ctx || !this.canvas) {
      throw new Error("Canvas or context not initialized");
    }
    return { ctx: this.ctx, canvas: this.canvas };
  }

  private isCanvasReady(): boolean {
    return Boolean(this.ctx && this.canvas);
  }

  drawCanvasBackround(): void {
    const { canvas, ctx } = this.getCanvasContext();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawBoard(board: GameBoard, offset: Coordinates): void {
    if (!this.isCanvasReady()) return;

    for (const [hash, hexState] of Object.entries(board)) {
      const hexName = `hex_${hexState.resource}` as SpriteName;
      const [row, col] = parseHexHash(hash);
      const pos = new Point2D(new HexPoint(row, col, offset)).scale(this.scale);
      this.drawSprite(hexName, pos);
    }
  }

  drawGamePieces(board: GameBoard, offset: Coordinates): void {
    if (!this.isCanvasReady()) return;

    for (const [hash, hexState] of Object.entries(board)) {
      // render game pieces (robber, road, settlement, city)
      const [row, col] = parseHexHash(hash);
      const hexPos = new HexPoint(row, col, offset);

      // if (hexState.robber) {
      //   this.drawSprite("robber", hexPos);
      // }

      for (const [vertex, vertexState] of Object.entries(hexState.vertices)) {
        const vertexIndex = Number(vertex);
        assertHexVerticeIndex(vertexIndex);
        const vertexPos = getVertexPosition(hexPos, vertexIndex);

        // Draw settlement/city
        if (vertexState.city) {
          this.drawPlayerGamePiece(vertexPos, "city", vertexState.city);
        } else if (vertexState.settlement) {
          this.drawPlayerGamePiece(
            vertexPos,
            "settlement",
            vertexState.settlement
          );
        }

        // Draw road if present
        if (vertexState.road) {
          this.drawRoad(
            { hex: { row, col }, vertexIndex },
            vertexState.road,
            offset
          );
        }
      }

      this.drawHexNumber(hexPos, hexState.diceVal);
    }
  }

  drawSprite(spriteName: SpriteName, coords: Coordinates, rotation = 0): void {
    if (!this.isCanvasReady() || !this.spriteSheet) return;
    const { ctx } = this.getCanvasContext();

    const sprite = SPRITES.get(spriteName);
    if (!sprite) {
      throw new Error(`Sprite "${spriteName}" not found`);
    }

    ctx.save();

    ctx.translate(coords.x, coords.y);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.drawImage(
      this.spriteSheet,
      sprite.x,
      sprite.y,
      sprite.width,
      sprite.height,
      -sprite.width / 2,
      -sprite.height / 2,
      sprite.width / this.scale,
      sprite.height / this.scale
    );

    ctx.restore();
  }

  drawCoordinateText(pos: Coordinates, text: string): void {
    const { ctx } = this.getCanvasContext();
    ctx.fillStyle = "black";
    ctx.fillText(text, pos.x - 10, pos.y);
  }

  drawHexHover(row: number, col: number, offset: Coordinates): void {
    if (!this.isCanvasReady()) return;
    const { ctx } = this.getCanvasContext();
    const hexPos = new HexPoint(row, col, offset);

    ctx.save();

    // Draw hover effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";

    // Draw hexagon path
    this.drawHexagonPath(hexPos);
    ctx.fill();

    // Draw text in the middle of the hex
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${row},${col}`, hexPos.x, hexPos.y);

    ctx.restore();
  }

  drawHexagonPath(start: Coordinates): void {
    const { ctx } = this.getCanvasContext();

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 + 30) * (Math.PI / 180);
      const newPoint = new Point2D(start).add({
        x: (DIMENSIONS.HEX.WIDTH / 1.75) * Math.cos(angle),
        y: (DIMENSIONS.HEX.HEIGHT / 2) * Math.sin(angle),
      });

      if (i === 0) ctx.moveTo(newPoint.x, newPoint.y);
      else ctx.lineTo(newPoint.x, newPoint.y);
    }
    ctx.closePath();
  }

  drawPlayerGamePiece(
    hexPos: Coordinates,
    type: "settlement" | "city",
    player: PlayerColor
  ): void {
    if (!this.isInit) return;
    const spriteName = getGamePieceName(type, player);

    this.drawSprite(spriteName, hexPos);
  }

  drawRoad(
    edge: VertexCoordinates,
    player: PlayerColor,
    offset: Coordinates = { x: 0, y: 0 }
  ): void {
    const spriteName = `road_${player}` as SpriteName;
    const pos = new Point2D(getEdgePosition(edge)).add(offset);
    const rotation = getEdgeRotation(edge);

    this.drawSprite(spriteName, pos, rotation);
  }

  drawHexNumber(hexPos: Coordinates, hexNumber: DiceCombination) {
    const pos = new Point2D(hexPos).addY(64);

    this.drawSprite(hexNumber.toString() as SpriteName, pos);
  }

  drawDebugCircle(pos: Coordinates, radius = 5): void {
    if (!this.isCanvasReady()) return;
    const { ctx } = this.getCanvasContext();

    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fill();
    ctx.restore();
  }

  drawDebugLine(start: Coordinates, end: Coordinates): void {
    if (!this.isCanvasReady()) return;
    const { ctx } = this.getCanvasContext();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 10; // Set the line width
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke(); // Actually draw the line
    ctx.restore();
  }

  drawAvailableBuildingSpots(
    spots: Array<[HexHash, HexagonVerticeIndex]>,
    offset: Coordinates
  ): void {
    if (!this.isCanvasReady()) return;
    const { ctx } = this.getCanvasContext();
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    for (const [hash, index] of spots) {
      const [row, col] = parseHexHash(hash);
      const hexPos = new HexPoint(row, col, offset);
      const vertexPos = getVertexPosition(hexPos, index);

      ctx.beginPath();
      ctx.arc(vertexPos.x, vertexPos.y, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
