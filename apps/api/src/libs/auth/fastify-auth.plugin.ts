import type { FastifyRequest } from "fastify";
import type { FastifyTypeboxInstance } from "../../utils/fastify.js";
import type { AuthContext, AuthVerifier } from "./auth-verifier.js";
import type { BaseResource } from "../types/resource.types.js";
import { isObject } from "../isObject.js";
import { validate } from "../../../../../packages/backend-utils/src/validate.js";
import createHttpError from "http-errors";
import {
  baseResourceType,
  resourceIdSchema,
  type ResourceId,
} from "../types/resource-id.types.js";
import type { TObject } from "@sinclair/typebox";
import { assert } from "../../../../../packages/utils/src/assert.js";

export const authIdSchema = resourceIdSchema<string, ResourceId, string>(
  baseResourceType,
  {}
);
export type AuthId = typeof authIdSchema;
export type ResourceAuthContext<
  Ids extends TObject<Record<string, AuthId>> = TObject<Record<string, AuthId>>
> = {
  [K in keyof Ids["properties"]]: {
    id: ResourceId;
    roles: Record<Ids["properties"][K]["role"], boolean>;
  };
};

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
    ) => (request: unknown, reply: unknown) => unknown;
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
    assert(
      payload.sub !== undefined,
      "Subject of authorization needs to be known"
    );

    const resourceAuth: ResourceAuthContext = {
      userId: {
        id: payload.sub,
        roles: {
          owner: true,
        },
      },
      ...(payload.sessionId && {
        sessionId: {
          id: payload.sessionId,
          roles: {
            owner: true,
          },
        },
      }),
    };

    for (const [authIdKey, authRole] of Object.entries(schema.authRoles)) {
      if (authRole === undefined) {
        continue;
      }
      const authContext = resourceAuth[authIdKey];
      validate(
        authContext !== undefined,
        `Not authorized to access ${authIdKey}`,
        createHttpError.Forbidden
      );
      validate(
        (ids as Record<string, ResourceId>)[authIdKey] === authContext.id,
        `Not authorized to access ${authIdKey}`,
        createHttpError.Forbidden
      );
      validate(
        authContext.roles[authRole as string] === true,
        `Not authorized to access ${authIdKey} ${authRole}`,
        createHttpError.Forbidden
      );
    }

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
