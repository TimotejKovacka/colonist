import { Button } from "@/components/ui/button";
import { useLobbyMutations } from "@/hooks/use-lobby";

export const CreateLobby: React.FC = () => {
  const { createLobby, isPending } = useLobbyMutations({});

  return (
    <Button type="button" onClick={() => createLobby()} disabled={isPending}>
      {isPending ? "Creating..." : "Create"}
    </Button>
  );
};
