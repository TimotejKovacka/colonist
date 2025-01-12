import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import type { AuthIssuer } from "../../libs/auth/auth-issuer.js";
import { Type } from "@sinclair/typebox";
import type { UserService } from "./user-service.js";
import { assert } from "@pilgrim/utils";

const userSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

export async function authDomain(
  fastify: FastifyTypeboxInstance,
  {
    userService,
    authIssuer,
  }: {
    userService: UserService;
    authIssuer: AuthIssuer;
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
      const { user } = request.body;
      const isClientSentUserValid = user
        ? await userService.isValidUser(user)
        : false;
      const actualUser = isClientSentUserValid
        ? user
        : await userService.createAnonUser();
      assert(actualUser !== undefined);

      const { token } = await authIssuer.issueToken({
        id: actualUser.id,
        name: actualUser.name,
      });

      return { token, user: actualUser };
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
