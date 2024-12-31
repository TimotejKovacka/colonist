import { makeAutoObservable } from "mobx";
import { LobbyStore } from "./LobbyStore";
import { UserStore } from "./UserStore";

export class RootStore {
  userStore: UserStore;
  lobbyStore: LobbyStore;

  constructor() {
    makeAutoObservable(this);
    this.userStore = new UserStore();
    this.lobbyStore = new LobbyStore(this.userStore);
  }
}
