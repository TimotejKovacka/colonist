import { Type } from "@sinclair/typebox";
import { sessionIdSchemas } from "./session.types.js";
import { baseUserIdentificationSchema, userIdSchema } from "./user.types.js";
import {
  createResource,
  type ResourceMethodSchemas,
} from "./lib/resource.types.js";
import { sessionSettingsBodySchema } from "./session-settings.types.js";

const lobbyBodySchema = {
  ownerId: userIdSchema,
  settings: sessionSettingsBodySchema,
  participants: Type.Array(
    Type.Object(
      {
        userId: userIdSchema,
        // joinedAt: Type.Number({
        //   description: "Timestamp when the user joined",
        //   examples: [1641034800000],
        // }),
        // isActive: Type.Boolean({
        //   default: true,
        //   description: "Whether the participant is currently active",
        //   examples: [true],
        // }),
      },
      {
        examples: [
          {
            userId: "user123",
            joinedAt: 1641034800000,
            isActive: true,
          },
        ],
      }
    ),
    {
      description: "List of session participants",
      examples: [
        [
          {
            userId: "user123",
            joinedAt: 1641034800000,
            isActive: true,
          },
        ],
      ],
    }
  ),
  status: Type.String({
    enum: ["lobby", "inProgress", "completed"],
    default: "lobby",
  }),
};
export const lobbyResource = createResource({
  type: "lobby",
  description: "Public session information and join management",
  ids: {
    // ...userIdSchemas,
    ...sessionIdSchemas,
  },
  idsOrder: ["sessionId"],
  authRoles: {
    sessionId: undefined,
  },
  body: lobbyBodySchema,
  methods: {
    join: {
      description: "Join the session",
      request: baseUserIdentificationSchema,
      response: {
        200: lobbyBodySchema,
      },
    },
    leave: {
      description: "Leave the session",
      request: baseUserIdentificationSchema,
    },
  } satisfies ResourceMethodSchemas,
});

export type LobbyResource = typeof lobbyResource;
