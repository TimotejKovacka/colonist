import { Edge } from "../coordinate-system/edge";
import { Coordinates, EdgeStatePatch, PlayerColor } from "../types";

export class StatefulEdge extends Edge {
  public ownedBy: PlayerColor | null = null;

  constructor(coords: Coordinates) {
    super(coords);
  }

  update(patch: EdgeStatePatch) {
    this.ownedBy = patch.player;
  }
}
