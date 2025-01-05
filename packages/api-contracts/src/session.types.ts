import { Type } from "@sinclair/typebox";
import {
  type ResourceId,
  resourceIdSchema,
  createResource,
  type ResourceMethodSchemas,
} from "./lib/index.js";
import { userIdSchema, userIdSchemas } from "./user.types.js";

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

// export const sessionSettingsBodySchema = Type.Object(
//   {
//     isPublic: Type.Boolean({
//       default: true,
//       description: "Whether the session is publicly visible",
//       examples: [true],
//     }),
//     gameMode: Type.String({
//       enum: ["standard", "extended", "custom"],
//       default: "standard",
//       description: "Game mode configuration",
//       examples: ["standard"],
//     }),
//     gameSpeed: Type.Integer({
//       default: 1,
//       minimum: 0,
//       maximum: 2,
//       examples: [1],
//     }),
//     // customRules: Type.Optional(
//     //   Type.Record(
//     //     Type.String(),
//     //     Type.Unknown({
//     //       examples: [null],
//     //     })
//     //   )
//     // ),
//   },
//   {
//     examples: [
//       {
//         isPublic: true,
//         gameMode: "standard",
//       },
//     ],
//   }
// );

// const sessionOwnerBodySchema = {
//   settings: sessionSettingsBodySchema,
//   creatorId: userIdSchema,
// };

// export const transferOwnershipBodySchema = Type.Object({
//   newOwnerId: userIdSchema,
// });

// export const sessionResource = createResource({
//   type: "session",
//   description: "Session management",
//   ids: {
//     ...userIdSchemas,
//     ...sessionIdSchemas,
//   },
//   idsOrder: ["userId", "sessionId"],
//   createId: "sessionId",
//   authRoles: {
//     userId: "owner",
//     sessionId: "owner",
//   },
//   body: sessionOwnerBodySchema,
//   methods: {
//     transferOwnership: {
//       description: "Transfer session ownership to another user",
//       request: transferOwnershipBodySchema,
//       response: {
//         204: Type.Null(),
//       },
//     },
//   } satisfies ResourceMethodSchemas,
// });
// export type SessionResource = typeof sessionResource;

export const transferOwnershipBodySchema = Type.Object({
  newOwnerId: userIdSchema,
});

export const sessionResource = createResource({
  type: "session",
  description: "Maps user to their active session",
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
  body: {}, // No additional body needed as this is just a mapping
  methods: {
    transferOwnership: {
      description: "Transfer session ownership to another user",
      request: transferOwnershipBodySchema,
      response: {
        204: Type.Null(),
      },
    },
  } satisfies ResourceMethodSchemas,
});
export type SessionResource = typeof sessionResource;
