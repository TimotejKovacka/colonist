import { BadRequest, type HttpErrorConstructor } from "http-errors";

export function validate(
  value: boolean,
  message: string | undefined = undefined,
  errorConstructor: HttpErrorConstructor = BadRequest
): asserts value {
  if (!value) {
    throw new errorConstructor(message);
  }
}
