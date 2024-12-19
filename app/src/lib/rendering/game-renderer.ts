import { SPRITE_DEFINITIONS } from "../constants";
import { HexPoint } from "../coordinate-system/hex-point";
import { DrawingService } from "./drawing.service";
import type { GameState } from "../game-state";
import { DebugRenderer } from "./debug-renderer";
import { RenderEventHandlers } from "./event-handlers";
import { RenderState } from "./render-state";
import type { Sprite, SpriteName } from "../types";
import { getBoardToCanvasCenterOffset, getVertexPosition } from "../utils";

const DEBUG = 1;

export class GameRenderer {
  readonly sprites: Map<SpriteName, Sprite> = new Map(
    Object.entries(SPRITE_DEFINITIONS)
  ) as Map<SpriteName, Sprite>;

  private canvas: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;

  private readonly drawingService: DrawingService;
  private readonly debugService: DebugRenderer;
  private readonly state: RenderState;
  private readonly events: RenderEventHandlers;

  constructor(private readonly gameState: GameState) {
    this.state = new RenderState();
    this.drawingService = new DrawingService();
    this.debugService = new DebugRenderer(
      gameState,
      this.state,
      this.drawingService
    );
    this.events = new RenderEventHandlers(
      this.state,
      () => this.render(),
      gameState
    );

    this.setupGameStateListeners();
  }

  get isInit(): boolean {
    return Boolean(this.drawingService.isInit);
  }

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2D context from canvas");
    }

    this.state.initialize(canvas);
    this.state.centerOffset = getBoardToCanvasCenterOffset(
      canvas.width,
      canvas.height
    );
    await this.loadAssets(canvas, ctx);
    this.events.attachPersistentListeners(canvas);

    this.render();
  }

  private async loadAssets(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ): Promise<void> {
    const spriteSheet = new Image();
    spriteSheet.src = "/CATAN.webp";

    await new Promise<void>((resolve, reject) => {
      spriteSheet.onload = () => {
        this.drawingService.initialize({
          canvas,
          ctx,
          spriteSheet,
        });
        resolve();
      };
      spriteSheet.onerror = () => {
        reject(new Error("Failed to load sprite sheet"));
      };
    });
  }

  private render(): void {
    if (!this.isInit) return;

    this.drawingService.drawCanvasBackround();

    this.drawingService.drawBoard(this.gameState.board, this.state.offset);
    if (DEBUG) {
      // this.drawingService.drawAvailableBuildingSpots(
      //   this.gameState.playerAvailableVertices,
      //   this.state.offset
      // );
      // this.debugService.drawVertices(this.state.offset);
      this.debugService.drawGrid(this.state.offset);
      this.debugService.drawEdges(
        this.gameState.playerAvailableEdges,
        this.state.offset
      );
    }
    this.drawingService.drawGamePieces(this.gameState.board, this.state.offset);

    if (this.state.hoveredHex) {
      this.drawingService.drawSprite("robber", this.state.hoveredHex);
    }

    if (this.state.selectedEdge) {
      this.drawingService.drawRoad(
        {
          hex: this.state.selectedEdge,
          vertexIndex: this.state.selectedEdge.vertex,
        },
        "red",
        this.state.offset
      );
    }

    if (this.state.selectedVertex && this.state.buildingType) {
      const hexPos = new HexPoint(this.state.selectedVertex, this.state.offset);
      const vertexPos = getVertexPosition(
        hexPos,
        this.state.selectedVertex.vertex
      );
      // Use a placeholder player color for preview
      this.drawingService.drawPlayerGamePiece(
        vertexPos,
        this.state.buildingType,
        "red"
      );
    }
  }

  centerBoard(): void {
    if (!this.isInit) return;
    this.state.resetPan();
    this.render();
  }

  cleanup = (): void => {
    console.log("Cleaning up");
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.events.detachPersistentListeners(this.canvas);
    // this.detachToggleableListeners();
  };

  private setupGameStateListeners() {
    this.gameState.on("turnPhaseChange", (phase) => {
      if (phase === "start") {
        if (this.canvas === null) {
          throw new Error("Canvas is not available");
        }
        // this.attachToggleableListeners();
        this.events.attachTransientListeners(this.canvas);
      } else {
        // this.detachToggleableListeners();
        this.events.detachTransientListeners(this.canvas);
        this.render();
      }
    });
  }
}
