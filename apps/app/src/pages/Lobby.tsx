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
import { Copy, Crown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { assert, type Logger } from "@pilgrim/utils";
import { useEffect, useMemo } from "react";
import { getUserIds } from "@/stores/user-store";
import { sessionResource, type SessionId } from "@pilgrim/api-contracts";
import { Spinner } from "@/components/ui/spinner";
import { OwnerLobbySettings } from "@/components/lobby/OwnerLobbySettings";
import { useResourceQuery } from "@/hooks/use-resource-query";

const LobbyPage: React.FC<{ logger: Logger }> = ({ logger }) => {
  const { sessionId } = useParams<{ sessionId: SessionId }>();
  assert(sessionId !== undefined, "Missing sessionId");
  const userIds = getUserIds();
  const ids = useMemo(
    () => ({
      userId: userIds.userId,
      sessionId,
    }),
    [userIds, sessionId]
  );
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading, error, isFetching, isPlaceholderData } =
    useResourceQuery(sessionResource, ids, {
      logger,
      query: {
        autoJoin: true,
      },
      retry: 0,
    });

  // useEffect(() => {
  //   return () => {
  //     if (data && !isPlaceholderData) {
  //       // Send leave patch when component unmounts
  //       sendPatch({
  //         ...data,
  //         participants: Object.fromEntries(
  //           Object.entries(data?.participants ?? {}).filter(
  //             ([userId]) => userId !== userIds.userId
  //           )
  //         ),
  //       });
  //     }
  //   };
  // }, [isPlaceholderData, data, sendPatch, userIds.userId]);

  if (isLoading || isFetching || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
        <span>Loading lobby...</span>
      </div>
    );
  }

  if (error) {
    if ("response" in error && error.response?.status === 400) {
      if (error.response.data.message === "Session is full") {
        navigate("/");
        return null;
      }
    }
    return (
      <div className="text-center text-red-500">
        Error: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  const isOwner = userIds.userId === data.owner;

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
            Players ({Object.entries(data.participants).length}/4)
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Participants list */}
          <div className="space-y-4">
            {Object.entries(data.participants).map(([userId, name]) => {
              const isCurrentUser = userId === userIds.userId;
              const isParticipantOwner = userId === data.owner;

              return (
                <div
                  key={userId}
                  className={`flex items-center gap-3 p-3 rounded-lg border 
                    ${isCurrentUser ? "bg-primary/5 border-primary" : ""}`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {isParticipantOwner ? (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {name}
                        {isCurrentUser && (
                          <span className="ml-2 text-sm text-primary">
                            (You)
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {isParticipantOwner ? "Host" : "Player"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Game settings (owner only) */}
          {isOwner && <OwnerLobbySettings className="mt-6" ids={ids} />}
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
              disabled={Object.entries(data.participants).length < 2}
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
