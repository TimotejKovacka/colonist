import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserState = {
  id: string;
  name: string;
  createdAt: Date;
  modifiedAt: Date;
};

type UserStore = {
  user: UserState | null;
  setUser: (user: UserState | null) => void;
  isInitialized: boolean;
  setInitialized: (initialized: boolean) => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
    }),
    {
      name: "userState", // localStorage key
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
