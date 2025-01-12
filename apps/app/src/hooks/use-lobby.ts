import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type SessionId,
  type SessionResource,
  sessionResource,
  stringifyPostPath,
  type ResourceDto,
  type ResourceIds,
  type UserId,
  stringifyMethodPath,
  querifyResourceIds,
} from "@pilgrim/api-contracts";
import { api, type AxiosApiError } from "@/api/base-api";
import { useToastStore } from "@/stores/toast-store";

const SESSION_API_ERROR_MESSAGES = {
  AT_LEAST_1_PARTICIPANT: "Session needs to have at least 1 participant",
  PART_OF_SESSION: "Already part of session",
  IS_FULL: "Session is full",
} as const;

export const useLobbyMutations = ({
  withNavigation = true,
}: {
  withNavigation?: boolean;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const goToLobbyPage = (sessionId: string) => navigate(`/lobby/${sessionId}`);

  const createLobbyMut = useMutation({
    mutationKey: ["create-session"],
    mutationFn: async () => {
      const response = await api.post<ResourceDto<SessionResource>>(
        stringifyPostPath(sessionResource, {
          sessionId: "" as SessionId,
        }),
        {}
      );

      return response.data;
    },
    onSuccess: (ids) => {
      if (withNavigation) {
        goToLobbyPage(ids.sessionId);
      }
    },
  });

  const joinLobbyMut = useMutation<
    ResourceIds<SessionResource>,
    AxiosApiError,
    ResourceIds<SessionResource>
  >({
    mutationKey: ["join-session"],
    mutationFn: async (ids) => {
      // TODO(soon): deal with max players before making api request
      // if (data?.participants.length === data?.settings.)
      const response = await api.post<ResourceDto<SessionResource>>(
        stringifyMethodPath(sessionResource, ids, "join")
      );
      return response.data;
    },
    onSuccess: (ids) => {
      // TODO(soon): Should invalidate lobby query
      queryClient.refetchQueries({
        queryKey: querifyResourceIds(sessionResource, ids),
      });
      if (withNavigation) {
        goToLobbyPage(ids.sessionId);
      }
    },
    onError: (err, ids) => {
      const { response } = err;
      if (response?.status === 400) {
        if (
          response?.data.message === SESSION_API_ERROR_MESSAGES.PART_OF_SESSION
        ) {
          console.log(
            "invalidating query",
            querifyResourceIds(sessionResource, ids)
          );
          queryClient.refetchQueries({
            queryKey: querifyResourceIds(sessionResource, ids),
          });
          goToLobbyPage(ids.sessionId);
          return;
        }
        if (response?.data.message === SESSION_API_ERROR_MESSAGES.IS_FULL) {
          useToastStore.getState().setPendingToast({
            variant: "destructive",
            title: response.data.message,
          });
          navigate("/");
        }
      }
    },
  });

  return {
    createLobby: createLobbyMut.mutate,
    joinLobby: joinLobbyMut.mutate,
    isPending: createLobbyMut.isPending || joinLobbyMut.isPending,
    error: createLobbyMut.error || joinLobbyMut.error,
  };
};

export const isUserInLobby = (
  userId: UserId,
  session: { participants: Record<string, string> } = { participants: {} }
) => {
  return Object.entries(session.participants).some(
    ([participantId]) => participantId === userId
  );
};
