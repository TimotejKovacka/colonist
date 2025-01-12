import type {
  DefaultEventsMap,
  EventNames,
  EventsMap,
} from "@socket.io/component-emitter";
import type {
  IoContextInterface,
  SocketLike,
  UseSocketEventOptions,
  UseSocketEventReturnType,
  UseSocketOptions,
} from "./types";
import type { Socket } from "socket.io-client";
import { useSocket } from "./use-socket";
import { noop } from "../utils/noop";
import { useContext } from "react";
import { IoContext } from "./io.context";
import React from "react";

type Parameter<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P[0]
  : never;

function useSocketEvent<
  T = never,
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = ListenEvents,
  EventKey extends EventNames<ListenEvents> = EventNames<ListenEvents>,
  ListenMessageType = [T] extends [never]
    ? Parameter<ListenEvents[EventKey]>
    : T,
  EmitMessageArgs extends any[] = Parameters<
    EmitEvents[EventNames<EmitEvents>]
  >,
  //TODO: infer from last argument returntype(cb) of EmitEvents[EventKey]
  // if last argument is a function then infer return type
  // if last argument is not a function then infer void
  EmitMessageCbReturnType = any
>(
  socket: EventKey | SocketLike<Socket<ListenEvents, EmitEvents>>,
  event:
    | EventKey
    | (UseSocketEventOptions<ListenMessageType> & UseSocketOptions),
  options?: UseSocketEventOptions<ListenMessageType>
): UseSocketEventReturnType<
  ListenMessageType,
  EmitMessageArgs,
  EmitMessageCbReturnType
> {
  let enabled = true;
  let actualSocket = socket;
  let actualEvent = event;
  let actualOptions = options;
  if (typeof socket === "string") {
    const _options = event as
      | (UseSocketEventOptions<ListenMessageType> & UseSocketOptions)
      | undefined;
    actualOptions = _options;
    enabled = _options?.enabled ?? true;
    actualEvent = socket;
    actualSocket = useSocket(_options).socket;
  }

  const onMessage = options?.onMessage || noop;
  let keepPrevious = options?.keepPrevious;
  //   if (options) {
  //     onMessage = options.onMessage;
  //     keepPrevious = options.keepPrevious;
  //   }

  const ioContext = useContext<IoContextInterface<SocketLike>>(IoContext);
  const { registerSharedListener, getConnection } = ioContext;
  const connection = enabled
    ? getConnection((socket as SocketLike).namespaceKey)
    : null;
  const [, rerender] = React.useState({});
  const state = React.useRef<{
    socket: SocketLike;
    status: "connecting" | "connected" | "disconnected";
    error: Error | null;
    lastMessage: ListenMessageType;
  }>({
    socket: connection?.socket || new SocketMock(),
    status: connection?.state.status || "disconnected",
    error: null,
    lastMessage: connection?.state.lastMessage[
      event as string
    ] as ListenMessageType,
  });

  const sendMessage = (...message: EmitMessageArgs) =>
    new Promise<EmitMessageCbReturnType>((resolve, _reject) => {
      (socket as SocketLike).emit(
        event as string,
        ...message,
        (response: EmitMessageCbReturnType) => {
          resolve(response);
        }
      );
    });

  React.useEffect(() => {
    if (!connection) return;
    const cleanup = registerSharedListener(
      (socket as SocketLike).namespaceKey,
      event as string
    );
    const unsubscribe = connection.subscribe((newState, _event) => {
      let changed = false;

      if (state.current.status !== newState.status) {
        state.current.status = newState.status;
        changed = true;
      }
      if (state.current.error !== newState.error) {
        state.current.error = newState.error;
        changed = true;
      }

      if (
        _event === "message" &&
        state.current.lastMessage !== newState.lastMessage[event as string]
      ) {
        const lastMessage = newState.lastMessage[event as string];
        state.current.lastMessage = lastMessage;
        if (onMessage) {
          onMessage(lastMessage);
        }
        changed = true;
      }

      if (changed) {
        rerender({});
      }
    });
    return () => {
      unsubscribe();
      if (!keepPrevious) {
        cleanup();
      }
    };
  }, [
    socket,
    connection,
    event,
    keepPrevious,
    onMessage,
    registerSharedListener,
  ]);

  return { ...state.current, sendMessage };
}

export { useSocketEvent };
