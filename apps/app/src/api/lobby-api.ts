import {
  lobbyResource,
  stringifyMethodPath,
  type LobbyResource,
  type ResourceDto,
  stringifyResourcePath,
  type ResourceIds,
  type UserId,
  type SessionSettingsResource,
  type ResourceBody,
  sessionSettingsResource,
  type ResourceIdsModifiedAt,
} from "@pilgrim/api-contracts";
import { api } from "./base-api";

export const lobbyApi = {
  joinLobby: async (
    ids: ResourceIds<LobbyResource>,
    body: { userId: UserId }
  ) => {
    const response = await api.post<ResourceDto<LobbyResource>>(
      stringifyMethodPath(lobbyResource, ids, "join"),
      body
    );
    return response.data;
  },
  leaveLobby: async (
    ids: ResourceIds<LobbyResource>,
    body: { userId: UserId }
  ) => {
    const response = await api.post<ResourceDto<LobbyResource>>(
      stringifyMethodPath(lobbyResource, ids, "leave"),
      body
    );
    return response.data;
  },
  getLobby: async (ids: ResourceIds<LobbyResource>) => {
    const response = await api.get<ResourceDto<LobbyResource>>(
      stringifyResourcePath(lobbyResource, ids)
    );
    return response.data;
  },
  patchSettings: async (
    ids: ResourceIds<SessionSettingsResource>,
    body: ResourceBody<SessionSettingsResource>
  ) => {
    const response = await api.patch<
      ResourceIdsModifiedAt<SessionSettingsResource>
    >(stringifyResourcePath(sessionSettingsResource, ids), body);
    return response.data;
  },
};
