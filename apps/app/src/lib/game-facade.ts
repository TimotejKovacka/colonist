import { GameRenderer } from "./rendering/game-renderer";
import { GameState } from "./game-state";
import { ResourceDistributionService } from "./resource-distribution.service";
import { TurnService } from "./turn-service";
import { BoardValidationService } from "./validation.service";
import { ApiBoard } from "./types";

export class GameFacade {
  readonly gameState: GameState;
  readonly turnService: TurnService;
  readonly gameRenderer: GameRenderer;
  readonly validationService: BoardValidationService;

  constructor({ board }: { board: ApiBoard }) {
    this.gameState = new GameState({ board, playerColor: "red" });
    this.validationService = new BoardValidationService(this.gameState);
    this.turnService = new TurnService(
      this.gameState,
      new ResourceDistributionService(this.gameState)
    );
    this.gameRenderer = new GameRenderer(this.gameState, board.hex);
  }

  async initialize(canvas: HTMLCanvasElement) {
    await this.gameRenderer.initialize(canvas);
  }

  async cleanup() {
    this.gameRenderer.cleanup();
  }

  centerUI() {
    this.gameRenderer.centerBoard();
  }
}
