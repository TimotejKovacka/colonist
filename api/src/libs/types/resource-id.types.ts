import { Type } from "@sinclair/typebox";

export const resourceTypeSchema = <ResourceType extends string>(
  type: ResourceType,
  { description }: { description?: string }
) => {
  if (type.search("[-_]") >= 0) {
    throw new Error(`Type must be in cammelCase format type:${type}`);
  }
  return Type.Literal(type, {
    title: `${type} type`,
    description,
  });
};

export const baseResourceType = "" as string;

export const emptyResourceType = "" as const;
export const emptyResourceTypeSchema = resourceTypeSchema(
  emptyResourceType,
  {}
);

export type ResourceId = string;

export const resourceIdSchema = <
  ResourceType extends string,
  Id extends ResourceId
>(
  type: ResourceType,
  { description }: { description?: string }
) => {
  const result = Type.String({
    title: `${type} id`,
    description,
    pattern: "[a-z0-9-]*",
  });
  return result as unknown as typeof result & { static: Id };
};

export const baseIdSchema = resourceIdSchema<string, ResourceId>(
  baseResourceType,
  {}
);
export type BaseIdSchema = typeof baseIdSchema;
