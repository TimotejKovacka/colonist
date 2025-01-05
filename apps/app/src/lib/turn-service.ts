import { DiceService } from "./dice.service";
import type { GameState } from "./game-state";
import type { ResourceDistributionService } from "./resource-distribution.service";

export class TurnService {
  private readonly diceService = new DiceService();

  constructor(
    private readonly gameState: GameState,
    private readonly resourceDistributionService: ResourceDistributionService
  ) {}

  startTurn() {
    console.log("Starting turn");
    this.gameState.updateTurnState("start");
  }

  endTurn() {
    console.log("Ending turn");
    this.gameState.updateTurnState("end");
  }

  handleDiceRoll() {
    const diceRoll = this.diceService.rollDice();

    if (diceRoll === 7) {
      this.resourceDistributionService.handleRobberEffects();
    } else {
      this.resourceDistributionService.distributeToPlayers(diceRoll);
    }
  }
}
