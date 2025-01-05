import { Type } from "@sinclair/typebox";
import { userIdSchema, userIdSchemas } from "./user.types.js";
import { createResource } from "./lib/index.js";
import { sessionIdSchemas } from "./session.types.js";

export const sessionSettingsBodySchema = Type.Object(
  {
    isPublic: Type.Boolean({
      default: true,
      description: "Whether the session is publicly visible",
      examples: [true],
    }),
    gameMode: Type.String({
      enum: ["standard", "extended", "custom"],
      default: "standard",
      description: "Game mode configuration",
      examples: ["standard"],
    }),
    gameSpeed: Type.Integer({
      default: 1,
      minimum: 0,
      maximum: 2,
      examples: [1],
    }),
  },
  {
    examples: [
      {
        isPublic: true,
        gameMode: "standard",
      },
    ],
  }
);

export const sessionSettingsResource = createResource({
  type: "sessionSettings",
  description: "Session configuration and settings",
  ids: {
    ...userIdSchemas,
    ...sessionIdSchemas,
  },
  idsOrder: ["userId", "sessionId"],
  authRoles: {
    userId: "owner",
    sessionId: "owner",
  },
  body: {
    settings: sessionSettingsBodySchema,
    creatorId: userIdSchema,
  },
});
export type SessionSettingsResource = typeof sessionSettingsResource;
