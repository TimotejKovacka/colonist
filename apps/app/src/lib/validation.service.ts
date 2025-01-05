import type { GameState } from "./game-state";
import type { CoordinatesHash } from "./types";

export class BoardValidationService {
  constructor(private readonly gameState: GameState) {}
}
