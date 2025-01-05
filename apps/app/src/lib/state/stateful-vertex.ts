import { Vertex } from "../coordinate-system/vertex";
import { Building, Coordinates, PlayerColor, VertexStatePatch } from "../types";

export class StatefulVertex extends Vertex {
  public building: Building = Building.None;
  public ownedBy: PlayerColor | null = null;

  constructor(coords: Coordinates) {
    super(coords);
  }

  update(patch: VertexStatePatch) {
    this.building = patch.building;
    this.ownedBy = patch.player;
  }
}
