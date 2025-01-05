import { importSPKI, type JWTPayload, jwtVerify, type KeyLike } from "jose";
import {
  ServiceContainer,
  type ServiceParent,
} from "../../../../../packages/backend-utils/src/service.js";
import type { NoOverride } from "../../../../../packages/backend-utils/src/no-override.js";
import { assert } from "../../../../../packages/utils/src/assert.js";
import type { SessionId } from "../api-contracts/session.types.js";
import type { UserId } from "../api-contracts/user.types.js";
import { readFileSync } from "node:fs";

export interface AuthContext extends JWTPayload {
  sub: UserId;
  name: string;
  sessionId?: SessionId;
}

export class AuthVerifier extends ServiceContainer {
  readonly hashingAlgorithm = "RS256" as const;
  private verifyKey: KeyLike | null = null;
  constructor(parent: ServiceParent) {
    super(parent, AuthVerifier.name);
  }

  async verifyAndDecode(token: string) {
    assert(this.verifyKey !== null, "Public key is missing");

    try {
      const { payload } = await jwtVerify<AuthContext>(token, this.verifyKey);
      return payload;
    } catch (error) {
      this.logger.error("Failed to verify JWT", {}, error);
      throw error;
    }
  }

  protected override async nodeStart(): Promise<NoOverride> {
    try {
      const publicKeyPath = "./public.pem";
      const publicKeyContent = readFileSync(publicKeyPath, "utf8").toString();

      // Ensure key is properly formatted
      if (!publicKeyContent.includes("-----BEGIN PUBLIC KEY-----")) {
        throw new Error("Invalid public key format");
      }

      this.verifyKey = await importSPKI(
        publicKeyContent,
        this.hashingAlgorithm
      );
      this.logger.info("Public key loaded successfully");
    } catch (error) {
      this.logger.error("Failed to load public key", {}, error);
      throw error;
    }
  }
}
