import { api } from "@/lib/api";
import type { LobbyState } from "@/stores/lobby-store";
import type { SessionState } from "@/stores/session-store";

export const sessionApi = {
  createSession: async (userId: string) => {
    const { data } = await api.post<SessionState>(
      `userId/${userId}/session`,
      {}
    );
    return data;
  },
  patchSessionSettings: async () => {
    const sessionId = "";
    const { data } = await api.patch(`/sessionId/${sessionId}/settings`);
  },
  getLobbyData: async () => {
    const { data } = await api.get<LobbyState>(
      "/userId/:userId/sessionId/:sessionId/lobby"
    );
    return data;
  },
  joinLobby: async (data: { sessionId: string }) => {
    await api.post(`/userId/:userId/sessionId/${data.sessionId}/lobby/join`);
  },
  leaveLobby: async () => {
    await api.post("/userId/:userId/sessionId/:sessionId/lobby/leave");
  },
};

//
