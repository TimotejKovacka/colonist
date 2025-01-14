import { api } from "./base-api";

export const authApi = {
  logout: async () => {
    const { data } = await api.post("/auth/logout");
    return data;
  },
  token: async (body: { resourceType: string; resourceId: string }) => {
    const { data } = await api.post<{
      token: string;
    }>("/auth/token", body);
    return data;
  },
};
