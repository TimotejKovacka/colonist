import {
  OptionalKind,
  Static,
  TObject,
  TOptional,
  TSchema,
  Type,
} from "@sinclair/typebox";
import {
  BaseIdSchema,
  baseResourceType,
  emptyResourceType,
  resourceTypeSchema,
} from "./resource-id.types.js";
import { assert } from "../assert.js";
import { Value } from "@sinclair/typebox/value";
import { minifyValue, ResourceRequired, setSchemaDefaults } from "../types.js";
import chunk from "lodash.chunk";

const emptyObjectSchema = Type.Object({});

const createdAtSchema = Type.Object({
  createdAtMs: Type.Number({
    description: "Timestamp when a resource was created",
  }),
});

const modifiedAtSchema = Type.Object({
  modifiedAtMs: Type.Number({
    description: "Timestamp when a resource was last modified",
  }),
});

export type ResourceMethodSchema = {
  description?: string;
  request: TObject;
};
export type ResourceMethodSchemas = Record<string, ResourceMethodSchema>;
export const createResource = <
  ResourceType extends string,
  Ids extends Record<string, BaseIdSchema>,
  BodyProperties extends Record<string, TSchema>,
  Options extends object = object,
  Methods extends Record<string, ResourceMethodSchema> = ResourceMethodSchemas,
  Query extends TObject = typeof emptyObjectSchema
>({
  type, // unique resource type identifier
  description,
  ids,
  createId,
  idsOrder,
  body: bodyProperties,
  options = {} as Options,
  methods = {} as Methods,
  query = Type.Object({}) as Query,
}: {
  type: ResourceType;
  description?: string;
  ids: Ids;
  idsOrder: (keyof Ids)[];
  createdId?: keyof Ids;
  body: BodyProperties;
  options?: Options;
  methods?: Methods;
  query?: Query;
}) => {
  for (const [bodyKey, bodyProperty] of Object.entries(bodyProperties)) {
    assert(
      bodyProperty[OptionalKind] !== "Optional",
      `body properties must not be optional. type:${type} property:${bodyKey}`
    );
  }
  assert(
    new Set(idsOrder).size === Object.entries(ids).length,
    `idsOrder must be permutation of ids keys. type:${type}`
  );
  const optionalBodyProperties = Object.fromEntries(
    Object.entries(bodyProperties).map(([bodyKey, bodyProperty]) => [
      bodyKey,
      Type.Optional(bodyProperty),
    ])
  ) satisfies { [key: string]: TOptional<TSchema> } as {
    [key in keyof BodyProperties]: TOptional<BodyProperties[key]>;
  };
  const body = Type.Object(
    {
      isDeleted: Type.Optional(
        Type.Boolean({
          description: "Is the resource soft deleted",
        })
      ),
      ...optionalBodyProperties,
    },
    {
      description,
    }
  );
  setSchemaDefaults(body);

  const refOrder = ["type", ...idsOrder];
  const ref = Type.Object({
    type: resourceTypeSchema(type, { description }),
    ...ids,
  });

  const schema = Type.Composite(
    [ref, createdAtSchema, modifiedAtSchema, body],
    {
      description,
    }
  );

  return {
    schema,
    type,
    ids,
    idsSchema: Type.Object(ids),
    idsOrder: typeof idsOrder,
    ref,
    refOrder: typeof idsOrder,
    createdIdKey: typeof createId,
    body,
    methods: typeof methods,
    options,
    query,
  };
};

/**
 * Resource dto (data transfer object).
 *
 * Resource body properties are optional in the resource schema.
 * Resource dto is resource instance matching the serialization form.
 * The body properties with default values are usually deleted.
 */
export type ResourceDto<TResource extends BaseResource> = Static<
  TResource["schema"]
>;

/**
 * Resource domain object.
 *
 * Resource body properties are optional in the resource schema.
 * Resource object is resource instance matching
 * with all the body properties required.
 * The body properties missing in dto are set to defaults from the schema.
 */
export type ResourceObject<TResource extends BaseResource> = ResourceRequired<
  ResourceDto<TResource>
>;

/**
 * Base resource is used as a root base type in the type system.
 */
export const baseResource = createResource({
  type: baseResourceType,
  ids: {},
  idsOrder: [],
  authRoles: {},
  body: {},
  isBase: true,
});
export type BaseResource = typeof baseResource;
export type BaseResourceDto = ResourceDto<BaseResource>;
export type BaseResourceRef = ResourceRef<BaseResource>;

/**
 * Special empty resource type.
 *
 * Used as a default value instead of null, because null is reserved for defaults and patches.
 */
export const emptyResource = createResource({
  type: emptyResourceType,
  ids: {},
  idsOrder: [],
  authRoles: {},
  body: {},
  isBase: false,
});
export type EmptyResource = typeof emptyResource;
export type EmptyResourceDto = ResourceDto<EmptyResource>;
export type EmptyResourceRef = ResourceRef<EmptyResource>;
export const emptyResourceRef: EmptyResourceRef = {
  type: emptyResourceType,
};
export const emptyResourceDto: EmptyResourceDto = {
  ...emptyResourceRef,
  createdAtMs: 0,
  modifiedAtMs: 0,
};
export function isEmptyResourceRef(ref: BaseResourceRef) {
  return ref.type === emptyResourceRef.type;
}
export function isEmptyResourceDto(dto: BaseResourceDto) {
  return isEmptyResourceRef(dto);
}

//
// ids of resource
//
export type ResourceIds<TResource extends BaseResource> = Static<
  TResource["idsSchema"]
>;
export type ResourceBody<TResource extends BaseResource> = Static<
  TResource["body"]
>;

export const pickIds = <TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>
): ResourceIds<TResource> =>
  Object.fromEntries(
    Object.entries(ids).filter(([key]) => key in resource.ids)
  );
export const pickDtoIds = <TResource extends BaseResource>(
  resource: TResource,
  dto: ResourceDto<TResource>
): ResourceIds<TResource> => pickIds(resource, dto);

export const requiredResourceCreateIdKey = <TResource extends BaseResource>(
  resource: TResource
) => {
  const createIdKey = resource.createIdKey;
  if (createIdKey === undefined) {
    throw new Error(
      `Resource without createId cannot be used for POST. type:${resource.type}`
    );
  }
  return createIdKey;
};

export const resourcePostIdsOrder = <TResource extends BaseResource>(
  resource: TResource
) => {
  const createIdKey = requiredResourceCreateIdKey(resource);
  return resource.idsOrder.filter((idKey) => idKey !== createIdKey) as string[];
};

export const resourcePostIds = <TResource extends BaseResource>(
  resource: TResource
) => Type.Omit(resource.idsSchema, [requiredResourceCreateIdKey(resource)]);

//
// ref of resource
//
export const pickResourceRef = <TResource extends BaseResource>(
  resource: TResource,
  ref: ResourceRef<TResource>
): ResourceRef<TResource> =>
  Object.fromEntries(
    Object.entries(ref).filter(([key]) => key in resource.ref.properties)
  ) as ResourceRef<TResource>;

export type ResourceRef<TResource extends BaseResource> = Static<
  TResource["ref"]
>;
export const idsRef = <TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>
): ResourceRef<TResource> => ({
  type: resource.type,
  ...pickIds(resource, ids),
});

export function isRefType<TResource extends BaseResource>(
  resource: TResource,
  ref: BaseResourceRef
): ref is ResourceRef<TResource> {
  return ref.type === resource.type;
}

//
// idsModifiedAt of resource
//
export const resourceIdsModifiedAtSchema = <TResource extends BaseResource>(
  resource: TResource
) => Type.Composite([resource.idsSchema, modifiedAtSchema]);
export type ResourceIdsModifiedAt<TResource extends BaseResource> =
  ResourceIds<TResource> & Static<typeof modifiedAtSchema>;
export const pickDtoIdsModifiedAt = <TResource extends BaseResource>(
  resource: TResource,
  dto: ResourceDto<TResource>
): ResourceIdsModifiedAt<TResource> => ({
  ...pickDtoIds(resource, dto),
  modifiedAtMs: dto.modifiedAtMs,
});

//
// body of resource
//
export function pickDtoBody<TResource extends BaseResource>(
  resource: TResource,
  dto: ResourceDto<TResource>
): ResourceBody<TResource> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return Object.fromEntries(
    Object.entries(dto).filter(([key]) => key in resource.body.properties)
  );
}

//
// Operations on resources
//
export function putResource<TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>,
  oldDto: ResourceDto<TResource> | undefined,
  body: ResourceBody<TResource>
): ResourceDto<TResource> {
  if (oldDto && Value.Equal(pickDtoBody(resource, oldDto), body)) {
    return oldDto;
  }
  if (oldDto?.isDeleted === true) {
    throw new Error("Cannot modify deleted resource");
  }
  const now = Date.now();
  const result = {
    type: resource.type,
    createdAtMs: oldDto?.createdAtMs ?? now,
    ...body,
    ...pickIds(resource, ids),
    modifiedAtMs: now,
  };
  minifyValue(resource.schema, result);
  return result;
}

/**
 * @returns New patched object instance on change, oldDto object instance on no change
 */
export function patchResource<TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>,
  oldDto: ResourceDto<TResource> | undefined,
  patch: ResourceBody<TResource>
): ResourceDto<TResource> {
  const updatedResource = { ...oldDto, ...patch };
  if (oldDto && Value.Equal(oldDto, updatedResource)) {
    return oldDto;
  }
  if (oldDto?.isDeleted === true) {
    throw new Error("Cannot modify deleted resource");
  }
  const now = Date.now();
  const result = {
    type: resource.type,
    createdAtMs: now,
    ...(updatedResource satisfies ResourceBody<TResource> as ResourceBody<TResource>),
    modifiedAtMs: now,
    ...pickIds(resource, ids),
  };
  minifyValue(resource.schema, result);
  return result;
}

export function touchResource<TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>,
  oldDto: ResourceDto<TResource> | undefined
): ResourceDto<TResource> {
  if (oldDto?.isDeleted === true) {
    throw new Error("Cannot modify deleted resource");
  }
  const now = Date.now();
  return {
    type: resource.type,
    createdAtMs: oldDto?.createdAtMs ?? now,
    ...pickIds(resource, ids),
    modifiedAtMs: now,
  };
}

export const stringifyResourcePathImpl = <TResource extends BaseResource>(
  resource: TResource,
  idsOrder: string[],
  ids: ResourceIds<TResource>
) => {
  const idsPath = idsOrder
    .map((idKey) => `/${idKey}/${(ids as Record<string, string>)[idKey]}`)
    .join("");
  return `${idsPath}/${resource.type}`;
};

export const parseRefPath = (refPath: string): BaseResourceRef => {
  const pathParts = refPath.split("/");
  const type = pathParts.splice(0, 1)[0] ?? "";
  return chunk(pathParts, 2).reduce<Record<string, string>>(
    (a, [key, value]) => {
      a[key] = value;
      return a;
    },
    { type }
  ) as BaseResourceRef;
};

/**
 * Resource path in format `/:resourceType/:idKey0/:id0/:idKey1/:id1/...`
 */
export const stringifyResourcePath = <TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>
) => stringifyResourcePathImpl(resource, resource.idsOrder, ids);

/**
 * Post resource path used in POST routes in format `/:resourceType/:idKey0/:id0/:idKey1/:id1/...`
 */
export const stringifyPostPath = <TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>
) => stringifyResourcePathImpl(resource, resourcePostIdsOrder(resource), ids);

export function stringifyMethodPath<TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>,
  method: keyof TResource["methods"]
) {
  return `${stringifyResourcePath(resource, ids)}/${String(method)}`;
}

/** Hashes ref into v5 uuid */
export const refUuid = <TResource extends BaseResource>(
  resource: TResource,
  ref: BaseResourceRef
) =>
  uuid.v5(
    stringifyResourcePath(resource, ref),
    "a753e262-efbb-4709-aa29-c707e29db0ff"
  );

export function isResourceType<TResource extends BaseResource>(
  resource: TResource,
  dto: ResourceRequired<BaseResourceDto>
  // @ts-expect-error -- We've reached the limits of TypeScript here. Caller is responsible to have valid resource
): dto is ResourceRequired<ResourceDto<TResource>> {
  return dto.type === resource.type;
}

export function isNullDto(dto: ResourceRequired<BaseResourceDto>): boolean {
  return dto.createdAtMs === 0;
}

//
// Typebox utilities
//

/**
 * Omits extra typebox and resource properties from schema
 *
 * @returns Copy of schema without extra properties
 */
export const strictResourceSchema = <T extends TSchema>(schema: T): T => {
  const result = Type.Strict(schema);
  deleteResourceSchemaKeys(result);
  return result;
};
const deleteResourceSchemaKeys = (schema: TSchema) => {
  if ("resource" in schema) {
    // biome-ignore lint/performance/noDelete: we don't care about perfomance here
    delete schema.resource;
  }
  if (schema.type === "array") {
    deleteResourceSchemaKeys((schema as TArray).items);
  }
  if (schema.type === "object") {
    for (const [, property] of Object.entries(schema.properties ?? [])) {
      deleteResourceSchemaKeys(property as TSchema);
    }
    for (const [, property] of Object.entries(schema.patternProperties ?? [])) {
      deleteResourceSchemaKeys(property as TSchema);
    }
  }
  if (Array.isArray(schema.anyOf)) {
    for (const anyOfItem of schema.anyOf) {
      deleteResourceSchemaKeys(anyOfItem);
    }
  }
};

export const isResourceRefEqual = <TResource extends BaseResource>(
  resourceIn?: TResource,
  refIn?: ResourceRef<TResource>,
  otherIn?: BaseResourceRef
): boolean => {
  const resource = resourceIn ?? emptyResource;
  const ref = refIn ?? emptyResourceRef;
  const other = otherIn ?? emptyResourceRef;
  return resource.refOrder.reduce(
    (acc, key) =>
      acc &&
      (ref as Record<string, string>)[key] ===
        (other as Record<string, string>)[key],
    true
  );
};

export const areResourceIdsEqual = <TResource extends BaseResource>(
  resource: TResource,
  idsA: ResourceIds<TResource>,
  idsB: ResourceIds<TResource>
): boolean => {
  return resource.idsOrder.reduce(
    (acc, [key]) =>
      acc &&
      (idsA as Record<string, string>)[key] ===
        (idsB as Record<string, string>)[key],
    true
  );
};

/**
 * Populates dto with default values from schema into a value clone.
 */
export function resourceDtoToObject<TResource extends BaseResource>(
  resource: TResource,
  dto: ResourceDto<TResource>
): ResourceObject<TResource> {
  const clone = Value.Clone(dto);
  return valueWithDefaults(
    resource.schema,
    clone
  ) satisfies ResourceObject<BaseResource> as ResourceObject<TResource>;
}

/**
 * Populates maybe dto with default values from schema into a value clone.
 */
export function resourceMaybeDtoToObject<TResource extends BaseResource>(
  resource: TResource,
  dto: ResourceDto<TResource> | undefined
): ResourceObject<TResource> | undefined {
  if (dto === undefined) {
    return dto;
  }
  return resourceDtoToObject(resource, dto);
}

/**
 * Creates a dummy resource with defaults. You can provide some of the properties if you have them.
 */
export function dummyResourceObject<TResource extends BaseResource>(
  resource: TResource,
  value?: Partial<ResourceDto<TResource>>
): ResourceObject<TResource> {
  return resourceDtoToObject(resource, dummyResourceDto(resource, value));
}

/**
 * Creates a dummy resource instance. You can provide some of the properties if you have them.
 */
export function dummyResourceDto<TResource extends BaseResource>(
  resource: TResource,
  value?: Partial<ResourceDto<TResource>>
): ResourceDto<TResource> {
  return {
    ...Object.fromEntries(resource.idsOrder.map((idKey) => [idKey, ""])),
    createdAtMs: 0,
    type: resource.type,
    modifiedAtMs: 0,
    ...value,
  };
}
