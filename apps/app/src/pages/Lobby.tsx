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
import type { Logger } from "@/lib/logger";
import { useUser } from "@/hooks/use-user";
import { useLobbyStore } from "@/stores/lobby-store";
import { useEffect } from "react";

const LobbyPage: React.FC<{ logger: Logger }> = ({ logger }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const { currentLobby, isLoading, error, joinLobby } = useLobbyStore();

  useEffect(() => {
    if (!sessionId || !user || currentLobby !== null) return;

    // Attempt to join lobby when component mounts
    joinLobby(sessionId, user.id).catch((error) => {
      toast({
        variant: "destructive",
        title: "Failed to join lobby",
        description: error.message,
      });
      navigate("/");
    });

    // Cleanup on unmount
    return () => {
      useLobbyStore.getState().setLobby(null);
    };
  }, [currentLobby, sessionId, user, joinLobby, navigate, toast]);

  if (!user) {
    return <div>Please log in to join the lobby</div>;
  }

  if (isLoading) {
    return <div>Loading lobby...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!currentLobby) {
    return <div>Lobby not found</div>;
  }

  const isOwner = currentLobby.ownerId === user.id;

  const copySessionId = async () => {
    // if (lobbyStore.shareCode) {
    //   await navigator.clipboard.writeText(lobbyStore.shareCode);
    //   toast({
    //     title: "Share code copied!",
    //     description: "Send this code to your friends to join the game.",
    //   });
    // }
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
              onClick={() => {
                navigator.clipboard.writeText(sessionId);
                toast({
                  title: "Session ID copied!",
                  description:
                    "Share this code with your friends to join the game.",
                });
              }}
            >
              <Copy className="h-4 w-4" />
              Share Code: {sessionId}
            </Button>
          </CardTitle>
          <CardDescription>
            Players ({currentLobby.participants.length}/4)
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Participants list */}
          <div className="space-y-4">
            {currentLobby.participants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {participant.userId === currentLobby.ownerId ? (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Users className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Player {participant.userId}</p>
                  <p className="text-sm text-gray-500">
                    {participant.userId === currentLobby.ownerId
                      ? "Host"
                      : "Player"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Game settings (owner only) */}
          {isOwner && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Game Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game Speed</label>
                  <Select
                    value={currentLobby.settings.gameSpeed.toString()}
                    onValueChange={(value) => {
                      useLobbyStore.getState().updateSettings({
                        gameSpeed: parseInt(value) as 0 | 1 | 2,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select game speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Slow</SelectItem>
                      <SelectItem value="1">Normal</SelectItem>
                      <SelectItem value="2">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              navigate("/");
            }}
          >
            Leave Lobby
          </Button>

          {isOwner && (
            <Button
              disabled={currentLobby.participants.length < 2}
              onClick={() => {
                // Start game logic here
              }}
            >
              Start Game
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default LobbyPage;
