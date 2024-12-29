import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_HOST,
});

console.log("Axios config:", api.defaults.baseURL);
