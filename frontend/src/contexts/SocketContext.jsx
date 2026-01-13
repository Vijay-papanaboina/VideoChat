import { createContext, useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useAuthState } from "../stores/authStore";

const SocketContext = createContext(null);

/**
 * SocketProvider - Manages a single shared socket connection for the entire app
 * Socket connects when user is authenticated and registers userId for targeted notifications
 */
export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuthState();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    // Only connect if authenticated
    if (!isAuthenticated || !user?.id) {
      // Cleanup existing socket if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setSocketReady(false);
      }
      return;
    }

    // Don't create new socket if one already exists
    if (socketRef.current?.connected) {
      return;
    }

    const serverUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

    console.log("🔌 Creating shared socket connection...");
    socketRef.current = io(serverUrl, {
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Shared socket connected:", socket.id);
      setIsConnected(true);

      // Register this socket with user ID for targeted notifications
      socket.emit("register-user", { userId: user.id });
      console.log("📌 Registering user socket:", user.id);
      setSocketReady(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Shared socket disconnected:", reason);
      setIsConnected(false);
      setSocketReady(false);
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 Shared socket connection error:", error.message);
      setIsConnected(false);
    });

    socket.on("user-registered", (data) => {
      console.log("✅ User registered with socket:", data);
    });

    return () => {
      if (socketRef.current) {
        console.log("🔌 Cleaning up shared socket...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setSocketReady(false);
      }
    };
  }, [isAuthenticated, user?.id]);

  const value = {
    socket: socketRef.current,
    socketRef,
    isConnected,
    socketReady,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

/**
 * useSocket - Hook to access the shared socket
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;
