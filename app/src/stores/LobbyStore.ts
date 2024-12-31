import { makeAutoObservable, runInAction } from "mobx";
import { api } from "@/lib/api";
import type { Lobby } from "@/types/lobby";
import type { UserStore } from "./UserStore";

interface CreateLobbyResponse {
  lobby: Lobby;
  shareCode: string;
}

export class LobbyStore {
  currentLobby: Lobby | null = null;
  shareCode: string | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(private userStore: UserStore) {
    makeAutoObservable(this);
  }

  resetState() {
    this.currentLobby = null;
    this.shareCode = null;
    this.error = null;
    this.isLoading = false;
  }

  async createLobby() {
    try {
      this.isLoading = true;
      this.error = null;

      const response = await api.post<CreateLobbyResponse>("/lobby");

      runInAction(() => {
        this.currentLobby = response.data.lobby;
        this.shareCode = response.data.shareCode;
        this.isLoading = false;
      });

      return response.data;
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to create lobby";
        this.isLoading = false;
      });
      throw err;
    }
  }

  async joinLobby(shareCode: string) {
    try {
      this.isLoading = true;
      this.error = null;

      const response = await api.post<Lobby>(`/lobby/${shareCode}`);

      runInAction(() => {
        this.currentLobby = response.data;
        this.shareCode = shareCode;
        this.isLoading = false;
      });

      return response.data;
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to join lobby";
        this.isLoading = false;
      });
      throw err;
    }
  }

  // Computed properties
  get isInLobby() {
    return this.currentLobby !== null;
  }

  get isLobbyOwner() {
    if (!this.currentLobby) return false;
    // You'll need to get the current player's ID from somewhere
    // This could be from a UserStore or auth context
    const currentPlayerId = this.userStore.getCurrentPlayerId(); // implement this
    return this.currentLobby.ownerId === currentPlayerId;
  }

  get canStartGame() {
    if (!this.currentLobby) return false;
    return this.isLobbyOwner && this.currentLobby.players.length >= 2;
  }
}
