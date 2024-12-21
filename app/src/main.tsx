import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GameFacade } from "./lib/game-facade.ts";
import { DEFAULT_BOARD } from "./lib/constants.ts";

const gameFacade = new GameFacade({ board: { ...DEFAULT_BOARD } });

window.devTools = {
  gameState: gameFacade.gameState,
  startTurn: () => gameFacade.turnService.startTurn(),
  endTurn: () => gameFacade.turnService.endTurn(),
  // adjVertices: (h: HexHash, i: HexStateIndex) =>
  //   gameFacade.gameRenderer.availibilityService.getAdjacentVertices(h, i),
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App game={gameFacade} />
  </StrictMode>
);
