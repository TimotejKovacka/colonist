import { Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import type { Logger } from "@pilgrim/utils";
import { getUserState } from "@/stores/user-store";

export const RootLayout: React.FC<{ logger: Logger }> = () => {
  const navigate = useNavigate();
  const user = getUserState();

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
