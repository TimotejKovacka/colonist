export function requireEnv<T>(k: `VITE_${string}`): T {
  return import.meta.env[k];
}
