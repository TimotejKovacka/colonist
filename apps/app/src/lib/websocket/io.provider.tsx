import React from "react";
import { Manager } from "socket.io-client";
import { IoContext } from "./io.context";
import { NamespaceState, Subscription } from "./types";
import { Logger } from "@pilgrim/utils";

/**
 * Abstracts:
 * - namespace decoupling (only use 1 socket connection per namespace, so that multiplexing works as intended)
 *   - Connect & Disconnect are called once
 *   - On loosing last connection to namespace perform disconnect and manually delete namespace record from io underlying manager to preserve multiplexing
 * -
 */
const IoProvider: React.FC<React.PropsWithChildren<{ logger: Logger }>> = ({
  children,
  logger: baseLogger,
}) => {
  const logger = React.useMemo(
    () => baseLogger.child("IoProvider"),
    [baseLogger]
  );
  const socketLogger = React.useMemo(() => logger.child("Socket"), [logger]);
  const namespaceLogger = React.useMemo(
    () => logger.child("Namespace"),
    [logger]
  );
  const manager = React.useRef<Manager>();
  const namespaces = React.useRef<Map<string, NamespaceState>>(new Map());
  const [isConnected, setIsConnected] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (import.meta.hot) {
      logger.debug("HMR detected, cleaning up existing connections");

      // Force cleanup of any existing connections
      window.setTimeout(() => {
        const existingSockets = (window as any).__socketCleanup || [];
        existingSockets.forEach((socket: any) => {
          logger.debug("Cleaning up existing socket connection", {
            nsp: socket.nsp,
          });
          socket.disconnect();
        });
        (window as any).__socketCleanup = [];
      }, 0);
    }

    logger.info("Initializing Socket.IO manager", {
      path: `${import.meta.env.VITE_STREAM_HOST}/socket.io`,
      transports: ["websocket"],
      autoConnect: false,
    });

    manager.current = new Manager({
      autoConnect: false,
      transports: ["websocket"],
      path: `${import.meta.env.VITE_STREAM_HOST}/socket.io`,
    });

    // Store socket references for HMR cleanup
    if (import.meta.hot) {
      (window as any).__socketCleanup = (window as any).__socketCleanup || [];
    }

    manager.current.on("open", () => {
      logger.info("Manager connection established");
      setIsConnected(true);
    });

    manager.current.on("error", (error) => {
      logger.error("Manager connection error", { error });
    });

    manager.current.on("reconnect", (attempt) => {
      logger.info("Manager reconnected", { attempt });
    });

    manager.current.on("reconnect_attempt", (attempt) => {
      logger.debug("Manager attempting reconnection", { attempt });
    });

    manager.current.on("reconnect_error", (error) => {
      logger.error("Manager reconnection error", { error });
    });

    manager.current.on("reconnect_failed", () => {
      logger.error("Manager reconnection failed");
    });

    return () => {
      logger.info("Cleaning up manager and namespaces");

      namespaces.current.forEach((state, nsp) => {
        namespaceLogger.debug("Disconnecting namespace", { namespace: nsp });
        state.socket.disconnect();
      });

      namespaces.current.clear();
      manager.current?.engine.close();
      logger.info("Cleanup completed");
    };
  }, [logger, namespaceLogger]);

  React.useEffect(() => {
    if (!isConnected) {
      return;
    }

    logger.debug("Manager connected, connecting namespaces", {
      namespaceCount: namespaces.current.size,
    });

    namespaces.current.forEach((state, nsp) => {
      namespaceLogger.debug("Connecting namespace", {
        namespace: nsp,
        subscriptionCount: state.subscriptions.size,
      });
      state.socket.connect();
    });
  }, [isConnected, logger, namespaceLogger]);

  const connect = React.useCallback(() => {
    logger.info("Manually connecting manager");
    manager.current?.connect();
  }, [logger]);

  const getNamespaceConnection = React.useCallback(
    (nsp: string) => {
      if (!manager.current) {
        const error = "Socket.IO Manager not initialized";
        logger.error(error);
        throw new Error(error);
      }

      // Get or create namespace state
      if (!namespaces.current.has(nsp)) {
        namespaceLogger.info("Creating new namespace connection", {
          namespace: nsp,
        });
        const socket = manager.current.socket(nsp);

        // Socket-specific logging
        socket.on("connect", () => {
          socketLogger.info("Namespace socket connected", { namespace: nsp });
        });

        socket.on("disconnect", (reason) => {
          socketLogger.info("Namespace socket disconnected", {
            namespace: nsp,
            reason,
          });
        });

        socket.on("error", (error) => {
          socketLogger.error("Namespace socket error", {
            namespace: nsp,
            error,
          });
        });

        socket.on("reconnect", (attempt) => {
          socketLogger.info("Namespace socket reconnected", {
            namespace: nsp,
            attempt,
          });
        });

        // Set up namespace state
        namespaces.current.set(nsp, {
          socket,
          subscriptions: new Set(),
        });

        namespaceLogger.debug("Namespace state initialized", {
          namespace: nsp,
          isConnected: socket.connected,
        });
      }

      const nspState = namespaces.current.get(nsp);
      if (!nspState) {
        const error = "Missing namespace state";
        logger.error(error, { namespace: nsp });
        throw new Error(error);
      }

      const addSubscription = (subscription: Subscription) => {
        namespaceLogger.debug("Adding subscription", {
          namespace: nsp,
          event: subscription.event,
          currentSubscriptions: nspState.subscriptions.size,
        });

        nspState.subscriptions.add(subscription);
        nspState.socket.on(subscription.event, subscription.callback);

        namespaceLogger.trace("Subscription added", {
          namespace: nsp,
          event: subscription.event,
          newSubscriptionCount: nspState.subscriptions.size,
        });
      };

      const removeSubscription = (subscription: Subscription) => {
        namespaceLogger.debug("Removing subscription", {
          namespace: nsp,
          event: subscription.event,
          currentSubscriptions: nspState.subscriptions.size,
        });

        nspState.subscriptions.delete(subscription);
        nspState.socket.off(subscription.event, subscription.callback);

        // If no more subscriptions, disconnect and cleanup namespace
        if (nspState.subscriptions.size === 0) {
          namespaceLogger.info("No more subscriptions, cleaning up namespace", {
            namespace: nsp,
          });

          nspState.socket.disconnect();
          namespaces.current.delete(nsp);

          namespaceLogger.debug("Namespace cleaned up", { namespace: nsp });
        } else {
          namespaceLogger.trace("Subscription removed", {
            namespace: nsp,
            event: subscription.event,
            remainingSubscriptions: nspState.subscriptions.size,
          });
        }
      };

      return {
        socket: nspState.socket,
        addSubscription,
        removeSubscription,
      };
    },
    [logger, socketLogger, namespaceLogger]
  );

  return (
    <IoContext.Provider
      value={{
        manager: manager.current!,
        isConnected,
        connect,
        getNsp: getNamespaceConnection,
      }}
    >
      {children}
    </IoContext.Provider>
  );
};

export { IoProvider };
