import {
  baseResourceType,
  resourceIdSchema,
  type BaseResource,
  type ResourceId,
  type ResourceIds,
  type UserId,
} from "@pilgrim/api-contracts";
import type { TObject } from "@sinclair/typebox";
import { AsyncLocalStorage } from "node:async_hooks";
import { validate } from "./validate.js";
import createHttpError from "http-errors";

/**
 * Request-scope storage, based on the node's AsyncLocalStorage
 */
export type RequestContextData = {
  profile?: {
    id: UserId;
    name: string;
  };
  resourceAuth: ResourceAuthContext;
};

export const requestContextStorage =
  new AsyncLocalStorage<RequestContextData>();

export const requestContext = {
  get: <K extends keyof RequestContextData>(
    key: K
  ): RequestContextData[K] | undefined => {
    return requestContextStorage.getStore()?.[key];
  },
  set: <K extends keyof RequestContextData>(
    key: K,
    value: RequestContextData[K]
  ): void => {
    const store = requestContextStorage.getStore();
    if (store) {
      store[key] = value;
    }
  },
};

export const authIdSchema = resourceIdSchema<string, ResourceId, string>(
  baseResourceType
);
export type AuthIdSchema = typeof authIdSchema;
export type ResourceAuthContext<
  Ids extends TObject<Record<string, AuthIdSchema>> = TObject<
    Record<string, AuthIdSchema>
  >
> = {
  [K in keyof Ids["properties"]]: {
    id: ResourceId;
    roles: Record<Ids["properties"][K]["role"], boolean>;
  };
};

export const assertResourceAuthContext = <TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>
) => {
  for (const [authIdKey, authRole] of Object.entries(resource.authRoles)) {
    if (authRole === undefined) {
      continue;
    }
    const authContext = requestContext.get("resourceAuth")?.[authIdKey];
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
};
