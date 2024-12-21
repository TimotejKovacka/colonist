import { DEFAULT_HEX_YIELD } from "./constants";
import type { GameState } from "./game-state";
import { StatefulHex } from "./state/stateful-hex";
import type {
  DiceCombination,
  GameHexState,
  HexYield,
  PlayerHandPatch,
} from "./types";
import { assertPlayerColor } from "./utils";

export class ResourceDistributionService {
  constructor(private readonly gameState: GameState) {}

  distributeToPlayers(roll: DiceCombination) {
    const hexesHash = this.gameState.getHexesForDiceRoll(roll);

    for (const hexHash of hexesHash) {
      const hex = this.gameState.board[hexHash];
      const hexYield = this.calcHexYield(hex);
      const statePatch = Object.entries(hexYield).reduce<PlayerHandPatch>(
        (acc, [player, val]) => {
          assertPlayerColor(player);
          acc[player] = Array.from({ length: val }, () => hex.resource);
          return acc;
        },
        {
          red: [],
          blue: [],
        }
      );

      this.gameState.updateHandState(statePatch);
    }
  }

  handleRobberEffects() {}

  private calcHexYield(hexState: StatefulHex) {
    const hexYield: HexYield = { ...DEFAULT_HEX_YIELD };
    for (const { settlement, city } of Object.values(hexState.vertices)) {
      if (settlement) {
        hexYield[settlement] += 1;
      }
      if (city) {
        hexYield[city] += 2;
      }
    }
    return hexYield;
  }
}
