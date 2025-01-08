import { useToast } from "@/hooks/use-toast";
import { useToastStore } from "@/stores/toast-store";
import { useEffect } from "react";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const pendingToast = useToastStore((state) => state.pendingToast);
  const setPendingToast = useToastStore((state) => state.setPendingToast);

  useEffect(() => {
    if (pendingToast) {
      console.log("pending toast", pendingToast);
      toast(pendingToast);
      setPendingToast(undefined);
    }
  }, [pendingToast, toast, setPendingToast]);

  return <>{children}</>;
}
