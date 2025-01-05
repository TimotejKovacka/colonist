import { type ResourceType, useAuthStore } from "@/stores/auth-store";
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export const api = withAuthMiddleware(
  axios.create({
    baseURL: import.meta.env.VITE_API_HOST,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  })
);

console.log("Axios config:", api.defaults.baseURL);

export function withAuthMiddleware(api: AxiosInstance) {
  console.log("attaching auth middleware");
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth();
      }
      return Promise.reject(error);
    }
  );

  return api;
}
