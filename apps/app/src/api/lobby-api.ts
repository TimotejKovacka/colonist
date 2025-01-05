import { api } from "@/lib/api";
import type { LobbyState } from "@/stores/lobby-store";

export const lobbyApi = {
  joinLobby: async (userId: string, sessionId: string) => {
    const { data } = await api.post<LobbyState>(
      `/sessionId/${sessionId}/lobby/join`,
      { userId }
    );
    return data;
  },
  getLobbyState: async (sessionId: string) => {
    const { data } = await api.get<LobbyState>(`/sessionId/${sessionId}/lobby`);
    return data;
  },
};
