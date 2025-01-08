import type { FastifyRequest } from "fastify";
import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import type { AuthContext, AuthVerifier } from "./auth-verifier.js";
import type { BaseResource, ResourceId } from "@colonist/api-contracts";
import { assert, isObject } from "@colonist/utils";
import {
  assertResourceAuthContext,
  requestContextStorage,
  type RequestContextData,
} from "@colonist/backend-utils";

declare module "fastify" {
  interface FastifyRequest {
    ctx: {
      requireAuth(): AuthContext;
      authChecked: boolean;
      hasAuth: boolean;
    };
  }

  interface FastifyInstance {
    authNone: (request: unknown, reply: unknown) => unknown;
    authAnon: (request: unknown, reply: unknown) => unknown;
    authResource: (
      schema: BaseResource
    ) => (request: unknown) => Promise<unknown>;
  }
}

export function authPlugin(
  fastify: FastifyTypeboxInstance,
  { authVerifier }: { authVerifier: AuthVerifier }
) {
  async function authNone(request: FastifyRequest) {
    request.ctx = {
      requireAuth() {
        throw new Error("Auth is missing");
      },
      authChecked: true,
      hasAuth: false,
    };
  }

  async function authAnon(request: FastifyRequest) {
    const token = request.headers.authorization?.split(" ")[1] ?? "";
    const payload = await authVerifier.verifyAndDecode(token);
    assert(
      payload.sub !== undefined,
      "Subject of authorization needs to be known"
    );

    request.ctx = {
      requireAuth: () => ({ ...payload }),
      hasAuth: true,
      authChecked: true,
    };
  }

  async function authResource(schema: BaseResource, request: FastifyRequest) {
    // maybe request context
    const ids = isObject(request.params) ? request.params : undefined;
    const token = request.headers.authorization?.split(" ")[1] ?? "";
    const payload = await authVerifier.verifyAndDecode(token);
    const contextStore = requestContextStorage.getStore();
    assert(
      contextStore !== undefined,
      "Auth is running outside of request context"
    );
    assert(
      payload.sub !== undefined,
      "Subject of authorization needs to be known"
    );
    contextStore.profile = { name: payload.name };

    const authContext = {
      resourceAuth: {
        userId: {
          id: payload.sub,
          roles: {
            owner: true,
          },
        },
        ...(payload.sessionId && {
          sessionId: {
            id: payload.sessionId.resourceId,
            roles: payload.sessionId.roles.reduce<Record<string, boolean>>(
              (acc, curr) => {
                acc[curr] = true;
                return acc;
              },
              {}
            ),
          },
        }),
      },
    } satisfies RequestContextData;
    Object.assign(contextStore, authContext);

    assertResourceAuthContext(schema, ids as Record<string, ResourceId>);

    request.ctx = {
      requireAuth: () => ({ ...payload }),
      authChecked: true,
      hasAuth: true,
    };
  }

  fastify.decorate("authNone", (request) =>
    authNone(request as FastifyRequest)
  );

  fastify.decorate("authAnon", (request) =>
    authAnon(request as FastifyRequest)
  );

  fastify.decorate("authResource", (schema: BaseResource) => {
    return async (request: unknown) => {
      await authResource(schema, request as FastifyRequest);
    };
  });
}
