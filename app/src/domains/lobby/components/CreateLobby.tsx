import { Button } from "@/components/ui/button";
import React from "react";
import { LobbyModel } from "../model";
import { api } from "@/lib/api";

export const CreateLobby: React.FC<{ lobbyModel: LobbyModel }> = ({
  lobbyModel,
}) => {
  const handleClick = async () => {
    const resp = await api.post("/lobby/create");

    console.log("Lobby created", resp.data);
  };

  return (
    <>
      <Button type="button" onClick={handleClick}>
        Create
      </Button>
    </>
  );
};
