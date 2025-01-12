import type { Socket } from "socket.io-client";
import stableHash from "./utils/stable-hash";
import type { EventsMap, DefaultEventsMap } from "@socket.io/component-emitter";
import type {
  IoContextInterface,
  IoNamespace,
  SocketLike,
  UseSocketOptions,
  UseSocketReturnType,
} from "./types";
import { url } from "./utils/url";
import { unique } from "./utils/hash";
import { IoContext } from "./io.context";
import React from "react";

function useSocket<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = ListenEvents,
  SocketType extends Socket<ListenEvents, EmitEvents> = Socket<
    ListenEvents,
    EmitEvents
  >
>(options?: UseSocketOptions): UseSocketReturnType<SocketType>;
function useSocket<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = ListenEvents,
  SocketType extends Socket<ListenEvents, EmitEvents> = Socket<
    ListenEvents,
    EmitEvents
  >
>(
  namespace: IoNamespace,
  options?: UseSocketOptions
): UseSocketReturnType<SocketType>;
function useSocket<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = ListenEvents,
  SocketType extends Socket<ListenEvents, EmitEvents> = Socket<
    ListenEvents,
    EmitEvents
  >
>(
  namespace?: string | UseSocketOptions,
  options?: UseSocketOptions
): UseSocketReturnType<SocketType> {
  const isServer = typeof window === "undefined";
  if (isServer) {
    console.warn("Running webv");
    return {
      socket: new SocketMock(),
      connected: false,
      error: null,
    };
  }

  const opts = React.useMemo<{
    namespace: string;
    options: UseSocketOptions | undefined;
  }>(
    () => ({
      namespace: typeof namespace === "string" ? namespace : "",
      options: typeof namespace === "object" ? namespace : options,
    }),
    [namespace, options]
  );

  const urlConfig = url(
    opts.namespace,
    opts.options?.path || "/socket.io",
    opts.options?.port
  );
  const connectionKey = urlConfig.id;
  const hash = opts.options
    ? unique(
        stableHash(
          Object.entries(opts.options).reduce<Record<string, unknown>>(
            (acc, [k, v]) => {
              if (typeof v === "function") {
                return acc;
              }
              acc[k] = v;
              return acc;
            },
            {}
          )
        )
      )
    : "";
  const namespaceKey = `${connectionKey}${urlConfig.path}${hash}`;
  const enabled = opts.options?.enabled === undefined || opts.options.enabled;
  const { createConnection, getConnection } =
    React.useContext<IoContextInterface<SocketType>>(IoContext);

  const connection = getConnection(namespaceKey);

  const state = React.useRef<{
    socket: SocketLike<SocketType>;
    status: "connecting" | "connected" | "disconnected";
    error: Error | null;
  }>({
    socket: connection?.socket || new SocketMock(),
    status: connection?.state.status || "disconnected",
    error: null,
  });

  const [, rerender] = React.useState({});
  const connected = state.current.status === "connected";

  React.useEffect(() => {
    if (enabled) {
      const con = createConnection(namespaceKey, urlConfig, opts.options);
      if (!con) {
        return;
      }
      const { socket: _socket, cleanup, subscribe } = con;
      state.current.socket = _socket;

      const unsubscribe = subscribe((newState) => {
        let changed = false;
        if (state.current.status !== newState.status) {
          state.current.status = newState.status;
          changed = true;
        }
        if (state.current.error !== newState.error) {
          state.current.error = newState.error;
          changed = true;
        }
        if (changed) {
          rerender({});
        }
      });

      rerender({});

      return () => {
        unsubscribe();
        cleanup();
      };
    }
    return () => {};
  }, [enabled, namespaceKey, createConnection, urlConfig, opts]);

  return {
    socket: state.current.socket,
    error: state.current.error,
    connected,
  };
}

export { useSocket };
