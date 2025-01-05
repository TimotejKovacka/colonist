import createHttpError, { type HttpErrorConstructor } from "http-errors";

export function validate(
  value: boolean,
  message: string | undefined = undefined,
  errorConstructor: HttpErrorConstructor = createHttpError.BadRequest
): asserts value {
  if (!value) {
    throw new errorConstructor(message);
  }
}
