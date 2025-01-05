declare const forbiddenSymbol: unique symbol;
type Forbidden = { [forbiddenSymbol]: typeof forbiddenSymbol };
export type NoOverride<T = void> = Forbidden & T;
