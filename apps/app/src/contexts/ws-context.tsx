import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { WebSocketClient } from "@/lib/websocket/websocket.client";
import { ConsoleLogger } from "@pilgrim/utils";

type WebSocketContextType = {
  isConnected: boolean;
  client: WebSocketClient;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);
const logger = new ConsoleLogger({ module: "WebSocketContext" });

export function WebSocketProvider({
  children,
  url,
}: {
  children: React.ReactNode;
  url: string;
}) {
  const client = useMemo(() => new WebSocketClient(url), [url]);
  const [isConnected, setIsConnected] = useState(() => client.isConnected);

  const handleConnect = useCallback(() => {
    logger.debug("Socket connected");
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    logger.debug("Socket disconnected");
    setIsConnected(false);
  }, []);

  useMemo(() => {
    logger.debug("Setting up connection handlers");
    client.on("connected", handleConnect);
    client.on("disconnected", handleDisconnect);
  }, [client, handleConnect, handleDisconnect]);

  const contextValue = useMemo(
    () => ({ client, isConnected }),
    [client, isConnected]
  );

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
};
