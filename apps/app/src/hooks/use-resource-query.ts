import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api, type AxiosApiError, BASE_URL } from "@/api/base-api";
import { appLogger } from "@/main";
import {
  type BaseResource,
  ClientToServerEvents,
  dummyResourceObject,
  idsRef,
  isPatchOk,
  isPatchTooNew,
  querifyResourceIds,
  type ResourceDto,
  type ResourceIds,
  resourceMaybeDtoToObject,
  type ResourcePatch,
  type ResourceRequired,
  ServerToClientEvents,
  stringifyResourcePath,
} from "@pilgrim/api-contracts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applyPatch, generatePatch, type Logger } from "@pilgrim/utils";
import { useToastStore } from "@/stores/toast-store";
import { useWebSocket } from "@/contexts/ws-context";

type DataState<TResource extends BaseResource> = ResourceRequired<
  ResourceDto<TResource>
>;

export const useResourceQuery = <TResource extends BaseResource>(
  resource: TResource,
  ids: ResourceIds<TResource>,
  options: {
    query?: Record<string, string | boolean | number>;
    logger: Logger;
  } & Omit<UseQueryOptions, "queryKey"> = {
    logger: appLogger,
  }
) => {
  const { query, logger: parentLogger, ...useQueryOptions } = options;
  // const { client, isConnected } = useWebSocket();
  const { setPendingToast } = useToastStore();
  const queryClient = useQueryClient();
  const resourceQueryKey = querifyResourceIds(resource, ids);
  const finalQueryKey = options?.query
    ? [...resourceQueryKey, options.query]
    : resourceQueryKey;
  const resourcePath = stringifyResourcePath(resource, ids);
  const resourceRef = idsRef(resource, ids);
  const dummyData = useMemo(() => dummyResourceObject(resource), [resource]);
  const logger = parentLogger.child("useResourceQuery", {
    ids,
    resourceType: resource.type,
    resourceRef: resourceRef,
    resourcePath,
    queryKey: finalQueryKey,
  });

  const handleWsMessage = useCallback(
    (message: ResourcePatch) => {
      queryClient.setQueryData(
        finalQueryKey,
        (oldData?: DataState<TResource>) => {
          const currentData = oldData || dummyData;
          logger.debug("Current data", { oldData, dummyData, currentData });
          if (isPatchOk(currentData as ResourceDto<TResource>, message)) {
            // Create a new immutable object with the patch applied
            const patchedData = applyPatch<ResourceDto<TResource>>(
              structuredClone(currentData), // Create deep copy
              message.patch
            );

            // Create new object with defaults
            const dataWithDefaults = resourceMaybeDtoToObject(
              resource,
              patchedData
            );

            logger.debug("patch is ok, updating query data", {
              oldData: currentData,
              newData: dataWithDefaults,
            });

            return dataWithDefaults;
          }

          if (isPatchTooNew(currentData as ResourceDto<TResource>, message)) {
            logger.warn(
              `Patch is too new, need to refetch, (oldModifiedAtMs=${message.oldModifiedAtMs}, modifiedAtMs=${currentData.modifiedAtMs}, type=${resource.type})`
            );
            // Invalidate the query to trigger a refetch
            queryClient.invalidateQueries({ queryKey: finalQueryKey });
            return currentData;
          }

          // Return the current data if we can't update
          return currentData;
        }
      );
    },
    [resource, dummyData, logger, queryClient, finalQueryKey]
  );

  const { socket, error } = useSocket<
    ServerToClientEvents,
    ClientToServerEvents
  >();
  const { sendMessage } = useSocketEvent(socket, "patch", {
    onMessage: handleWsMessage,
  });

  // const sendWsPatch = useCallback(
  //   (body: ResourceDto<TResource>) => {
  //     const currentData =
  //       queryClient.getQueryData<ResourceDto<TResource>>(finalQueryKey);
  //     if (!currentData) {
  //       logger.warn("Trying to send a patch before having data");
  //       return;
  //     }
  //     const patch: ResourcePatch = {
  //       patch: generatePatch(currentData, body),
  //       oldModifiedAtMs: currentData.modifiedAtMs,
  //     };
  //     client.sendPatch(resourceRef, patch);
  //   },
  //   [finalQueryKey, client, queryClient, logger, resourceRef]
  // );

  // Subscribe to WebSocket updates
  // useEffect(() => {
  //   const subscribe = () => {
  //     logger.debug("Subscribing to resource", {
  //       isConnected: client.connected, // Log actual socket connection state
  //     });

  //     return client.subscribe(resourceRef, handleWsMessage);
  //   };

  //   let unsubscribe: (() => void) | undefined;
  //   if (client.connected) {
  //     unsubscribe = subscribe();
  //   }

  //   const handleConnect = () => {
  //     logger.debug("Socket connected, subscribing");
  //     unsubscribe = subscribe();
  //   };

  //   const handleDisconnect = () => {
  //     logger.debug("Socket disconnected, cleaning up subscription");
  //     if (unsubscribe) {
  //       unsubscribe();
  //       unsubscribe = undefined;
  //     }
  //   };

  //   const unsubConnect = client.on("connected", handleConnect);
  //   const unsubDisconnect = client.on("disconnected", handleDisconnect);

  //   return () => {
  //     if (unsubscribe) {
  //       unsubscribe();
  //     }
  //     unsubConnect();
  //     unsubDisconnect();
  //   };
  // }, [client, resourceRef, handleWsMessage, logger]);

  const queryResult = useQuery<
    ResourceRequired<ResourceDto<TResource>>,
    AxiosApiError,
    ResourceRequired<ResourceDto<TResource>>
  >({
    ...useQueryOptions,
    queryKey: finalQueryKey,
    queryFn: async () => {
      const url = new URL(`${BASE_URL}${resourcePath}`);
      for (const [key, value] of Object.entries(query || {})) {
        url.searchParams.set(key, String(value));
      }
      const response = await api.get<ResourceDto<TResource> | undefined>(
        url.toString()
      );
      return resourceMaybeDtoToObject(resource, response.data) || dummyData;
    },
    staleTime: Number.POSITIVE_INFINITY,
    placeholderData: dummyData, // TODO: figure out why this is causing type missmatch
  });

  return {
    ...queryResult,
    // sendPatch: sendWsPatch,
  };
};
