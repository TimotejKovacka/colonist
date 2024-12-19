import type { DiceCombination } from "./types";

export class DiceService {
  rollDice(): DiceCombination {
    return 2;
  }

  validateRoll(roll: number): boolean {
    if (roll < 2 || roll > 12) {
      return false;
    }
    return true;
  }
}
