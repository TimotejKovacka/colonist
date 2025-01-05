import { authApi } from "@/api/auth-api";
import { ConsoleLogger, type Logger } from "@/lib/logger";
import { useUserStore } from "@/stores/user-store";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useAuth } from "./use-auth";

export const useUser = ({
  logger = new ConsoleLogger(),
}: {
  logger?: Logger;
} = {}) => {
  const queryClient = useQueryClient();
  const { user, setUser, isInitialized } = useUserStore();

  const { token, isAuthenticating, error, authenticate } = useAuth({
    logger,
    onAuthSuccess: setUser,
    onAuthError: () => setUser(null),
  });

  useEffect(() => {
    if (isInitialized && !token && !isAuthenticating) {
      const authorizeData = user ? { user } : undefined;
      authenticate(authorizeData);
    }
  }, [isInitialized, token, isAuthenticating, authenticate, user]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    queryClient.removeQueries({ queryKey: ["userState"] });
  }, [setUser, queryClient]);

  return {
    user,
    isLoading: !isInitialized || isAuthenticating,
    isInitialized,
    error,
    logout,
  };
};
