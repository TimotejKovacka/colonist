import { Edge } from "./coordinate-system/edge";
import { Vertex } from "./coordinate-system/vertex";
import { StatefulEdge } from "./state/stateful-edge";
import { StatefulHex } from "./state/stateful-hex";
import { StatefulVertex } from "./state/stateful-vertex";
import {
  ApiBoard,
  CoordinatesHash,
  DiceCombination,
  PlaneDimensions,
} from "./types";

export class Board {
  readonly dimensions: PlaneDimensions;

  private readonly _hexes: Map<CoordinatesHash, StatefulHex> = new Map();
  private readonly _vertices: Map<CoordinatesHash, StatefulVertex> = new Map();
  private readonly _edges: Map<CoordinatesHash, StatefulEdge> = new Map();
  private readonly diceHexMap: Map<DiceCombination, StatefulHex[]> = new Map();

  constructor(apiBoard: ApiBoard) {
    let minQ = Number.POSITIVE_INFINITY;
    let minR = Number.POSITIVE_INFINITY;
    let maxQ = Number.NEGATIVE_INFINITY;
    let maxR = Number.NEGATIVE_INFINITY;
    for (const { resource, coords } of apiBoard.hexes) {
      minQ = Math.min(minQ, coords.q);
      minR = Math.min(minR, coords.r);
      maxQ = Math.max(maxQ, coords.q);
      maxR = Math.max(maxR, coords.r);
      const statefulHex = new StatefulHex(
        coords,
        resource,
        (Math.floor(Math.random() * (12 - 2 + 1)) + 2) as DiceCombination
      );

      this._hexes.set(statefulHex.hash, statefulHex);

      // Vertices
      Vertex.fromCube(statefulHex).forEach((v) => {
        if (!this._vertices.has(v.hash)) {
          this._vertices.set(v.hash, new StatefulVertex(v));
        }
      });

      // Edges
      Edge.fromCube(statefulHex).forEach((e) => {
        if (!this._edges.has(e.hash)) {
          this._edges.set(e.hash, new StatefulEdge(e));
        }
      });

      // Dices
      this.diceHexMap.set(statefulHex.dice, [
        ...(this.diceHexMap.get(statefulHex.dice) ?? []),
        statefulHex,
      ]);
    }

    this.dimensions = {
      width: Math.abs(minQ - maxQ) + 1,
      height: Math.abs(minR - maxR) + 1,
    };
  }

  get hexes() {
    return [...this._hexes.values()];
  }

  get vertices() {
    return [...this._vertices.values()];
  }

  get edges() {
    return [...this._edges.values()];
  }

  diceToHexList(dice: DiceCombination): StatefulHex[] {
    const _hexes = this.diceHexMap.get(dice);
    if (!_hexes) {
      throw ` _hexes not found: ${_hexes}`;
    }
    return _hexes;
  }

  hex(hash: CoordinatesHash) {
    const hex = this._hexes.get(hash);
    if (!hex) {
      throw new BoardNotFoundError("hex", hash);
    }
    return hex;
  }

  vertex(
    hash: CoordinatesHash,
    throwOnNotFound: false
  ): StatefulVertex | undefined;
  vertex(hash: CoordinatesHash, throwOnNotFound?: true): StatefulVertex;
  vertex(hash: CoordinatesHash, throwOnNotFound = true) {
    const vertex = this._vertices.get(hash);
    if (!vertex && throwOnNotFound) {
      throw new BoardNotFoundError("vertex", hash);
    }
    return vertex;
  }

  edge(hash: CoordinatesHash, throwOnNotFound: false): StatefulEdge | undefined;
  edge(hash: CoordinatesHash, throwOnNotFound?: true): StatefulEdge;
  edge(hash: CoordinatesHash, throwOnNotFound = true) {
    const edge = this._edges.get(hash);
    if (!edge && throwOnNotFound) {
      throw new BoardNotFoundError("edge", hash);
    }
    return edge;
  }
}

export class BoardNotFoundError extends Error {
  constructor(
    public readonly type: "hex" | "vertex" | "edge" | "dice",
    public readonly hash: CoordinatesHash | DiceCombination
  ) {
    super(`${type} not found for hash: ${hash}`);
    this.name = "BoardNotFoundError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BoardNotFoundError);
    }
  }
}
