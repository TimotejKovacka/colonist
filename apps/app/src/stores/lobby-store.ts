import { create } from "zustand";
import type { SessionSettingsState } from "./session-store";
import {
  resourceDtoToObject,
  lobbyResource,
  type LobbyResource,
  type ResourceDto,
  type ResourceObject,
  type UserId,
} from "@pilgrim/api-contracts";

export type Participant = {
  userId: string;
};

export type LobbyState = {
  sessionId: string;
  ownerId: string;
  settings: SessionSettingsState;
  participants: Participant[];
  status: "lobby" | "inProgress" | "completed";
};

interface LobbyStore {
  currentLobby: ResourceObject<LobbyResource> | null;
  setLobby: (lobby: ResourceDto<LobbyResource> | null) => void;
  // Getters
  getCurrentLobby: () => ResourceObject<LobbyResource>;
}

export const useLobbyStore = create<LobbyStore>((set, get) => ({
  currentLobby: null,

  setLobby: (lobbyDto) =>
    set({
      currentLobby:
        lobbyDto === null
          ? lobbyDto
          : resourceDtoToObject(lobbyResource, lobbyDto),
    }),
  getCurrentLobby: () => {
    const lobby = get().currentLobby;
    if (!lobby) {
      throw new Error("Attempting to access lobby data before having them");
    }
    return lobby;
  },
}));
