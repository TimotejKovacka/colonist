import { Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import type { Logger } from "@/lib/logger";
import { useUser } from "@/hooks/use-user";
import { Alert } from "./ui/alert";

export const RootLayout: React.FC<{ logger: Logger }> = ({ logger }) => {
  const { user, isLoading, error, isInitialized } = useUser({ logger });
  const navigate = useNavigate();

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <p>Error: {error.message}</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <div
              className="text-xl font-bold cursor-pointer"
              onClick={() => navigate("/")}
            >
              Colonist
            </div>

            {user && (
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  Playing as <span className="font-medium">{user.name}</span>
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
};
