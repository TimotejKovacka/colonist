import { Board } from "./board";
import { Point } from "./coordinate-system/point";
import { Vertex } from "./coordinate-system/vertex";
import { EventEmitter } from "../../../../packages/utils/src/event-emitter";
import { StatefulEdge } from "./state/stateful-edge";
import { StatefulVertex } from "./state/stateful-vertex";
import {
  type CoordinatesHash,
  type PlayerColor,
  type PlayerHand,
  type PlayerHandPatch,
  type ApiBoard,
  type VertexStatePatch,
  type EdgeStatePatch,
  Building,
  HexStatePatch,
} from "./types";
import { assertPlayerColor } from "./utils";

export type PlayerBuildingEventHandler = (
  hash: CoordinatesHash,
  player: PlayerColor
) => void;

export type GameStateEvents = {
  buildRoad: PlayerBuildingEventHandler;
  buildSettlement: PlayerBuildingEventHandler;
  buildCity: PlayerBuildingEventHandler;
  robberPlaced: (hexHash: CoordinatesHash, players: PlayerColor[]) => void;
  playerHandUpdated: (player: PlayerColor, hand: PlayerHand) => void;
  turnPhaseChange: (phase: "start" | "end") => void;
};

export class GameState {
  //
  readonly playerColor: PlayerColor;
  readonly board: Board;
  // TODO(now): players should be provided by server
  readonly playerHands: Record<PlayerColor, PlayerHand> = {
    red: [],
    blue: [],
  };

  //
  private readonly ee: EventEmitter<GameStateEvents> = new EventEmitter();

  private _playerAvailableVertices: Array<StatefulVertex>;
  private _playerAvailableEdges: Array<StatefulEdge>;

  // Player selection
  public placingBuilding: Building = Building.None;
  public placingRoad = false;

  //
  gamePhase: "placement" | "ongoing" | "end" = "placement";
  turnState: "start" | "end" = "end";

  constructor({
    board,
    playerColor,
  }: {
    board: ApiBoard;
    playerColor: PlayerColor;
  }) {
    this.playerColor = playerColor;
    this.board = new Board(board);
    this._playerAvailableVertices = this.board.vertices;
    this._playerAvailableEdges = this.board.edges;
  }

  get occupiedBuildingSpots(): StatefulVertex[] {
    return this.board.vertices.filter((v) => v.building);
  }

  // TODO(soon): could be cached
  getAvailableBuildingSpots() {
    if (this.placingBuilding === Building.None) {
      return [];
    }
    return this._playerAvailableVertices.filter(
      (v) => v.building === this.placingBuilding - 1
    );
  }

  getAvailableRoadSpots() {
    if (!this.placingRoad) {
      return [];
    }
    return this._playerAvailableEdges;
  }

  updateHandState(patch: PlayerHandPatch): void {
    console.log("Hand patch", patch);
    for (const [color, hand] of Object.entries(patch)) {
      assertPlayerColor(color);
      this.playerHands[color].push(...hand);
      console.log("New state", this.playerHands);
      if (color === this.playerColor) {
        this.ee.emit(
          "playerHandUpdated",
          color,
          this.playerHands[this.playerColor]
        );
      }
    }
  }

  updateVertexState(hash: CoordinatesHash, patch: VertexStatePatch) {
    const vertex = this.board.vertex(hash);
    // Validation
    if (vertex.ownedBy && vertex.ownedBy !== patch.player) {
      throw `Can't build on vertex owned by other player`;
    }
    if (!vertex.building && patch.building === Building.City) {
      throw `Can't build city without prior settlement`;
    }
    if (vertex.building === patch.building) {
      throw `Can't build building of same type on vertex`;
    }
    // Mutation
    vertex.update(patch);
    const vertexNeighbours = [
      ...vertex.neighbours().filter((v) => this.board.vertex(v.hash, false)),
      vertex,
    ];
    this._playerAvailableVertices = this._playerAvailableVertices.filter((v) =>
      vertexNeighbours.every((v1) => !Point.isEq(v, v1))
    );
    console.log("Availibility updated", this._playerAvailableVertices.length);
    // Notification
    switch (patch.building) {
      case Building.Settlement:
        this.ee.emit("buildSettlement", hash, patch.player);
        return;
      case Building.City:
        this.ee.emit("buildCity", hash, patch.player);
        return;
    }
  }

  updateEdgeState(hash: CoordinatesHash, patch: EdgeStatePatch) {
    const edge = this.board.edge(hash);
    // Validation
    if (edge.ownedBy) {
      throw `Can't build on edge owned by other player`;
    }
    // Mutation
    edge.update(patch);
    console.log(`${edge.toString()} updated`, patch);
    this._playerAvailableEdges = this._playerAvailableEdges.filter(
      (e) => !Point.isEq(e, edge)
    );
    console.log("Availibility updated", this._playerAvailableEdges.length);
    // Notification
    this.ee.emit("buildRoad", hash, patch.player);
  }

  updateHexState(hash: CoordinatesHash) {
    const patch: HexStatePatch = { robber: true };
    const hex = this.board.hex(hash);
    // Validation
    if (hex.hasRobber) {
      throw `Can't place robber on the same spot`;
    }
    // Mutation
    // Will require knowing currently robbed hex for animation
    // TODO(now): source needs to be updated
    hex.update(patch); // destination
    console.log(`${hex.toString()} updated`, patch);

    // Notification
    const affectedPlayers = Vertex.fromCube(hex)
      .map((v) => this.board.vertex(v.hash).ownedBy)
      .filter((p) => p !== null);
    this.ee.emit("robberPlaced", hash, affectedPlayers);
  }

  updateTurnState(newState: "start" | "end") {
    console.log("Turn patch", newState);

    this.turnState = newState;

    console.log("New state", this.turnState);
    this.ee.emit("turnPhaseChange", newState);
  }

  on = this.ee.on;
  off = this.ee.off;
  once = this.ee.once;
}
