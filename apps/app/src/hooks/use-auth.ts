import { authApi, type AuthenticateRequest } from "@/api/auth-api";
import type { Logger } from "@/lib/logger";
import { useAuthStore } from "@/stores/auth-store";
import type { UserState } from "@/stores/user-store";
import { useMutation } from "@tanstack/react-query";

interface UseAuthOptions {
  logger?: Logger;
  onAuthSuccess?: (user: UserState) => void;
  onAuthError?: () => void;
}

export function useAuth({
  logger,
  onAuthSuccess,
  onAuthError,
}: UseAuthOptions = {}) {
  const { token, claims, setToken, clearAuth } = useAuthStore();

  const {
    mutate: authenticate,
    isPending: isAuthenticating,
    error: authError,
    reset: resetAuth,
  } = useMutation({
    mutationKey: ["authenticate"],
    mutationFn: (data?: AuthenticateRequest) => authApi.authorize(data),
    onSuccess: async (response) => {
      try {
        await setToken(response.token);
        onAuthSuccess?.(response.user);
      } catch (error) {
        logger?.error("Failed to save token", {}, error);
        clearAuth();
        onAuthError?.();
      }
    },
    onError: () => {
      clearAuth();
      resetAuth();
      onAuthError?.();
    },
  });

  const {
    mutate: requestAccess,
    isPending: isRequestingAccess,
    error: accessError,
  } = useMutation({
    mutationKey: ["request-access"],
    mutationFn: (params: { resourceType: string; resourceId: string }) =>
      authApi.token(params),
    onSuccess: async (response) => {
      try {
        await setToken(response.token);
      } catch (error) {
        logger?.error("Failed to save access token", {}, error);
        throw error;
      }
    },
  });

  return {
    token,
    claims,
    isAuthenticating,
    isRequestingAccess,
    error: authError || accessError,
    authenticate,
    requestAccess,
    clearAuth,
  };
}
