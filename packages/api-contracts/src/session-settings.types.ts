import { Type } from "@sinclair/typebox";
import { createResource } from "./lib/index.js";
import { sessionIdSchemas } from "./session.types.js";

export const sessionSettingsBodySchema = {
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
  maxPlayers: Type.Integer({
    default: 4,
    minimum: 2,
    maximum: 8,
    description: "Populated by backend based on mapType",
  }),
  mapType: Type.String({
    enum: ["default_4", "default_6"],
    default: "default_4",
    description: "The map associated with a session",
  }),
};

export const sessionSettingsResource = createResource({
  type: "sessionSettings",
  description: "Session configuration and settings",
  ids: {
    ...sessionIdSchemas,
  },
  idsOrder: ["sessionId"],
  authRoles: {
    sessionId: "owner",
  },
  body: sessionSettingsBodySchema,
});
export type SessionSettingsResource = typeof sessionSettingsResource;
