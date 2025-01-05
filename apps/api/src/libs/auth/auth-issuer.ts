import { importPKCS8, SignJWT, type KeyLike } from "jose";
import {
  ServiceContainer,
  type ServiceParent,
} from "../../../../../packages/backend-utils/src/service.js";
import type { NoOverride } from "../../../../../packages/backend-utils/src/no-override.js";
import { assert } from "../../../../../packages/utils/src/assert.js";
import { readFileSync } from "node:fs";

export type TokenData = {
  id: string;
  name: string;
} & Record<`${string}Id`, string>;

export class AuthIssuer extends ServiceContainer {
  readonly hashingAlgorithm = "RS256" as const;
  private signingKey: KeyLike | null = null;
  constructor(parent: ServiceParent) {
    super(parent, AuthIssuer.name);
  }

  async issueToken(data: TokenData) {
    assert(this.signingKey !== null, "Private key is missing");
    const payload: Record<string, unknown> = {
      name: data.name,
    };

    for (const [key, value] of Object.entries(data)) {
      if (key.endsWith("Id") && key !== "id") {
        payload[key] = value;
      }
    }

    try {
      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: this.hashingAlgorithm })
        .setIssuedAt()
        .setExpirationTime("24h")
        .setSubject(data.id)
        .sign(this.signingKey);

      return {
        token: jwt,
        payload: {
          sub: data.id,
          name: data.name,
          ...payload,
        },
      };
    } catch (error) {
      this.logger.error("Failed to sign JWT", data, error);
      throw error;
    }
  }

  protected override async nodeStart(): Promise<NoOverride> {
    try {
      const privateKeyPath = "./private.pem";
      const privateKeyContent = readFileSync(privateKeyPath, "utf8").toString();

      // Ensure key is properly formatted
      if (!privateKeyContent.includes("-----BEGIN PRIVATE KEY-----")) {
        throw new Error("Invalid private key format");
      }

      this.signingKey = await importPKCS8(
        privateKeyContent,
        this.hashingAlgorithm
      );
      this.logger.info("Private key loaded successfully");
    } catch (error) {
      this.logger.error("Failed to load private key:", {}, error);
      throw error;
    }
  }
}
