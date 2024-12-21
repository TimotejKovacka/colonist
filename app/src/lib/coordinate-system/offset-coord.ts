import { Hex } from "./hex";

/**
 * Can be used to find out <Q,R> representation for users
 */
export class OffsetCoord {
  static EVEN: number = 1;
  static ODD: number = -1;

  static qoffsetFromCube(offset: number, h: Hex): OffsetCoord {
    const col: number = h.q;
    const row: number = h.r + (h.q + offset * (h.q & 1)) / 2;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw new InvalidOffsetError(offset);
    }
    return new OffsetCoord(col, row);
  }

  static qoffsetToCube(offset: number, h: OffsetCoord): Hex {
    const q: number = h.col;
    const r: number = h.row - (h.col + offset * (h.col & 1)) / 2;
    const s: number = -q - r;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw new InvalidOffsetError(offset);
    }
    return new Hex(q, r, s);
  }

  static roffsetFromCube(offset: number, h: Hex): OffsetCoord {
    const col: number = h.q + (h.r + offset * (h.r & 1)) / 2;
    const row: number = h.r;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw new InvalidOffsetError(offset);
    }
    return new OffsetCoord(col, row);
  }

  static roffsetToCube(offset: number, h: OffsetCoord): Hex {
    const q: number = h.col - (h.row + offset * (h.row & 1)) / 2;
    const r: number = h.row;
    const s: number = -q - r;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw new InvalidOffsetError(offset);
    }
    return new Hex(q, r, s);
  }

  constructor(public col: number, public row: number) {}
}

export class InvalidOffsetError extends Error {
  constructor(
    public invalidOffset: number,
    message: string = `offset must be EVEN (+1) or ODD (-1), got: ${invalidOffset}`
  ) {
    super(message);
    this.name = "InvalidOffsetError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidOffsetError);
    }
  }
}
