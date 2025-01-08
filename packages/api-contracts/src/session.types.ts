import { Type } from "@sinclair/typebox";
import {
  type ResourceId,
  resourceIdSchema,
  createResource,
  type ResourceMethodSchemas,
} from "./lib/index.js";
import { userIdSchemas } from "./user.types.js";

export const sessionType = "session" as const;
export type SessionAuthRole = "owner" | "participant" | undefined;
declare const sessionIdSymbol: "sessionId";
export type SessionId = ResourceId & { [sessionIdSymbol]: never };
export const sessionIdSchema = resourceIdSchema<
  typeof sessionType,
  SessionId,
  SessionAuthRole
>(sessionType, {
  description: "Game session id",
  examples: ["123456"],
});
export const sessionIdSchemas = {
  sessionId: sessionIdSchema,
};

/**
 * Generates a random 6-character alphanumeric code [a-zA-Z0-9]
 * @returns string
 */
export function generateSessionId(): SessionId {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code as SessionId;
}

export const sessionResource = createResource({
  type: sessionType,
  ids: {
    ...userIdSchemas,
    ...sessionIdSchemas,
  },
  idsOrder: ["userId", "sessionId"],
  createId: "sessionId",
  authRoles: {
    userId: "owner",
    sessionId: undefined,
  },
  body: {
    participants: Type.Record(
      Type.String({ description: "User ID" }),
      Type.String({ description: "User Name" })
    ),
  },
  methods: {
    join: {
      request: Type.Object({}),
      description: "Join the session",
    },
    leave: {
      request: Type.Object({}),
      description: "Leave the session",
    },
  } satisfies ResourceMethodSchemas,
});

export type SessionResource = typeof sessionResource;
