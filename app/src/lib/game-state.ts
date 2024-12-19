import { AvailibilityService } from "./availibility-service";
import { DEFAULT_DICE_HEX_MAP } from "./constants";
import { EventEmitter } from "./event-emitter";
import type {
  DiceCombination,
  DiceToHexMap,
  GameBoard,
  HexagonVerticeIndex,
  HexHash,
  HexStatePatch,
  PlayerColor,
  PlayerHand,
  PlayerHandPatch,
} from "./types";
import {
  assertGamePiece,
  assertHexHash,
  assertPlayerColor,
  getValidHexVerticeIndex,
} from "./utils";

export type PlayerBuildingEventHandler = (
  hexHash: HexHash,
  vertex: HexagonVerticeIndex,
  player: PlayerColor
) => void;

export type GameStateEvents = {
  buildRoad: PlayerBuildingEventHandler;
  buildSettlement: PlayerBuildingEventHandler;
  buildCity: PlayerBuildingEventHandler;
  robberPlaced: (hexHash: HexHash, players: PlayerColor[]) => void;
  playerHandUpdated: (player: PlayerColor, hand: PlayerHand) => void;
  turnPhaseChange: (phase: "start" | "end") => void;
};

export class GameState {
  //
  readonly playerColor: PlayerColor;
  readonly diceToHexMap: DiceToHexMap;
  readonly board: GameBoard;
  readonly playerHands: Record<PlayerColor, PlayerHand> = {
    red: [],
    blue: [],
  };

  //
  private readonly ee: EventEmitter<GameStateEvents> = new EventEmitter();
  private readonly availibilityService: AvailibilityService;

  //
  private turnState: "start" | "end" = "end";

  constructor({
    board,
    playerColor,
  }: {
    board: GameBoard;
    playerColor: PlayerColor;
  }) {
    this.playerColor = playerColor;
    this.board = board;
    this.diceToHexMap = boardToDiceHexMap(board);
    this.availibilityService = new AvailibilityService(board, playerColor);
  }

  get playerAvailableVertices() {
    return this.availibilityService.vertices;
  }

  get playerAvailableEdges() {
    return this.availibilityService.edges;
  }

  getHexesForDiceRoll(roll: DiceCombination): HexHash[] {
    return this.diceToHexMap[roll];
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

  updateBoardState(hexHash: HexHash, patch: "robber" | HexStatePatch): void {
    const hex = this.board[hexHash];
    if (!hex) {
      throw new Error("Unknown game hex");
    }
    console.log("Board patch", patch);

    if (patch === "robber") {
      hex.robber = true;
      const playersAffected = [
        ...new Set(
          Object.values(hex.vertices).flatMap(
            ({ city, settlement }) =>
              [city, settlement].filter(Boolean) as PlayerColor[]
          )
        ),
      ];
      console.log("New state", this.board);
      this.ee.emit("robberPlaced", hexHash, playersAffected);
      return;
    }

    if ("vertices" in patch) {
      for (const [vertexIndex, updates] of Object.entries(patch.vertices)) {
        const vertexToUpdate = getValidHexVerticeIndex(vertexIndex);
        for (const [piece, player] of Object.entries(updates)) {
          assertGamePiece(piece);
          hex.vertices[vertexToUpdate][piece] = player;
          console.log("New state", this.board);
          switch (piece) {
            case "road":
              this.ee.emit("buildRoad", hexHash, vertexToUpdate, player);
              this.availibilityService.handleBuildingPlayersRoad(
                this.board,
                hexHash,
                vertexToUpdate
              );
              break;
            case "settlement":
              this.availibilityService.handleBuildingPlayersSettlement(
                this.board,
                hexHash,
                vertexToUpdate
              );
              this.ee.emit("buildSettlement", hexHash, vertexToUpdate, player);
              break;
            case "city":
              this.ee.emit("buildCity", hexHash, vertexToUpdate, player);
              break;
          }
        }
      }
      return;
    }

    throw new Error("Unknown board update");
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

function boardToDiceHexMap(board: GameBoard): DiceToHexMap {
  const map = { ...DEFAULT_DICE_HEX_MAP };

  for (const [hash, { diceVal }] of Object.entries(board)) {
    assertHexHash(hash);
    map[diceVal].push(hash);
  }

  return map;
}
