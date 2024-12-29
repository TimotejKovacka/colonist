import { SPRITE_DEFINITIONS } from "../constants";
import { DrawingService } from "./drawing.service";
import type { GameState } from "../game-state";
import { DebugRenderer } from "./debug-renderer";
import { RenderEventHandlers } from "./event-handlers";
import { RenderState } from "./render-state";
import type { PlaneDimensions, Sprite, SpriteName } from "../types";
import { HEX_LAYOUT } from "../coordinate-system/hex-layout";

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

  constructor(
    private readonly gameState: GameState,
    hexDimensions: PlaneDimensions
  ) {
    this.state = new RenderState(
      this.gameState.board.dimensions,
      hexDimensions
    );
    this.drawingService = new DrawingService(this.sprites);
    this.debugService = new DebugRenderer(this.drawingService);
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

  render(): void {
    if (!this.isInit) return;

    this.drawingService.drawCanvasBackround();
    this.drawingService.drawBoard(
      this.gameState.board.hexes,
      this.state.offset
    );

    this.gameState.occupiedBuildingSpots.forEach((v) =>
      this.drawingService.drawBuilding(
        v,
        this.state.offset,
        v.building,
        v.ownedBy
      )
    );

    this.drawingService.drawAvailableBuildingSpots(
      this.gameState.getAvailableBuildingSpots(),
      this.state.offset
    );

    this.drawingService.drawAvailableRoadSpots(
      this.gameState.getAvailableRoadSpots(),
      this.state.offset
    );

    if (this.state.selectedVertex) {
      this.drawingService.drawBuilding(
        this.state.selectedVertex,
        this.state.offset,
        this.state.buildingType ?? this.gameState.placingBuilding,
        this.gameState.playerColor
      );
    }

    if (this.state.selectedEdge) {
      this.drawingService.drawRoad(
        this.state.selectedEdge,
        this.gameState.playerColor,
        this.state.offset
      );
    }

    // this.debugService.drawVertexGrid(this.state.offset);
    // this.debugService.drawEdgeGrid(this.state.offset);
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
