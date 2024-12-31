import { makeAutoObservable, runInAction } from "mobx";
import { api } from "@/lib/api";
import type { SessionPlayer } from "@/types/user";

export class UserStore {
  currentPlayer: SessionPlayer | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get isAuthenticated() {
    return this.currentPlayer !== null;
  }

  getCurrentPlayerId(): string {
    if (!this.currentPlayer) {
      throw new Error("No player is currently authenticated");
    }
    return this.currentPlayer.id;
  }

  // This will be called when your app initializes
  async initializeSession() {
    try {
      this.isLoading = true;
      // We'll make a request to get the current session
      // This could be a new endpoint you add to your API
      const response = await api.get<SessionPlayer>("/session");

      runInAction(() => {
        this.currentPlayer = response.data;
        this.isLoading = false;
      });
    } catch (err) {
      runInAction(() => {
        // If there's no session, that's fine - the server will create one
        this.currentPlayer = null;
        this.isLoading = false;
      });
    }
  }

  // Optional: Add method to update player name
  async updatePlayerName(newName: string) {
    try {
      this.isLoading = true;
      const response = await api.patch<SessionPlayer>("/session", {
        name: newName,
      });

      runInAction(() => {
        this.currentPlayer = response.data;
        this.isLoading = false;
      });
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to update name";
        this.isLoading = false;
      });
      throw err;
    }
  }
}
