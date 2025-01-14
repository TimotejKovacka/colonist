import React from "react";
import { IoContext } from "./io.context";
import { BaseResource, ClientToServerEvents } from "@pilgrim/api-contracts";
import { Logger } from "@pilgrim/utils";

type UseSocketEmitOptons = {
  enabled?: boolean;
  logger?: Logger;
};

const useSocketEmit = <
  TResource extends BaseResource,
  EventName extends keyof ClientToServerEvents<TResource>,
  EventArgs extends Parameters<ClientToServerEvents<TResource>[EventName]>
>(
  namespace: string,
  options: UseSocketEmitOptons = { enabled: true }
) => {
  const context = React.useContext(IoContext);
  if (context === null) {
    throw new Error("Can't be used outside of IoContextProvider");
  }
  const { enabled, logger: baseLogger } = options;

  const logger = React.useMemo(() => {
    if (!baseLogger) return null;
    return baseLogger.child("useSocketEmit", {
      namespace,
      hookId: Math.random().toString(36).slice(2, 9), // Unique identifier for this hook instance
    });
  }, [baseLogger, namespace, event]);

  const emit = React.useCallback(
    (event: EventName, ...args: EventArgs) => {
      if (!options.enabled) {
        logger?.debug("Hook is disabled", { event, ...args });
        return;
      }
      const nspConnection = context.getNsp(namespace);
      if (!nspConnection.socket.connected) {
        logger?.warn(
          `Cannot emit ${event}: Socket is not connected, event is queued`,
          { event, ...args }
        );
      }
      logger?.trace("Emitting event", { event, ...args });
      nspConnection.socket.emit(event, ...args);
    },
    [namespace, enabled, context, logger]
  );

  return { emit };
};

export { useSocketEmit };
