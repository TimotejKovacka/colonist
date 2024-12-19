import type {
  GameBoard,
  GameVertexState,
  HexagonVerticeIndex,
  HexHash,
  PlayerColor,
} from "./types";
import {
  assertHexHash,
  assertHexVerticeIndex,
  isEven,
  parseHexHash,
  toHexHash,
} from "./utils";

const columMapping = (col: number, isEven: boolean) => ({
  same: () => col,
  left: () => col - 1,
  right: () => col + 1,
  topLeft: () => (isEven ? col : col - 1),
  topRight: () => (isEven ? col + 1 : col),
  bottomLeft: () => (isEven ? col : col - 1),
  bottomRight: () => (isEven ? col + 1 : col),
  skipLeft: () => col - (isEven ? 2 : 1),
  skipRight: () => col + (isEven ? 2 : 1),
});

export class AvailibilityService {
  private occiupiedEdges =
    new Set<`${number}-${number}-${HexagonVerticeIndex}`>();
  private _playerAvailableVertices: Array<[HexHash, HexagonVerticeIndex]>;
  private _playerAvailableEdges: Array<[HexHash, HexagonVerticeIndex]> = [];

  constructor(board: GameBoard, playerColor: PlayerColor) {
    this._playerAvailableVertices = this.getVertices(board, playerColor);
  }

  get vertices(): Array<[HexHash, HexagonVerticeIndex]> {
    return this._playerAvailableVertices;
  }

  get edges(): Array<[HexHash, HexagonVerticeIndex]> {
    return this._playerAvailableEdges;
  }

  handleBuildingPlayersRoad(
    board: GameBoard,
    hash: HexHash,
    index: HexagonVerticeIndex
  ) {
    console.log("reaction to road", hash, index);
    this.occiupiedEdges.add(`${hash}-${index}`);
    const connectedEdges = this.getEdgesConnectedToVertex(board, hash, index);
    console.log("connected edges", connectedEdges);
    const availableEdges = connectedEdges.filter(
      ([connectedHash, connectedEdge]) =>
        !this.occiupiedEdges.has(`${connectedHash}-${connectedEdge}`) &&
        !this.isIdenticalEdge(hash, connectedHash, index, connectedEdge)
    );
    console.log("availableEdges", availableEdges);
    this._playerAvailableEdges.push(...availableEdges);
  }

  handleBuildingPlayersSettlement(
    board: GameBoard,
    hash: HexHash,
    index: HexagonVerticeIndex
  ) {
    const verticesToRemove = [
      [hash, index],
      ...this.getAdjacentVertices(board, hash, index),
    ];
    this._playerAvailableVertices = this._playerAvailableVertices.filter(
      ([currentHash, currentIndex]) =>
        !verticesToRemove.some(
          ([removeHash, removeIndex]) =>
            currentHash === removeHash && currentIndex === removeIndex
        )
    );

    this.addEdgesFromSettlement(board, hash, index);
  }

  getHexes(board: GameBoard): HexHash[] {
    return Object.entries(board)
      .filter(([_, state]) => !state.robber)
      .map(([hexHash]) => hexHash as HexHash);
  }

  addEdgesFromSettlement(
    board: GameBoard,
    hash: HexHash,
    vertexIndex: HexagonVerticeIndex
  ) {
    // Get edges connected to this vertex
    const connectedEdges = this.getEdgesConnectedToVertex(
      board,
      hash,
      vertexIndex
    );

    // Add only unoccupied edges
    const newEdges = connectedEdges.filter(
      ([edgeHash, edgeIndex]) =>
        !this.isEdgeOccupied(board[edgeHash].vertices[edgeIndex])
    );

    // Add new edges to available edges, avoiding duplicates
    const uniqueEdges = [
      ...new Set([...this._playerAvailableEdges, ...newEdges]),
    ];

    this._playerAvailableEdges = uniqueEdges;
  }

  private addNewAvailableEdges(
    board: GameBoard,
    hash: HexHash,
    edgeIndex: HexagonVerticeIndex
  ) {
    // Get vertices connected to this edge
    const connectedVertices = this.getVerticesConnectedToEdge(
      board,
      hash,
      edgeIndex
    );

    // For each vertex, get its connected edges
    const potentialNewEdges = connectedVertices.flatMap(
      ([vertexHash, vertexIndex]) =>
        this.getEdgesConnectedToVertex(board, vertexHash, vertexIndex)
    );

    // Filter to only unoccupied edges
    const validNewEdges = potentialNewEdges.filter(
      ([edgeHash, edgeIndex]) =>
        !this.isEdgeOccupied(board[edgeHash].vertices[edgeIndex])
    );

    // Add new edges to available edges, avoiding duplicates
    this._playerAvailableEdges = [
      ...new Set([...this._playerAvailableEdges, ...validNewEdges]),
    ];
  }

  private getVerticesConnectedToEdge(
    board: GameBoard,
    hash: HexHash,
    edgeIndex: HexagonVerticeIndex
  ): Array<[HexHash, HexagonVerticeIndex]> {
    // Each edge connects to two vertices
    return [
      [hash, edgeIndex],
      [hash, ((edgeIndex + 1) % 6) as HexagonVerticeIndex],
    ];
  }

  private isEdgeOccupied(vertexState: GameVertexState): boolean {
    return vertexState?.road !== undefined;
  }

  private getVertices(
    board: GameBoard,
    player: PlayerColor
  ): Array<[HexHash, HexagonVerticeIndex]> {
    const availableVertices: Array<[HexHash, HexagonVerticeIndex]> = [];
    const checkedVertices = new Set<string>();
    for (const hexHash of Object.keys(board)) {
      assertHexHash(hexHash);
      for (let vertexIndex = 0; vertexIndex < 6; vertexIndex++) {
        assertHexVerticeIndex(vertexIndex);
        if (this.isVertexOccupied(board[hexHash].vertices[vertexIndex]))
          continue;

        const vertexKey = `${hexHash}-${vertexIndex}`;
        if (checkedVertices.has(vertexKey)) continue;
        checkedVertices.add(vertexKey);

        const adjacentVertices = this.getAdjacentVertices(
          board,
          hexHash,
          vertexIndex
        );
        const hasOccupiedAdjacent = adjacentVertices.some(([hash, index]) =>
          this.isVertexOccupied(board[hash].vertices[index])
        );
        if (hasOccupiedAdjacent) continue;

        if (
          !this.isInitialPlacement() &&
          !this.hasAdjacentRoad(
            board,
            hexHash,
            vertexIndex,
            player,
            adjacentVertices
          )
        ) {
          continue;
        }
        availableVertices.push([hexHash, vertexIndex]);
      }
    }

    return availableVertices;
  }

  private isInitialPlacement(): boolean {
    return true;
  }

  private isVertexOccupied(vertexState: GameVertexState) {
    if (vertexState?.settlement || vertexState?.city) {
      return true;
    }
    return false;
  }

  getAdjacentVertices(
    board: GameBoard,
    hexHash: HexHash,
    vertexIndex: HexagonVerticeIndex
  ): Array<[HexHash, HexagonVerticeIndex]> {
    const [row, col] = parseHexHash(hexHash);
    const adjacentHexes: Array<[number, number, HexagonVerticeIndex]> = [
      [row, col, ((vertexIndex - 1 + 6) % 6) as HexagonVerticeIndex], // Same hex, previous vertex
      [row, col, ((vertexIndex + 1) % 6) as HexagonVerticeIndex], // Same hex, next vertex
      ...(this.getAllAdjacentVertices(row, col, vertexIndex) as Array<
        [number, number, HexagonVerticeIndex]
      >),
    ];

    return adjacentHexes
      .filter(([row, col]) => board[toHexHash(row, col)])
      .map(([row, col, vertexIndex]) => [toHexHash(row, col), vertexIndex]);
  }

  private hasAdjacentRoad(
    board: GameBoard,
    hexHash: HexHash,
    vertexOrEdgeIndex: HexagonVerticeIndex,
    player: PlayerColor,
    computedAdjacent?: Array<[HexHash, HexagonVerticeIndex]>
  ): boolean {
    const adjacentVertices =
      computedAdjacent ??
      this.getAdjacentVertices(board, hexHash, vertexOrEdgeIndex);

    for (const [hash, edgeIndex] of adjacentVertices) {
      assertHexHash(hash);
      if (board[hash].vertices[edgeIndex].road === player) {
        return true;
      }
    }

    return false;
  }

  getAllAdjacentVertices(
    row: number,
    col: number,
    vertexIndex: HexagonVerticeIndex
  ) {
    const colums = columMapping(col, row % 2 === 0);

    switch (vertexIndex) {
      case 4: // Top vertex
        return [
          [row, colums.right(), 3], // Right, top-left
          [row, colums.left(), 5], // Left, top-right
          [row - 1, colums.topLeft(), 5], // Top-left, top-right
          [row - 1, colums.topLeft(), 0], // Top-left, bottom-right
          [row - 1, colums.topLeft(), 1], // Top-left, bottom
          [row - 1, colums.topRight(), 1], // Top-right, bottom
          [row - 1, colums.topRight(), 2], // Top-right, bottom-left
          [row - 1, colums.topRight(), 3], // Top-right, top-left
          [row - 2, colums.same(), 1], // Top-skip, bottom
        ];
      case 3: // Upper-left vertex
        return [
          [row - 1, colums.topRight(), 2], // Top-right, bottom-left
          [row - 1, colums.skipLeft(), 0], // Top-left-skip, bottom-right
          [row - 1, colums.topLeft(), 0], // Top-left hex, bottom-right
          [row - 1, colums.topLeft(), 1], // Top-left hex, bottom
          [row - 1, colums.topLeft(), 2], // Top-left hex, bottom-left
          [row, colums.left(), 4], // Left hex, top
          [row, colums.left(), 5], // Left hex, top-right
          [row, colums.left(), 0], // Left hex, bottom-right
          [row + 1, colums.bottomLeft(), 4], // Bottom-left, top
        ];
      case 5: // Upper-right vertex
        return [
          [row - 1, colums.skipRight(), 2], // Top-right-skip, bottom-left
          [row - 1, colums.topLeft(), 0], // Top-left hex, bottom-right
          [row - 1, colums.topRight(), 0], // Top-right, bottom-right
          [row - 1, colums.topRight(), 1], // Top-right, bottom
          [row - 1, colums.topRight(), 2], // Top-right, bottom-left
          [row, colums.right(), 2], // Right hex, bottom-left
          [row, colums.right(), 3], // Right hex, top-left
          [row, colums.right(), 4], // Right hex, top
          [row + 1, colums.bottomRight(), 4], // Bottom-right, top
        ];
      case 2: // Lower-left vertex
        return [
          [row - 1, colums.topLeft(), 1], // Top-left hex, bottom
          [row, colums.left(), 5], // Left hex, top-right
          [row, colums.left(), 0], // Left hex, bottom-right
          [row, colums.left(), 1], // Left hex, bottom
          [row + 1, colums.bottomRight(), 3], // Bottom-right, top-left
          [row + 1, colums.skipLeft(), 5], // Bottom-left-skip, top-right
          [row + 1, colums.bottomLeft(), 3], // Bottom-left, top-left
          [row + 1, colums.bottomLeft(), 4], // Bottom-left, top
          [row + 1, colums.bottomLeft(), 5], // Bottom-left, top-right
        ];
      case 0: // Lower-right vertex
        return [
          [row - 1, colums.topRight(), 1], // Top-right, bottom
          [row, colums.right(), 1], // Right, bottom
          [row, colums.right(), 2], // Right, bottom-left
          [row, colums.right(), 3], // Right, top-left
          [row + 1, colums.skipRight(), 3], // Bottom-right-skip, top-left
          [row + 1, colums.bottomLeft(), 5], // Bottom-left, top-right
          [row + 1, colums.bottomRight(), 3], // Bottom-right, top-left
          [row + 1, colums.bottomRight(), 4], // Bottom-right, top
          [row + 1, colums.bottomRight(), 5], // Bottom-right, top-right
        ];
      case 1: // Bottom vertex
        return [
          [row, colums.left(), 0], // Left, bottom-right
          [row, colums.right(), 2], // Right, bottom-left
          [row + 1, colums.bottomLeft(), 4], // Bottom-left, top
          [row + 1, colums.bottomLeft(), 5], // Bottom-left, top-right
          [row + 1, colums.bottomLeft(), 0], // Bottom-left, bottom-right
          [row + 1, colums.bottomRight(), 2], // Bottom-right, bottom-left
          [row + 1, colums.bottomRight(), 3], // Bottom-right, top-left
          [row + 1, colums.bottomRight(), 4], // Bottom-right, top
          [row + 2, colums.same(), 4], // Botom-skip, top
        ];

      default:
        throw new Error("unknown vertex index");
    }
  }

  getAllAdjacentEdges(
    row: number,
    col: number,
    edgeIndex: HexagonVerticeIndex
  ) {
    const colums = columMapping(col, row % 2 === 0);

    switch (edgeIndex) {
      case 4:
        return [
          [row - 1, colums.topLeft(), 0],
          [row - 1, colums.topLeft(), 5],
          [row - 1, colums.topRight(), 0],
          [row - 1, colums.topRight(), 1],
          [row - 1, colums.topRight(), 2],
          [row, colums.right(), 2],
          [row, colums.right(), 3],
        ];
      case 3:
        return [
          [row, colums.left(), 4],
          [row, colums.left(), 5],
          [row - 1, colums.topLeft(), 0],
          [row - 1, colums.topLeft(), 1],
          [row - 1, colums.topLeft(), 5],
          [row - 1, colums.topRight(), 1],
          [row - 1, colums.topRight(), 2],
        ];
      case 5:
        return [
          [row + 1, colums.bottomRight(), 3],
          [row + 1, colums.bottomRight(), 4],
          [row, colums.right(), 1],
          [row, colums.right(), 2],
          [row, colums.right(), 3],
          [row - 1, colums.topRight(), 0],
          [row - 1, colums.topRight(), 1],
        ];
      case 2:
        return [
          [row + 1, colums.bottomLeft(), 3],
          [row + 1, colums.bottomLeft(), 4],
          [row, colums.left(), 0],
          [row, colums.left(), 4],
          [row, colums.left(), 5],
          [row - 1, colums.topLeft(), 0],
          [row - 1, colums.topLeft(), 5],
        ];
      case 0:
        return [
          [row, colums.right(), 1],
          [row, colums.right(), 2],
          [row + 1, colums.bottomRight(), 2],
          [row + 1, colums.bottomRight(), 3],
          [row + 1, colums.bottomRight(), 4],
          [row + 1, colums.bottomLeft(), 4],
          [row + 1, colums.bottomLeft(), 5],
        ];
      case 1:
        return [
          [row + 1, colums.bottomRight(), 2],
          [row + 1, colums.bottomRight(), 3],
          [row + 1, colums.bottomLeft(), 3],
          [row + 1, colums.bottomLeft(), 4],
          [row + 1, colums.bottomLeft(), 5],
          [row, colums.left(), 0],
          [row, colums.left(), 5],
        ];
      default:
        throw new Error("unknown edge index");
    }
  }

  private getEdgesConnectedToVertex(
    board: GameBoard,
    hash: HexHash,
    vertexIndex: HexagonVerticeIndex
  ): Array<[HexHash, HexagonVerticeIndex]> {
    const [row, col] = parseHexHash(hash);
    const colums = columMapping(col, row % 2 === 0);

    const getConnected = (): Array<[number, number, HexagonVerticeIndex]> => {
      switch (vertexIndex) {
        case 4:
          return [
            [row - 1, colums.topLeft(), 0],
            [row - 1, colums.topLeft(), 1],
            [row - 1, colums.topRight(), 1],
            [row - 1, colums.topRight(), 2],
          ];
        case 3:
          return [
            [row, colums.left(), 4],
            [row, colums.left(), 5],
            [row - 1, colums.topLeft(), 0],
            [row - 1, colums.topLeft(), 1],
          ];
        case 5:
          return [
            [row - 1, colums.topRight(), 0],
            [row - 1, colums.topRight(), 1],
            [row, colums.right(), 2],
            [row, colums.right(), 3],
          ];
        case 2:
          return [
            [row + 1, colums.bottomLeft(), 3],
            [row + 1, colums.bottomLeft(), 4],
            [row, colums.left(), 0],
            [row, colums.left(), 5],
          ];
        case 0:
          return [
            [row + 1, colums.bottomRight(), 3],
            [row + 1, colums.bottomRight(), 4],
            [row, colums.right(), 1],
            [row, colums.right(), 2],
          ];
        case 1:
          return [
            [row + 1, colums.bottomRight(), 2],
            [row + 1, colums.bottomRight(), 3],
            [row + 1, colums.bottomLeft(), 4],
            [row + 1, colums.bottomLeft(), 5],
          ];
        default:
          throw new Error("unknown vertex index");
      }
    };

    const connectedEdges: Array<[HexHash, HexagonVerticeIndex]> = getConnected()
      .filter(([row, col]) => board[toHexHash(row, col)])
      .map(([row, col, vertexIndex]) => [toHexHash(row, col), vertexIndex]);
    connectedEdges.push(
      [hash, vertexIndex],
      [hash, ((vertexIndex - 1 + 6) % 6) as HexagonVerticeIndex]
    );

    return connectedEdges;
  }

  isIdenticalEdge(
    hash1: HexHash,
    hash2: HexHash,
    edgeIndex1: HexagonVerticeIndex,
    edgeIndex2: HexagonVerticeIndex
  ) {
    const [row1, col1] = parseHexHash(hash1);
    const [row2, col2] = parseHexHash(hash2);
    const rowDiff = row1 - row2;
    const isRowEven = isEven(row1);
    const colMap = columMapping(col1, isRowEven);

    switch (edgeIndex1) {
      case 4:
        return rowDiff === 1 && colMap.topRight() === col2 && edgeIndex2 === 1;
      case 3:
        return rowDiff === 1 && colMap.topLeft() === col2 && edgeIndex2 === 0;
      case 5:
        return rowDiff === 0 && colMap.right() === col2 && edgeIndex2 === 2;
      case 2:
        return rowDiff === 0 && colMap.left() === col2 && edgeIndex2 === 5;
      case 0:
        return (
          rowDiff === -1 && colMap.bottomRight() === col2 && edgeIndex2 === 3
        );
      case 1:
        return (
          rowDiff === -1 && colMap.bottomLeft() === col2 && edgeIndex2 === 4
        );
    }
  }
}
