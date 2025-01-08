import { useEffect, createContext, useContext, useState } from "react";
import { wsManager } from "@/lib/ws";

type WebSocketContextType = {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    wsManager.subscribe("connected", handleConnect);
    wsManager.subscribe("disconnected", handleDisconnect);

    // Initial connection
    wsManager.connect();

    return () => {
      wsManager.disconnect();
    };
  }, []);

  const value = {
    isConnected,
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
  };

  return (
    <WebSocketContext.Provider value={value}>
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
