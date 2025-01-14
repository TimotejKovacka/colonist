import React from "react";
import { IoContext } from "./io.context";
import { Subscription } from "./types";
import { Logger } from "@pilgrim/utils";

interface UseSocketEventOptions {
  enabled?: boolean;
  logger?: Logger;
}

const useSocketEvent = <T,>(
  namespace: string,
  event: string,
  callback: (data: T) => void,
  options: UseSocketEventOptions = { enabled: true }
) => {
  const context = React.useContext(IoContext);
  if (context === null) {
    throw new Error("Can't be used outside of IoContextProvider");
  }

  const { enabled, logger: baseLogger } = options;
  const logger = React.useMemo(() => {
    if (!baseLogger) return null;
    return baseLogger.child("useSocketEvent", {
      namespace,
      event,
      hookId: Math.random().toString(36).slice(2, 9), // Unique identifier for this hook instance
    });
  }, [baseLogger, namespace, event]);
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    if (!enabled) {
      logger?.debug("Hook disabled, skipping subscription");
      return;
    }

    logger?.info("Setting up socket event subscription", {
      socketConnected: context.isConnected,
    });

    const wrappedCallback = (...args: any[]) => {
      try {
        logger?.debug("Executing event callback", { event });
        callbackRef.current(...args);
      } catch (error) {
        logger?.error("Error in event callback", { error, event });
      }
    };

    const subscription: Subscription = {
      event,
      callback: wrappedCallback,
    };

    try {
      const nspConnection = context.getNsp(namespace);

      logger?.debug("Socket connected, adding subscription");
      nspConnection.addSubscription(subscription);
      logger?.debug("Added subscription", { namespace, event });

      // Set up connection state monitoring
      const handleConnect = () => {
        logger?.info("Socket connected, adding delayed subscription");
        nspConnection.addSubscription(subscription);
      };

      const handleDisconnect = (reason: string) => {
        logger?.info("Socket disconnected", { reason });
      };

      nspConnection.socket.on("connect", handleConnect);
      nspConnection.socket.on("disconnect", handleDisconnect);

      // Cleanup function
      return () => {
        logger?.info("Cleaning up socket event subscription");

        // Remove state monitors
        nspConnection.socket.off("connect", handleConnect);
        nspConnection.socket.off("disconnect", handleDisconnect);

        // Remove subscription
        try {
          nspConnection.removeSubscription(subscription);
          logger?.debug("Subscription removed successfully");
        } catch (error) {
          logger?.error("Error removing subscription", { error });
        }
      };
    } catch (error) {
      logger?.error("Error setting up socket subscription", { error });
      throw error;
    }
  }, [enabled, namespace, event, wrappedCallback, context, logger]);

  return {
    isConnected: context.isConnected ?? false,
  };
};

export { useSocketEvent };
