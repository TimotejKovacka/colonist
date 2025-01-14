import { UserState, useUserStore } from "@/stores/user-store";
import { Alert } from "./ui/alert";
import { useQuery } from "@tanstack/react-query";
import { appLogger } from "@/main";
import { api } from "@/api/base-api";

interface AuthProviderProps {
  children: React.ReactNode;
}

type AuthenticateRequestBody = {
  user?: {
    id: string;
    name: string;
  };
};

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, user } = useUserStore();

  const { isPending, error } = useQuery({
    queryKey: ["authenticate"],
    queryFn: async () => {
      const reqBody: AuthenticateRequestBody = {};
      if (user) {
        appLogger.info("Found existing user", user);
        reqBody.user = { ...user };
      }
      const { data } = await api.post<{ user: UserState; token: string }>(
        "/auth/authenticate",
        reqBody
      );
      setUser(data.user);
      return data;
    },
    retry: (failureCount, error: unknown) => {
      // if (isObject(error) && "response" in error && "status" in error.response && error?.response?.status === 401) return false;
      // return failureCount < 2;
      return false;
    },
    // Don't refetch on window focus or reconnect since this is initialization
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Prevent automatic retries on component remount
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <p>
            Error:{" "}
            {error instanceof Error ? error.message : "Authentication failed"}
          </p>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
