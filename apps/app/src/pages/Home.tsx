import { CreateLobby } from "@/components/CreateLobby";
import { JoinLobbyForm } from "@/components/JoinLobbyForm";
import type { Logger } from "@/lib/logger";

const HomePage: React.FC<{ logger: Logger }> = (deps) => (
  <div className="container mx-auto px-4 py-8">
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Welcome to Colonist</h1>
        <p className="text-muted-foreground">
          Create a new game or join an existing one
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Create New Game</h2>
          <CreateLobby {...deps} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Join Game</h2>
          <JoinLobbyForm />
        </div>
      </div>
    </div>
  </div>
);

export default HomePage;
