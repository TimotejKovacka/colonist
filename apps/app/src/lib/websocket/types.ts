import type {
  Manager,
  ManagerOptions,
  Socket,
  SocketOptions,
} from "socket.io-client";

export type IoNamespace = string;

export type NamespaceConnection = {
  socket: Socket;
  addSubscription: (subscription: Subscription) => void;
  removeSubscription: (subscription: Subscription) => void;
};

export type Subscription = {
  event: string;
  callback: (...args: any[]) => void;
};

export type NamespaceState = {
  socket: Socket;
  subscriptions: Set<Subscription>;
};

export type IoContextInterface = {
  manager: Manager;
  isConnected: boolean;
  connect: () => void;
  getNsp: (nsp: string) => NamespaceConnection;
};
