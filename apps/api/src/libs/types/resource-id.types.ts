import { Type } from "@sinclair/typebox";

export const resourceTypeSchema = <
  ResourceType extends string,
  IsBase extends boolean = boolean
>(
  type: ResourceType,
  {
    description,
    isBase = false as IsBase,
  }: { description?: string; isBase: IsBase }
) => {
  if (type.search("[-_]") >= 0) {
    throw new Error(`Type must be in cammelCase format type:${type}`);
  }
  if (isBase && type !== "") {
    throw new Error(`Base type must be empty string. type:${type}`);
  }
  return Type.Literal(type, {
    title: `${type} type`,
    description,
  });
};

export const baseResourceType = "" as string;

export const emptyResourceType = "" as const;
export const emptyResourceTypeSchema = resourceTypeSchema(emptyResourceType, {
  isBase: false,
});

export type ResourceId = string;

export const resourceIdSchema = <
  ResourceType extends string,
  Id extends ResourceId,
  AuthRole extends string | undefined = undefined // resource id can be used as auth id
>(
  type: ResourceType,
  { description, examples }: { description?: string; examples?: string[] } = {}
) => {
  const result = Type.String({
    title: `${type} id`,
    pattern: "[a-z0-9-]*",
    description,
    examples,
  });
  return result as unknown as typeof result & { static: Id; role: AuthRole };
};

export const baseIdSchema = resourceIdSchema<
  string,
  ResourceId,
  string | undefined
>(baseResourceType);
export type BaseIdSchema = typeof baseIdSchema;
