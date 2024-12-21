import { Coordinates } from "../types";

export class Edge {
  public x: number;
  public y: number;

  constructor(coords: Coordinates) {
    const isXInvalid = (coords.x + 2) % 4 === 0;
    if (
      !Number.isInteger(coords.x) ||
      !Number.isInteger(coords.y) ||
      isXInvalid
    ) {
      throw new InvalidEdgeConstructorError(coords.x, coords.y);
    }
    this.x = coords.x;
    this.y = coords.y;
  }
}

export class InvalidEdgeConstructorError extends Error {
  constructor(
    public x: number,
    public y: number,
    message: string = `Invalid arguments for Edge constructor. Got: ${x}, ${y}`
  ) {
    super(message);
    this.name = "InvalidEdgeConstructorError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidEdgeConstructorError);
    }
  }
}
