import React from "react";
import { observer } from "mobx-react-lite";
import { Outlet, useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Toaster } from "@/components/ui/toaster";
import { WebSocketClient } from "@/lib/ws";

export const RootLayout = observer(() => {
  const { userStore } = useStore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const initializeSession = async () => {
      try {
        await userStore.initializeSession();
        if (!import.meta.env.VITE_STREAM_HOST) {
          throw "Missing stream host";
        }
        console.log(import.meta.env.VITE_STREAM_HOST);
        WebSocketClient.getInstance().connect(import.meta.env.VITE_STREAM_HOST);
      } catch (error) {
        // Handle any critical initialization errors
        console.error("Failed to initialize session:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [userStore]);

  if (isInitializing || userStore.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="text-2xl font-semibold">Loading</div>
          <div className="text-muted-foreground">
            Setting up your session...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="text-xl font-bold cursor-pointer"
              onClick={() => navigate("/")}
            >
              Colonist
            </div>

            {userStore.currentPlayer && (
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  Playing as{" "}
                  <span className="font-medium">
                    {userStore.currentPlayer.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <Toaster />
    </div>
  );
});
