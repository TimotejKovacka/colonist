import { LobbyModel } from "../model";

export const Lobby: React.FC<{ lobbyModel: LobbyModel }> = ({ lobbyModel }) => {
  //
  return (
    <>
      <h1>{lobbyModel.owner?.name}</h1>
      <div className="flex">
        {lobbyModel.players.map((player) => player.name)}
      </div>
      <div className="flex">{lobbyModel.map?.name}</div>
    </>
  );
};
