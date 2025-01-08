import { api } from "./base-api";
import type { UserState } from "@/stores/user-store";

export type AuthenticateRequest = {
  user: {
    id: string;
    name: string;
  };
};

export const authApi = {
  logout: async () => {
    const { data } = await api.post("/auth/logout");
    return data;
  },
  authenticate: async (body?: AuthenticateRequest) => {
    const { data } = await api.post<{ user: UserState; token: string }>(
      "/auth/authenticate",
      body ?? {}
    );
    return data;
  },
  token: async (body: { resourceType: string; resourceId: string }) => {
    const { data } = await api.post<{
      token: string;
    }>("/auth/token", body);
    return data;
  },
};
