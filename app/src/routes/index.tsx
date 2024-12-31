import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home";
import Lobby from "@/pages/Lobby";
import { RootLayout } from "@/components/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      //   {
      //     path: "game/:gameId",
      //     element: <Game />,
      //   },
      {
        path: "lobby/:shareCode",
        element: <Lobby />,
      },
      //   {
      //     path: "settings",
      //     element: <Settings />,
      //   },
    ],
  },
]);
