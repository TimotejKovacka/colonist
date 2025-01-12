import { type ResourceType, tokenManager } from "@/lib/auth/token-manager";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { authApi } from "./auth-api";
import { ConsoleLogger } from "@pilgrim/utils";

interface ResourceInfo {
  type: ResourceType;
  id: string;
}

const extractResourceFromUrl = (url: string): ResourceInfo | null => {
  const sessionMatch = url.match(
    /\/userId\/[0-9a-f-]+\/sessionId\/([a-zA-Z0-9]+)/
  );
  console.log(url);
  if (
    sessionMatch &&
    !(
      url.endsWith("/session") ||
      url.endsWith("/join") ||
      url.endsWith("/leave")
    )
  ) {
    return { type: "session", id: sessionMatch[1] };
  }

  // Add other resource patterns here
  // const userMatch = url.match(...);

  return null;
};

export function withAuthMiddleware(api: AxiosInstance) {
  const logger = new ConsoleLogger({ module: "AuthMiddleware" });
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (config.url === "/auth/authenticate") {
      return config;
    }
    // const resourceInfo = config.url ? extractResourceFromUrl(config.url) : null;
    // if (resourceInfo && !tokenManager.hasResourceClaim(resourceInfo)) {
    //   try {
    //     logger.info("requesting claim", { url: config.url, resourceInfo });
    //     await authApi.token({
    //       resourceType: resourceInfo.type,
    //       resourceId: resourceInfo.id,
    //     });
    //   } catch (error) {
    //     return Promise.reject(
    //       new Error(`Failed to obtain ${resourceInfo.type} claim`)
    //     );
    //   }
    // }

    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      return Promise.reject(new Error("No authentication token available"));
    }

    return config;
  });

  api.interceptors.response.use(
    async (response) => {
      const { url, data: configData } = response.config;
      const { data } = response;
      // TODO(soon): this needs to be improved
      if (url?.startsWith("/auth/")) {
        switch (url) {
          case "/auth/authenticate":
            await tokenManager.setToken(data.token);
            if (data.user) {
              tokenManager.addResourceClaim("user", data.user.id);
            }
            break;

          case "/auth/token":
            await tokenManager.setToken(data.token);
            if (configData) {
              const { resourceType, resourceId } = JSON.parse(configData);
              tokenManager.addResourceClaim(resourceType, resourceId);
            }
            break;
        }
      }
      return response;
    },
    async (error) => {
      if (error.response?.status === 401) {
        tokenManager.clearToken();
      }
      return Promise.reject(error);
    }
  );

  return api;
}
