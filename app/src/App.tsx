import { useEffect, useRef, useState } from "react";
import type { GameFacade } from "@/lib/game-facade";
import { Button } from "@/components/ui/button";
import { FocusIcon, PlayIcon, StopCircleIcon } from "lucide-react";
import { DebugIcons } from "./DebugIcons";

const App: React.FC<{ game: GameFacade }> = ({ game }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isDestroyed = false;

    // Load assets and start render loop
    const setup = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error("Canvas not found");
        }

        // Initialize the renderer with the canvas
        await game.initialize(canvas);
      } catch (err) {
        if (!isDestroyed) {
          setError(
            err instanceof Error ? err.message : "Failed to initialize game"
          );
        }
      }
    };

    setup();

    // Cleanup on unmount
    return () => {
      isDestroyed = true;
      game.cleanup();
    };
  }, [game]);

  return (
    <div className="p-4">
      <div className="flex">
        <Button size="icon" onClick={() => game.centerUI()}>
          <FocusIcon />
        </Button>
        <Button size="icon" onClick={() => game.turnService.startTurn()}>
          <PlayIcon />
        </Button>
        <Button size="icon" onClick={() => game.turnService.endTurn()}>
          <StopCircleIcon />
        </Button>
      </div>
      <div className="flex">
        <DebugIcons game={game} />
      </div>
      {error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <canvas
          ref={canvasRef}
          width={1200}
          height={720}
          onDragStart={(e) => e.preventDefault()}
          style={{ touchAction: "none" }}
          className=""
        />
      )}
    </div>
  );
};

export default App;
