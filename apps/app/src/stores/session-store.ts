import { create } from "zustand";

export type SessionSettingsState = {
  isPublic: boolean;
  gameMode: "standard" | "extended" | "custom";
  gameSpeed: 0 | 1 | 2;
};

export type SessionState = {
  type: "session";
  userId: string;
  sessionId: string;
  createdAt: number;
  modifiedAt: number;
  isDeleted?: boolean;
};

type SessionStore = {
  session: SessionState | null;
  setSession: (session: SessionState | null) => void;
};

export const useSessionStore = create<SessionStore>()((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}));
