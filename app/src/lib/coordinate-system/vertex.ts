import { Coordinates } from "../types";
import { Point } from "./point";

export class Vertex extends Point {
  public x: number;
  public y: number;

  constructor(coords: Coordinates) {
    const isYInvalid = (coords.y + 2) % 4 === 0;
    if (
      !Number.isInteger(coords.x) ||
      !Number.isInteger(coords.y) ||
      isYInvalid
    ) {
      throw new InvalidVertexConstructorError(coords.x, coords.y);
    }
    super(coords);
    this.x = coords.x;
    this.y = coords.y;
  }
}

export class InvalidVertexConstructorError extends Error {
  constructor(
    public x: number,
    public y: number,
    message: string = `Invalid arguments for Vertex constructor. Got: ${x}, ${y}`
  ) {
    super(message);
    this.name = "InvalidVertexConstructorError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidVertexConstructorError);
    }
  }
}
