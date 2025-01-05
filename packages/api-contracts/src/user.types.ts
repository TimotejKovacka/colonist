import { Type } from "@sinclair/typebox";
import { type ResourceId, resourceIdSchema } from "./lib/index.js";

export const userType = "user" as const;
export type UserAuthRole = "owner";
declare const userIdSymbol: "userId";
export type UserId = ResourceId & { [userIdSymbol]: never };
export const userIdSchema = resourceIdSchema<
  typeof userType,
  UserId,
  UserAuthRole
>(userType, { examples: ["user123"] });
export const userIdSchemas = {
  userId: userIdSchema,
};
export const baseUserIdentificationSchema = Type.Object({
  userId: Type.String({}),
});
