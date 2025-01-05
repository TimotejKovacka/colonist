import { sessionApi } from "@/api/session-api";
import { useLobbyStore } from "@/stores/lobby-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const useLobby = () => {
  const queryClient = useQueryClient();
  const { currentLobby, setLobby } = useLobbyStore();
  const [hasJoined, setHasJoined] = useState(false);

  const lobbyQuery = useQuery({
    queryKey: ["lobby"],
    queryFn: async () => {
      const data = await sessionApi.getLobbyData();
      setLobby(data);
    },
    retry: 3,
    enabled: hasJoined,
  });

  const joinLobbyMutation = useMutation({
    mutationKey: ["lobby"],
    mutationFn: async (data: { sessionId: string }) =>
      sessionApi.joinLobby(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lobby"] });
      setHasJoined(true);
    },
  });

  const leaveLobbyMutation = useMutation({
    mutationKey: ["lobby"],
    mutationFn: sessionApi.leaveLobby,
    onSuccess: () => {
      setLobby(null);
      setHasJoined(false);
      queryClient.removeQueries({ queryKey: ["lobby"] });
    },
  });

  return {
    currentLobby,
    joinLobby: joinLobbyMutation.mutate,
    leaveLobby: leaveLobbyMutation.mutate,
    isJoining:
      joinLobbyMutation.isPending || (hasJoined && lobbyQuery.isFetching),
    isLeaving: leaveLobbyMutation.isPending,
    joinError: joinLobbyMutation.error || lobbyQuery.error,
    leaveError: leaveLobbyMutation.error,
  };
};
