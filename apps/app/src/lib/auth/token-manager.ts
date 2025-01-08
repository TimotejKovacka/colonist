import { ConsoleLogger, EventEmitter } from "@colonist/utils";

export enum TokenEvent {
  TokenUpdated = "token-updated",
  TokenCleared = "token-cleared",
}
export type TokenEvents = {
  [TokenEvent.TokenUpdated]: (args: {
    token: string;
    hadToken: boolean;
  }) => Promise<void>;
  [TokenEvent.TokenCleared]: () => Promise<void>;
};

export type ResourceType = "user" | "session";

class TokenManager {
  private logger = new ConsoleLogger({ module: "TokenManager" });
  private ee = new EventEmitter<TokenEvents>();
  private currentToken: string | null = null;
  private resourceClaims: { [k in ResourceType]?: string } = {};

  on = this.ee.on;
  off = this.ee.off;
  once = this.ee.once;

  addResourceClaim(type: ResourceType, val: string) {
    this.resourceClaims[type] = val;
  }

  hasResourceClaim({ type, id }: { type: ResourceType; id?: string }) {
    return id
      ? this.resourceClaims[type] === id
      : Boolean(this.resourceClaims[type]);
  }

  getResourceClaim(type: ResourceType) {
    return this.resourceClaims[type];
  }

  async setToken(token: string) {
    const hadToken = !!this.currentToken;
    this.currentToken = token;
    this.logger.info("New token", { hadToken });
    this.ee.emitAsync(TokenEvent.TokenUpdated, { token, hadToken });
  }

  clearToken() {
    if (this.currentToken) {
      this.currentToken = null;
      this.logger.info("Clearing token");
      this.ee.emitAsync(TokenEvent.TokenCleared);
    }
  }

  getToken() {
    return this.currentToken;
  }

  isAuthenticated() {
    return !!this.currentToken;
  }
}

export const tokenManager = new TokenManager();
