import {
  OptionalKind,
  TObject,
  TOptional,
  TSchema,
  Type,
} from "@sinclair/typebox";
import { BaseIdSchema, resourceTypeSchema } from "./resource-id.types.js";
import { assert } from "./assert.js";

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
