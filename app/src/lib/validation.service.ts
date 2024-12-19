import type { GameState } from "./game-state";
import type { HexHash } from "./types";

export class BoardValidationService {
  constructor(private readonly gameState: GameState) {}
}
