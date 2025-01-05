import { Button } from "@/components/ui/button";
import { useCreateLobby } from "@/hooks/use-create-lobby";
import { useUser } from "@/hooks/use-user";

export const CreateLobby: React.FC = () => {
  const { user } = useUser();
  const { isPending, mutate } = useCreateLobby();

  const handleClick = async () => {
    if (!user) return;

    mutate({ userId: user.id });
  };

  return (
    <Button type="button" onClick={handleClick} disabled={isPending}>
      {isPending ? "Creating..." : "Create"}
    </Button>
  );
};
