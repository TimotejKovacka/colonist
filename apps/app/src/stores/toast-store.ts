import { create } from "zustand";

export interface Toast {
  variant?: "default" | "destructive";
  title: string;
  description?: string;
}

interface ToastStore {
  pendingToast?: Toast;
  setPendingToast: (toast: Toast | undefined) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  pendingToast: undefined,
  setPendingToast: (toast) => set({ pendingToast: toast }),
}));
