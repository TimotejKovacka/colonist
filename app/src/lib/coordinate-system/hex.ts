import { HexHash, HexStateIndex } from "../types";

export class Hex {
  static diagonals: Hex[] = [
    new Hex(2, -1, -1),
    new Hex(1, -2, 1),
    new Hex(-1, -1, 2),
    new Hex(-2, 1, 1),
    new Hex(-1, 2, -1),
    new Hex(1, 1, -2),
  ];

  static directions: Hex[] = [
    new Hex(1, 0, -1),
    new Hex(1, -1, 0),
    new Hex(0, -1, 1),
    new Hex(-1, 0, 1),
    new Hex(-1, 1, 0),
    new Hex(0, 1, -1),
  ];

  static direction(direction: number): Hex {
    return Hex.directions[direction];
  }

  static isEq(a: Hex, b: Hex): boolean {
    return a.q === b.q && a.r === b.r && a.s === b.s;
  }

  static truncateIndex(i: number): HexStateIndex {
    return ((i + 6) % 6) as HexStateIndex;
  }

  public s: number;

  constructor(public q: number, public r: number, s?: number) {
    s ??= -q - r;
    if (Math.round(q + r + s) !== 0) throw new InvalidHexEqualityError(q, r, s);
    this.s = s;
  }

  /** Returns the hashed representation of the Hex */
  get hash(): HexHash {
    return `${this.q},${this.r}`;
  }

  get neighbors(): Hex[] {
    return Hex.directions.map((_, i) => this.neighbor(i));
  }

  sameVertex(
    vertex: HexStateIndex
  ): [[Hex, HexStateIndex], [Hex, HexStateIndex]] {
    return [
      [this.neighbor(vertex), Hex.truncateIndex(vertex + 2)],
      [
        this.neighbor(Hex.truncateIndex(vertex + 1)),
        Hex.truncateIndex(vertex + 4),
      ],
    ];
  }

  add(b: Hex): Hex {
    return new Hex(this.q + b.q, this.r + b.r, this.s + b.s);
  }

  subtract(b: Hex): Hex {
    return new Hex(this.q - b.q, this.r - b.r, this.s - b.s);
  }

  scale(k: number): Hex {
    return new Hex(this.q * k, this.r * k, this.s * k);
  }

  rotateLeft(): Hex {
    return new Hex(-this.s, -this.q, -this.r);
  }

  rotateRight(): Hex {
    return new Hex(-this.r, -this.s, -this.q);
  }

  neighbor(direction: number): Hex {
    return this.add(Hex.direction(direction));
  }

  diagonalNeighbor(direction: number): Hex {
    return this.add(Hex.diagonals[direction]);
  }

  len(): number {
    return (Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2;
  }

  distance(b: Hex): number {
    return this.subtract(b).len();
  }

  round(): Hex {
    let qi: number = Math.round(this.q);
    let ri: number = Math.round(this.r);
    let si: number = Math.round(this.s);
    const q_diff: number = Math.abs(qi - this.q);
    const r_diff: number = Math.abs(ri - this.r);
    const s_diff: number = Math.abs(si - this.s);
    if (q_diff > r_diff && q_diff > s_diff) {
      qi = -ri - si;
    } else if (r_diff > s_diff) {
      ri = -qi - si;
    } else {
      si = -qi - ri;
    }
    return new Hex(qi, ri, si);
  }

  lerp(b: Hex, t: number): Hex {
    return new Hex(
      this.q * (1.0 - t) + b.q * t,
      this.r * (1.0 - t) + b.r * t,
      this.s * (1.0 - t) + b.s * t
    );
  }

  linedraw(b: Hex): Hex[] {
    const N: number = this.distance(b);
    const a_nudge: Hex = new Hex(this.q + 1e-6, this.r + 1e-6, this.s - 2e-6);
    const b_nudge: Hex = new Hex(b.q + 1e-6, b.r + 1e-6, b.s - 2e-6);
    const results: Hex[] = [];
    const step: number = 1.0 / Math.max(N, 1);
    for (let i = 0; i <= N; i++) {
      results.push(a_nudge.lerp(b_nudge, step * i).round());
    }
    return results;
  }

  toString(): string {
    return `Hex(q=${this.q}, r=${this.r}, s=${this.s})`;
  }
}

export class InvalidHexEqualityError extends Error {
  constructor(
    public q: number,
    public r: number,
    public s: number,
    message: string = `q + r + s must be 0, got: q=${q}, r=${r}, s=${s} (sum=${
      q + r + s
    })`
  ) {
    super(message);
    this.name = "InvalidHexEqualityError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidHexEqualityError);
    }
  }
}
