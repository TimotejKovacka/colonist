import type { UserId } from "@pilgrim/api-contracts";
import { requestContext, validate } from "@pilgrim/backend-utils";
import createHttpError from "http-errors";

export function getProfile(): { id: UserId; name: string } {
  const profile = requestContext.get("profile");
  validate(
    profile !== undefined,
    'cannot read value "undefined"',
    createHttpError.BadRequest
  );
  return profile;
}
