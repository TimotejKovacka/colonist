import type { UserId } from "@colonist/api-contracts";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserState = {
  id: UserId;
  name: string;
  createdAt: Date;
  modifiedAt: Date;
};

type UserStore = {
  user: UserState | null;
  isInitialized: boolean;
  // Actions
  setUser: (user: UserState | null) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
  // Getters
  getUserState: () => UserState; // Type-safe user state
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      getUserState: () => {
        const user = get().user;
        if (!user) {
          throw new Error(
            "Attempting to access user state before initialization or after logout"
          );
        }
        return user;
      },
      logout: () => set({ user: null }),
    }),
    {
      name: "userState",
      onRehydrateStorage: () => (state) => {
        // Ensure dates are properly rehydrated as Date objects
        // if (state?.user) {
        //   state.user.createdAt = new Date(state.user.createdAt);
        //   state.user.modifiedAt = new Date(state.user.modifiedAt);
        // }
        state?.setInitialized(true);
      },

      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

export function isUserInitialized(): boolean {
  return useUserStore.getState().isInitialized;
}

export function hasUser(): boolean {
  return useUserStore.getState().user !== null;
}

export function getUserState(): UserState {
  return useUserStore.getState().getUserState();
}

export function getUserIds(): { userId: UserId } {
  return {
    userId: useUserStore.getState().getUserState().id,
  };
}
