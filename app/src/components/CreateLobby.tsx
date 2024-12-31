import { observer } from "mobx-react-lite";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const CreateLobby = observer(() => {
  const { lobbyStore } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      await lobbyStore.createLobby();
      // You might want to navigate to the lobby page here
      navigate(`/lobby/${lobbyStore.shareCode}`);
    } catch (error) {
      // Handle error (maybe show a toast notification)
      console.error("Failed to create lobby:", error);
      const errorDescription =
        error instanceof Error ? error.message : "Unknown reason";
      toast({
        title: "Failed to create lobby",
        description: errorDescription,
      });
    }
  };

  return (
    <Button type="button" onClick={handleClick} disabled={lobbyStore.isLoading}>
      {lobbyStore.isLoading ? "Creating..." : "Create"}
    </Button>
  );
});
