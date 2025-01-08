import { useQuery } from "@tanstack/react-query";
import { api, type AxiosApiError } from "@/api/base-api";
import { appLogger } from "@/main";
import {
  type BaseResource,
  dummyResourceObject,
  querifyResourceIds,
  type ResourceDto,
  resourceDtoToObject,
  type ResourceIds,
  type ResourceObject,
  stringifyResourcePath,
} from "@colonist/api-contracts";
import type { DefinedInitialDataOptions } from "@tanstack/react-query";

export const useResourceQuery = <TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>
) =>
  useQuery({
    ...resourceUseQueryOptions(resource, ids),
  });

export function resourceUseQueryOptions<TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>
): DefinedInitialDataOptions<
  ResourceObject<TResource>,
  AxiosApiError,
  ResourceObject<TResource>
> {
  const resourceQueryKey = querifyResourceIds(resource, ids);
  const resourcePath = stringifyResourcePath(resource, ids);
  const dummyData = dummyResourceObject(resource);
  return {
    queryKey: resourceQueryKey,
    queryFn: async () => {
      const response = await api.get<ResourceDto<TResource>>(resourcePath);
      const object = resourceDtoToObject(resource, response.data);
      appLogger.info(`resourceUseQuery::${resourceQueryKey.join()}`, object);
      return object;
    },
    staleTime: 0,
    initialData: dummyData,
  };
}
