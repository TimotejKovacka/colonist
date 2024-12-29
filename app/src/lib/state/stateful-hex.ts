import { Hex } from "../coordinate-system/hex";
import {
  DiceCombination,
  FiniteResourceType,
  HexStatePatch,
  PartialHexCoordinates,
} from "../types";

export class StatefulHex extends Hex {
  constructor(
    coords: PartialHexCoordinates,
    readonly resource: FiniteResourceType,
    readonly dice: DiceCombination,
    public hasRobber = false
  ) {
    super(coords.q, coords.r, coords.s);
  }

  update(patch: HexStatePatch) {
    this.hasRobber = patch.robber;
  }
}
