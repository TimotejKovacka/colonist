import { createResource } from "./lib/resource.types.js";
import { sessionIdSchemas } from "./session.types.js";
import { sessionSettingsBodySchema } from "./session-settings.types.js";

export const lobbyResource = createResource({
  type: "lobby",
  ids: {
    ...sessionIdSchemas,
  },
  idsOrder: ["sessionId"],
  authRoles: {
    sessionId: undefined, // TODO: should be participant
  },
  body: {
    ...sessionSettingsBodySchema,
  },
});
export type LobbyResource = typeof lobbyResource;
