import { requestContext, validate } from "@colonist/backend-utils";
import createHttpError from "http-errors";

export function getProfile(): { name: string } {
  const profile = requestContext.get("profile");
  validate(
    profile !== undefined,
    'cannot read value "undefined"',
    createHttpError.BadRequest
  );
  return profile;
}
