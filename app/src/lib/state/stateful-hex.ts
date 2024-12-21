import { Hex } from "../coordinate-system/hex";
import {
  BuildingState,
  DiceCombination,
  FiniteResourceType,
  HexStateIndex,
  IndexedHexState,
  NullablePlayer,
  PartialHexCoordinates,
} from "../types";

export class StatefulHex extends Hex {
  public roads: IndexedHexState<NullablePlayer> = [
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  public buildings: IndexedHexState<BuildingState> = [
    null,
    null,
    null,
    null,
    null,
    null,
  ];

  constructor(
    coords: PartialHexCoordinates,
    readonly resource: FiniteResourceType,
    readonly dice: DiceCombination,
    public hasRobber = false
  ) {
    super(coords.q, coords.r, coords.s);
  }

  get freeBuildingSpots(): HexStateIndex[] {
    return this.buildings
      .map((spot, i) => (spot === null ? i : undefined))
      .filter((spot) => spot !== undefined) as HexStateIndex[];
  }

  get freeRoadSpots(): HexStateIndex[] {
    return this.roads
      .map((spot, i) => (spot === null ? i : undefined))
      .filter((spot) => spot !== undefined) as HexStateIndex[];
  }
}
