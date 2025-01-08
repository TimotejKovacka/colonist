import { authApi } from "@/api/auth-api";
import { useMutation } from "@tanstack/react-query";

export function useAuth() {
  const {
    mutate: requestAccess,
    mutateAsync: promiseRequestAccess,
    isPending: isRequestingAccess,
    error: accessError,
  } = useMutation({
    mutationKey: ["request-token"],
    mutationFn: (params: { resourceType: string; resourceId: string }) =>
      authApi.token(params),
  });

  return {
    isRequestingAccess,
    error: accessError,
    requestAccess,
    promiseRequestAccess,
  };
}
