import { Type, type Static, type TSchema } from "@sinclair/typebox";
import {
  idsModifiedAtSchemaOfResoureSchema,
  resourcePostIds,
  resourcePostIdsOrder,
  strictResourceSchema,
  stringifyMethodPath,
  stringifyPostPath,
  stringifyResourcePath,
  type BaseResource,
  type ResourceBody,
  type ResourceDto,
  type ResourceIds,
  type ResourceIdsModifiedAt,
  cleanupSchemaDefaults,
  type ResourceId,
  type ResourceMethodSchema,
} from "@pilgrim/api-contracts";
import type { FastifyTypeboxInstance } from "../../../../apps/api/src/utils/fastify.js";
import { assert } from "@pilgrim/utils";
import { CREATED_RESOURCE_ID_HEADER } from "../../../../apps/api/src/libs/constants.js";
import type { FastifyReply, FastifyRequest } from "fastify";

export type ResourceRoute<TResource extends BaseResource> = Readonly<{
  resource: TResource;

  tryGet?: (
    ids: ResourceIds<TResource>,
    query: Static<TResource["query"]>,
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<ResourceDto<TResource> | undefined>;
  post?: (
    ids: ResourceIds<TResource>,
    body: ResourceBody<TResource>,
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<ResourceDto<TResource>>;
  patch?: (
    ids: ResourceIds<TResource>,
    patch: ResourceBody<TResource>,
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<ResourceIdsModifiedAt<TResource>>;
  methods?: {
    [K in keyof TResource["methods"]]: (
      ids: ResourceIds<TResource>,
      params: Static<TResource["methods"][K]["request"]>,
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<ResourceIdsModifiedAt<TResource>>;
  };
}>;

export function fastifyReplySchema<Schema extends TSchema>(
  schema: Schema
): Schema {
  return cleanupSchemaDefaults(strictResourceSchema(schema));
}

export function registerResourceRoutes<TResource extends BaseResource>({
  fastify,
  service,
}: {
  fastify: FastifyTypeboxInstance;
  service: ResourceRoute<TResource>;
}): void {
  const resource = service.resource;
  const auth = fastify.authResource(resource);
  const type = resource.type;
  const ids = Object.fromEntries(
    resource.idsOrder.map((idKey) => [
      idKey,
      `:${idKey as string}` as ResourceId,
    ])
  );
  const instancePath = stringifyResourcePath(resource, ids);
  const tags = [type];
  const schema = strictResourceSchema(resource.schema);
  const idsSchema = strictResourceSchema(resource.idsSchema);
  const createdAtIdsSchema = strictResourceSchema(
    idsModifiedAtSchemaOfResoureSchema(resource)
  );
  const bodySchema = strictResourceSchema(resource.body);
  const querySchema = strictResourceSchema(resource.query);
  // const headers = Type.Object({})

  if (service.tryGet) {
    const serviceTryGet = service.tryGet.bind(service);
    fastify.get(
      instancePath,
      {
        onRequest: auth,
        schema: {
          description: "Get resource state",
          params: idsSchema,
          querystring: querySchema,
          response: {
            200: fastifyReplySchema(schema),
            204: Type.Null(),
          },
          tags,
        },
      },
      // @ts-ignore: reply type matching
      async (request, reply) => {
        const result = await serviceTryGet(
          request.params,
          request.query,
          request,
          reply
        );
        if (result === undefined) {
          reply.statusCode = 204;
        }
        return result;
      }
    );
  }
  const createIdKey = resource.createIdKey;
  if (createIdKey !== undefined) {
    assert(
      service.post !== undefined,
      `Service does not implement post for resource that claims to support it. type:${type}`
    );
    const postIds = Object.fromEntries(
      resourcePostIdsOrder(resource).map((idKey) => [
        idKey,
        `:${idKey}` as ResourceId,
      ])
    );
    const postPath = stringifyPostPath(resource, postIds);
    const postIdsSchema = strictResourceSchema(resourcePostIds(resource));
    const servicePost = service.post.bind(service);
    fastify.post(
      postPath,
      {
        onRequest: auth,
        schema: {
          description: "Create resource",
          params: postIdsSchema,
          body: bodySchema,
          response: {
            201: fastifyReplySchema(schema),
          },
          tags,
        },
      },
      async (request, reply) => {
        const result = await servicePost(
          request.params,
          request.body,
          request,
          reply
        );
        reply.statusCode = 201;
        const createId = (result as unknown as Record<string, string>)[
          createIdKey as string
        ];
        void reply.header(CREATED_RESOURCE_ID_HEADER, createId);
        return result;
      }
    );
  }
  if (service.patch) {
    const servicePatch = service.patch.bind(service);
    fastify.patch(
      instancePath,
      {
        onRequest: auth,
        schema: {
          description: "Patch resource state",
          params: idsSchema,
          body: bodySchema,
          response: {
            202: createdAtIdsSchema,
          },
          tags,
        },
      },
      async (request, reply) => {
        reply.statusCode = 202;
        return await servicePatch(request.params, request.body, request, reply);
      }
    );
  }
  for (const [methodName, methodSchema] of Object.entries(resource.methods) as [
    string,
    ResourceMethodSchema
  ][]) {
    const method = service.methods?.[methodName];
    assert(
      method !== undefined,
      `Service ${type} misses implementation of method ${methodName}`
    );
    fastify.post(
      stringifyMethodPath(resource, ids, methodName),
      {
        onRequest: auth,
        schema: {
          description: methodSchema.description,
          params: idsSchema,
          request: strictResourceSchema(methodSchema.request),
          response: {
            204: Type.Object({}),
          },
          tags,
        },
      },
      async (request, reply) => {
        return await method(
          request.params,
          request.body as Static<TResource["methods"][string]["request"]>,
          request,
          reply
        );
      }
    );
  }
}
