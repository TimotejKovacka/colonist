import axios, { type AxiosError } from "axios";
import { withAuthMiddleware } from "./auth-middleware";

export type ApiError = {
  error: string;
  message: string;
  statusCode: number;
};

export type AxiosApiError = AxiosError<ApiError>;

export const api = withAuthMiddleware(
  axios.create({
    baseURL: import.meta.env.VITE_API_HOST,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  })
);

export const BASE_URL = `${window.location.origin}${api.defaults.baseURL}`;

console.log("Axios config:", api.defaults.baseURL);
