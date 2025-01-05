export class AssertionError extends Error {
  code = "ERR_ASSERTION";
}

export function assert(
  value: boolean,
  message?: Error | string
): asserts value {
  if (!value) {
    throw message instanceof Error ? message : new AssertionError(message);
  }
}
