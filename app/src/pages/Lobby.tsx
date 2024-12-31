import React from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Crown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LobbyPage = observer(() => {
  const { lobbyStore } = useStore();
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    // If we have a shareCode in URL but no current lobby, join it
    if (shareCode && !lobbyStore.currentLobby) {
      lobbyStore.joinLobby(shareCode).catch((error) => {
        toast({
          variant: "destructive",
          title: "Error joining lobby",
          description: error.message,
        });
        navigate("/");
      });
    }

    return () => {
      // Cleanup when leaving the page
      lobbyStore.resetState();
    };
  }, [shareCode, lobbyStore, toast, navigate]);

  if (!lobbyStore.currentLobby) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading lobby...</div>
      </div>
    );
  }

  const copyShareCode = async () => {
    if (lobbyStore.shareCode) {
      await navigator.clipboard.writeText(lobbyStore.shareCode);
      toast({
        title: "Share code copied!",
        description: "Send this code to your friends to join the game.",
      });
    }
  };

  const handleMapChange = (value: string) => {
    // Add map change logic here
    console.log("Map changed to:", value);
  };

  const handleSpeedChange = (value: string) => {
    // Add speed change logic here
    console.log("Speed changed to:", value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Game Lobby
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={copyShareCode}
            >
              <Copy className="h-4 w-4" />
              Share Code: {lobbyStore.shareCode}
            </Button>
          </CardTitle>
          <CardDescription>
            Waiting for players ({lobbyStore.currentLobby.players.length}/4)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Players List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Players</h3>
              <div className="space-y-4">
                {lobbyStore.currentLobby.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {player.id === lobbyStore.currentLobby?.ownerId && (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      )}
                      {player.id !== lobbyStore.currentLobby?.ownerId && (
                        <Users className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-gray-500">
                        {player.id === lobbyStore.currentLobby?.ownerId
                          ? "Host"
                          : "Player"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Settings */}
            {lobbyStore.isLobbyOwner && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Game Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Map</label>
                    <Select
                      onValueChange={handleMapChange}
                      defaultValue={lobbyStore.currentLobby.settings.mapName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a map" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4 players">4 Players</SelectItem>
                        <SelectItem value="6 players">6 Players</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Game Speed</label>
                    <Select
                      onValueChange={handleSpeedChange}
                      defaultValue={lobbyStore.currentLobby.settings.speed}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select game speed" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            Leave Lobby
          </Button>

          {lobbyStore.isLobbyOwner && (
            <Button
              disabled={!lobbyStore.canStartGame}
              onClick={() => {
                /* Add start game logic */
              }}
            >
              Start Game
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
});

export default LobbyPage;
