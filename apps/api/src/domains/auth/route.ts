import type { EntityManager } from "typeorm";
import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import { User } from "./user.entity.js";
import type { AuthIssuer, TokenData } from "../../libs/auth/auth-issuer.js";
import { Type } from "@sinclair/typebox";
import type { AuthService } from "./auth-service.js";
import type { AuthVerifier } from "../../libs/auth/auth-verifier.js";

const userSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

export async function authDomain(
  fastify: FastifyTypeboxInstance,
  {
    authService,
    authVerifier,
    entityManager,
    authIssuer,
  }: {
    authService: AuthService;
    authVerifier: AuthVerifier;
    authIssuer: AuthIssuer;
    entityManager: EntityManager;
  }
) {
  fastify.post(
    "/auth/authenticate",
    {
      schema: {
        description: "Authenticate user or create anonymous user",
        body: Type.Object({
          user: Type.Optional(userSchema),
        }),
        response: {
          200: Type.Object({
            token: Type.String({ description: "JWT token" }),
            user: userSchema,
          }),
        },
        tags: ["auth"],
      },
    },
    async (request) => {
      const user = request.body.user ?? (await authService.createAnonUser());

      const { token } = await authIssuer.issueToken({
        id: user.id,
        name: user.name,
      });

      return { token, user };
    }
  );
  fastify.post(
    "/auth/token",
    {
      onRequest: fastify.authAnon,
      schema: {
        description: "Request access token for additional resources",
        body: Type.Object({
          resourceType: Type.String(),
          resourceId: Type.String(),
        }),
        response: {
          200: Type.Object({
            token: Type.String({
              description: "JWT token with additional claims",
            }),
          }),
        },
        tags: ["auth"],
      },
    },
    async (request) => {
      const { resourceType, resourceId } = request.body;

      // Verify current authentication
      const auth = request.ctx.requireAuth();

      // Issue new token with additional claims
      const { token } = await authIssuer.issueToken({
        id: auth.sub,
        name: auth.name,
        [`${resourceType}Id`]: resourceId,
      });

      return { token };
    }
  );
}
