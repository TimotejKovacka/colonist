import { importSPKI, type JWTPayload, jwtVerify, type KeyLike } from "jose";
import {
  ServiceContainer,
  type ServiceParent,
  type NoOverride,
} from "@pilgrim/backend-utils";
import { assert } from "@pilgrim/utils";
import type { UserId } from "@pilgrim/api-contracts";
import { readFileSync } from "node:fs";
import type { Claim } from "./auth-issuer.js";

export interface AuthContext extends JWTPayload {
  sub: UserId;
  name: string;
  sessionId?: Claim;
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
