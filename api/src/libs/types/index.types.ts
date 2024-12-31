import { type Static, Type } from "@sinclair/typebox";

import { listDefaultPageSize, listQuerySchema } from "./list.types.js";
import {
  type BaseResource,
  baseResource,
  type BaseResourceDto,
  createResource,
  idsRef,
  isResourceRefEqual,
  type ResourceDto,
  type ResourceObject,
  type ResourceRef,
} from "./resource.types.js";
import { baseResourceType, emptyResourceType } from "./resource-id.types.js";

/**
 * Index stores sorted list of refs and provides paginated access to the dereferenced items.
 */

export const indexQuerySchema = Type.Composite([
  listQuerySchema,
  Type.Object({
    withDeleted: Type.Optional(
      Type.Boolean({ title: "Include deleted items" })
    ),
  }),
]);
export type IndexQuery = Static<typeof indexQuerySchema>;

/**
 * Resource body of a heterogenous index - index items may be of more resource types.
 *
 * The result is intended to be passed to createResource arguments.
 */
export const createHeteroIndexResourceBody = <
  BaseItemResource extends BaseResource
>({
  itemResources,
  sortKey,
  pageSize,
  baseItemResource,
}: {
  /**
   * List of resources that can be in the index. Used to dereference the refs in the index.
   */
  itemResources: BaseResource[];
  sortKey: (items: BaseResourceDto) => number; // maps resource to its sort key
  pageSize?: number;

  /**
   * Item resource used to represent the item in the list / page.
   *
   * At the first glance, `oneOf(itemResources)` seems like the obvious answer.
   * But there are 2 problems:
   * * Clients shall be ready work with new unknown item resource for forward compatibility reasons.
   *   So it needs to be `oneOf(emptyBaseResource, ... itemResources)`
   *
   * * Typescript gives up compilation of the oneOf dto item type from tuple of resources due to complexity reasons. Ideas:
   * * * written differently to make typescript happy?
   * * * generate the code of resource definitions? The `dto1 | dto2` discriminated union compiles for 2 resource dtos.
   * * * optimize typescript?
   */
  baseItemResource: BaseItemResource;
}) => {
  const options = {
    items: itemResources,
    baseItemResource,
    sortKey,
    pageSize: pageSize ?? listDefaultPageSize,
  };
  const body = {
    page: Type.Record(
      Type.String(),
      Type.Union(itemResources.map((itemResource) => itemResource.schema)),
      {
        maxProperties: pageSize,
        title: "Queried page of resolved references",
      }
    ),
    count: Type.Integer({ title: "Number of all references in the index." }),
    refModifiedAt: Type.Number({
      title: "Modification timestamp of references",
      description:
        "Changes when an any item is added, removed or reordered in the index.",
    }),
  };
  return { body, options };
};

/**
 * Resource body of a homogenous index - all index items are of the same resource type.
 *
 * The result is intended to be passed to createResource arguments.
 */
export const createIndexResourceBody = <TItemResource extends BaseResource>({
  itemResource,
  sortKey,
  pageSize,
}: {
  itemResource: TItemResource;
  sortKey: (items: BaseResourceDto) => number; // maps resource to its sort key
  pageSize?: number;
}) =>
  createHeteroIndexResourceBody({
    itemResources: [itemResource],
    sortKey,
    pageSize,
    baseItemResource: itemResource,
  });

export const baseIndexBodyResource = createHeteroIndexResourceBody({
  itemResources: [baseResource],
  baseItemResource: baseResource,
  sortKey: (resource) => -resource.createdAtMs,
});
export const baseIndexResource = createResource({
  type: baseResourceType,
  ids: {},
  idsOrder: [],
  authRoles: {},
  ...baseIndexBodyResource,
  query: indexQuerySchema,
  isBase: true,
});
export type BaseIndexResource = typeof baseIndexResource;
export type BaseIndexDto = ResourceDto<BaseIndexResource>;

export type IndexResourceBaseItemResource<
  TIndexResource extends BaseIndexResource
> = TIndexResource["options"]["baseItemResource"];

export type IndexResourceBaseItemDto<TIndexResource extends BaseIndexResource> =
  ResourceDto<IndexResourceBaseItemResource<TIndexResource>>;

export type IndexResourceBaseItemObject<
  TIndexResource extends BaseIndexResource
> = ResourceObject<IndexResourceBaseItemResource<TIndexResource>>;

export type IndexResourceBaseItemRef<TIndexResource extends BaseIndexResource> =
  ResourceRef<IndexResourceBaseItemResource<TIndexResource>>;

export const isIndexItemRefEqual = <TIndexResource extends BaseIndexResource>(
  indexResource: TIndexResource,
  ref1: IndexResourceBaseItemRef<TIndexResource> | undefined,
  ref2: IndexResourceBaseItemRef<TIndexResource> | undefined
) => {
  const itemResource = indexResource.options.items.find(
    (x) => x.type === (ref1?.type ?? emptyResourceType)
  );
  if (itemResource === undefined) return false;
  return isResourceRefEqual(itemResource, ref1, ref2);
};

export const indexItemRef = <IIndexResource extends BaseIndexResource>(
  indexResource: IIndexResource,
  dto: IndexResourceBaseItemDto<IIndexResource>
): ResourceRef<IndexResourceBaseItemResource<IIndexResource>> => {
  const itemResource = indexResource.options.items.find(
    (itemResource) => itemResource.type === dto.type
  );
  if (!itemResource) {
    throw new Error(`Unexpected resource type for ${indexResource.type}`);
  }
  return idsRef(itemResource, dto);
};

/** The backend sends us a page as an object. This function transforms that into an array, using the sort key defined by the resource. */
export function indexPageAsArray<TIndexResource extends BaseIndexResource>(
  indexResource: TIndexResource,
  dto: ResourceObject<TIndexResource> | undefined
): IndexResourceBaseItemObject<TIndexResource>[] {
  if (!dto) {
    return [];
  }

  const unsorted = Object.values(
    dto.page
  ) as IndexResourceBaseItemObject<TIndexResource>[];

  const getSortKey = indexResource.options.sortKey;

  return unsorted.sort(
    (a, b) =>
      getSortKey(a as unknown as BaseResourceDto) -
      getSortKey(b as unknown as BaseResourceDto)
  );
}
