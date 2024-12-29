import { CreateLobby } from "./domains/lobby/components/CreateLobby";
import { JoinLobbyForm } from "./domains/lobby/components/JoinLobbyForm";
import { LobbyModel } from "./domains/lobby/model";

export const Welcome: React.FC = () => {
  const lobbyModel = new LobbyModel();
  return (
    <>
      <CreateLobby lobbyModel={lobbyModel} />
      <JoinLobbyForm lobbyModel={lobbyModel} />
    </>
  );
};
