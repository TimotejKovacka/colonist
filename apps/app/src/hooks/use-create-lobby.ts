import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useLobbyStore } from "@/stores/lobby-store";
import { useAuth } from "./use-auth";
import { sessionApi } from "@/api/session-api";
import { lobbyApi } from "@/api/lobby-api";

export const useCreateLobby = () => {
  const navigate = useNavigate();
  const { requestAccess } = useAuth();
  const { setLobby } = useLobbyStore();

  return useMutation({
    mutationKey: ["create-lobby"],
    mutationFn: async ({ userId }: { userId: string }) => {
      const { sessionId } = await sessionApi.createSession(userId);
      await requestAccess({ resourceType: "session", resourceId: sessionId });
      return await lobbyApi.joinLobby(userId, sessionId);
    },
    onSuccess: (lobbyState) => {
      setLobby(lobbyState);
      navigate(`/lobby/${lobbyState.sessionId}`);
    },
  });
};
