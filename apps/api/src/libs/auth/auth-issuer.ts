import { importPKCS8, SignJWT, type KeyLike } from "jose";
import {
  type NoOverride,
  ServiceContainer,
  type ServiceContext,
  type ServiceParent,
  StateReader,
  validate,
} from "@pilgrim/backend-utils";
import { assert } from "@pilgrim/utils";
import { readFileSync } from "node:fs";
import {
  sessionResource,
  type ResourceIds,
  type SessionAuthRole,
  type SessionId,
  type SessionResource,
  type UserId,
} from "@pilgrim/api-contracts";
import createHttpError from "http-errors";

export type Claim = {
  resourceId: string;
  roles: string[];
};

export type TokenData = {
  id: string;
  name: string;
  sessionId?: string;
};

export class AuthIssuer extends ServiceContainer {
  readonly hashingAlgorithm = "RS256" as const;
  private signingKey: KeyLike | null = null;
  private sessionReader: StateReader<SessionResource>;

  constructor(parent: ServiceParent, context: ServiceContext) {
    super(parent, AuthIssuer.name);
    this.sessionReader = new StateReader(context, sessionResource);
  }

  async issueToken(data: TokenData) {
    assert(this.signingKey !== null, "Private key is missing");
    const payload: Record<string, unknown> = {
      name: data.name,
    };

    if (data.sessionId) {
      const key = "sessionId";
      payload[key] = await this.issueSessionClaim(data.id as UserId, {
        sessionId: data.sessionId as SessionId,
      });
      this.logger.info("Issued session claim", {
        sessionClaim: payload[key],
      });
    }

    try {
      this.logger.info("Signing token", payload);
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

  private async issueSessionClaim(
    userId: UserId,
    ids: ResourceIds<SessionResource>
  ): Promise<Claim> {
    const session = await this.sessionReader.tryGet(ids);
    validate(
      session !== undefined,
      "Session not found",
      createHttpError.NotFound
    );
    const roles: Exclude<SessionAuthRole, undefined>[] = [];
    if (session.owner === userId) {
      roles.push("owner");
    }
    const participants = Object.entries(session?.participants || {});
    if (participants.some(([id, _]) => id === userId)) {
      roles.push("participant");
    }
    validate(roles.length > 0, undefined, createHttpError.Unauthorized);
    return {
      resourceId: session.sessionId,
      roles,
    };
  }
}
