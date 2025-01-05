import { create } from "zustand";
import type { SessionSettingsState } from "./session-store";

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
  currentLobby: LobbyState | null;
  setLobby: (lobby: LobbyState | null) => void;
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  currentLobby: null,

  setLobby: (lobby) => set({ currentLobby: lobby }),
}));
