import {
  BikeIcon,
  CircleSlashIcon,
  HomeIcon,
  TowerControlIcon,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { GameFacade } from "./lib/game-facade";
import { Building } from "./lib/types";

export const DebugIcons: React.FC<{ game: GameFacade }> = ({ game }) => (
  <>
    <Button
      size="icon"
      onClick={() => {
        game.gameState.placingRoad = !game.gameState.placingRoad;
        game.gameRenderer.render();
      }}
    >
      <BikeIcon />
    </Button>
    <Button
      size="icon"
      onClick={() => {
        game.gameState.placingBuilding = Building.None;
        game.gameRenderer.render();
      }}
    >
      <CircleSlashIcon />
    </Button>
    <Button
      size="icon"
      onClick={() => {
        game.gameState.placingBuilding = Building.Settlement;
        game.gameRenderer.render();
      }}
    >
      <HomeIcon />
    </Button>
    <Button
      size="icon"
      onClick={() => {
        game.gameState.placingBuilding = Building.City;
        game.gameRenderer.render();
      }}
    >
      <TowerControlIcon />
    </Button>
  </>
);
