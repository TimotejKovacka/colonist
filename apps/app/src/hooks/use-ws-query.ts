import { wsManager } from "@/lib/ws";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface WebSocketQueryOptions<T> {
  queryKey: string[];
  initialFetch?: () => Promise<T>;
  wsEvent: string;
  select?: (data: T) => T;
  onData?: (data: T) => void;
}

export function useWebSocketQuery<T>({
  queryKey,
  initialFetch,
  wsEvent,
  select,
  onData,
}: WebSocketQueryOptions<T>) {
  const queryClient = useQueryClient();

  // Set up WebSocket subscription
  useEffect(() => {
    const unsubscribe = wsManager.subscribe<T>(wsEvent, (data) => {
      // Update query cache with new data
      queryClient.setQueryData(queryKey, (oldData: T | undefined) => {
        // TODO: this should be done differently
        const newData = select ? select(data) : data;
        onData?.(newData);
        return newData;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [queryKey, wsEvent, onData, select, queryClient]);

  // Regular query with initial fetch
  return useQuery({
    queryKey,
    queryFn: initialFetch,
    staleTime: Number.POSITIVE_INFINITY, // Data is never stale since we update via WebSocket
  });
}
