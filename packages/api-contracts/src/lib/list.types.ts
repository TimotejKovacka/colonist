import { type Static, type TSchema, Type } from "@sinclair/typebox";

import {
  createResource,
  type ResourceDto,
  type ResourceObject,
} from "./resource.types.js";
import { baseResourceType } from "./resource-id.types.js";

/**
 * Partial by keys.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * List provides paginated access to the unbounded array of items.
 */

export const listOffsetSchema = Type.Optional(
  Type.Integer({
    title: "Offset of the first queried item",
    default: 0,
    minimum: 0,
    multipleOf: 10,
    description: "Restricted to multiple of for more effective caching.",
  })
);

export const listQuerySchema = Type.Object({
  offset: listOffsetSchema,
});
export type ListQuery = Static<typeof listQuerySchema>;

export const listDefaultPageSize = 50;

export interface ListBodyOptions {
  pageSize: number;
}

export const listBodySchema = <TItemSchema extends TSchema>(
  itemSchema: TItemSchema,
  options: PartialBy<ListBodyOptions, "pageSize"> = {}
) => {
  const extra = {
    ...options,
    pageSize: options.pageSize ?? listDefaultPageSize,
  } satisfies ListBodyOptions;
  const body = {
    page: Type.Array(itemSchema, {
      maxItems: options.pageSize,
      title: "Queried subItems of all items",
    }),
    count: Type.Integer({ title: "Number of all items" }),
  };
  return { body, options: extra };
};
export const baseListBodySchema = listBodySchema(
  Type.Object({}, { additionalProperties: true })
);

export const baseListResource = createResource({
  type: baseResourceType,
  ids: {},
  idsOrder: [],
  authRoles: {},
  ...baseListBodySchema,
  isBase: true,
});
export type BaseListResource = typeof baseListResource;
export type BaseListDto = ResourceDto<BaseListResource>;
export type BaseList = ResourceObject<BaseListResource>;

export type OptionsOfListResource<TListResource extends BaseListResource> =
  TListResource["options"];
export const optionsOfListResource = <TListResource extends BaseListResource>(
  resource: TListResource
) => resource.options;

export type ItemOfList<TList extends BaseListDto> = NonNullable<
  TList["page"]
>[0];
