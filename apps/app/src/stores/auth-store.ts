import { requireEnv } from "@/lib/env";
import { create } from "zustand";
import { importSPKI, jwtVerify, type JWTPayload } from "jose";

const publicKey = requireEnv<string>("VITE_PUBLIC_KEY").replace(/\\n/g, "\n");
let verifyKey: Awaited<ReturnType<typeof importSPKI>>;

async function initializeVerifyKey() {
  verifyKey = await importSPKI(publicKey, "RS256");
}
initializeVerifyKey();

export type ResourceType = "session";

interface OptionalIdClaims {
  sessionId?: string;
}

interface IdClaims extends OptionalIdClaims {
  userId: string;
}

interface TokenPayload extends OptionalIdClaims, JWTPayload {
  sub: string;
}

interface AuthState {
  token: string | null;
  claims: IdClaims | null;
  setToken: (token: string) => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  claims: null,
  setToken: async (token) => {
    try {
      const { payload } = await jwtVerify<TokenPayload>(token, verifyKey);
      const idClaims = Object.fromEntries(
        Object.entries(payload).filter(([key, _]) => key.endsWith("Id"))
      );
      set({
        token,
        claims: {
          userId: payload.sub,
          ...idClaims,
        },
      });
    } catch (error) {
      console.error("Invalid token:", error);
      set({ token: null, claims: null });
    }
  },
  clearAuth: () => set({ token: null, claims: null }),
}));
