import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GameFacade } from "./lib/game-facade.ts";
import { DEFAULT_GAME_ID } from "./lib/constants.ts";
import { api } from "./lib/api.ts";
import { ApiBoard } from "./lib/types.ts";
import { Welcome } from "./Welcome.tsx";

const { data } = await api.get<ApiBoard>(`game/${DEFAULT_GAME_ID}/board`);
const gameFacade = new GameFacade({ board: data });

window.devTools = {
  gameState: gameFacade.gameState,
  startTurn: () => gameFacade.turnService.startTurn(),
  endTurn: () => gameFacade.turnService.endTurn(),
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <App game={gameFacade} /> */}
    <Welcome />
  </StrictMode>
);
