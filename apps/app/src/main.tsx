import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/toaster.tsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home";
import Lobby from "@/pages/Lobby";
import { RootLayout } from "@/components/RootLayout";
import { ConsoleLogger, type Logger } from "@pilgrim/utils";
import { AuthProvider } from "./components/AuthProvider.tsx";
import { ToastProvider } from "./components/ToastProvider.tsx";
import { WebSocketProvider } from "./contexts/ws-context.tsx";
import App from "./App.tsx";
import { GameFacade } from "./lib/game-facade.ts";
import { IoProvider } from "./lib/websocket/io.provider.tsx";
import { TestApp } from "./TestApp.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Number.POSITIVE_INFINITY, // Consider how often user data needs to be refreshed
      refetchOnWindowFocus: false,
    },
  },
});

export interface MainInit {
  logger: Logger;
}

export const appLogger = new ConsoleLogger({ module: "app" });
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout logger={appLogger.child("RootLayout")} />,
    children: [
      {
        index: true,
        element: <Home logger={appLogger.child("HomePage")} />,
      },
      //   {
      //     path: "game/:gameId",
      //     element: <Game />,
      //   },
      {
        path: "lobby/:sessionId",
        element: <Lobby logger={appLogger.child("LobbyPage")} />,
      },
      //   {
      //     path: "settings",
      //     element: <Settings />,
      //   },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* <AuthProvider> */}
      <ToastProvider>
        {/* <WebSocketProvider url=""> */}
        <IoProvider logger={appLogger}>
          <TestApp />
          {/* <RouterProvider router={router} /> */}
        </IoProvider>
        {/* </WebSocketProvider> */}
      </ToastProvider>
      <Toaster />
      <ReactQueryDevtools />
      {/* </AuthProvider> */}
    </QueryClientProvider>
  </StrictMode>
);
