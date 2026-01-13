// Socket.IO Main Handler
// Wires all socket handlers together
import { Server as SocketIOServer } from "socket.io";

// Import handlers
import { registerRoomHandlers, rooms } from "./handlers/room.js";
import { registerWebRTCHandlers } from "./handlers/webrtc.js";
import { registerChatHandlers } from "./handlers/chat.js";
import { registerScreenShareHandlers } from "./handlers/screenShare.js";
import { registerMemberAdminHandlers } from "./handlers/memberAdmin.js";
import { registerInvitationHandlers } from "./handlers/invitation.js";
import { registerUserSocket, unregisterSocketById } from "./userSocketMap.js";

/**
 * Initialize Socket.IO and register all handlers
 * @param {http.Server} server - The HTTP server
 * @param {string} corsOrigin - The CORS origin
 * @returns {Server} The Socket.IO server instance
 */
export const initializeSocketIO = (server, corsOrigin) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`👤 User connected: ${socket.id}`);

    // Register user socket for targeted notifications (invites, etc.)
    socket.on("register-user", (data) => {
      const { userId } = data;
      if (userId) {
        registerUserSocket(userId, socket.id);
        socket.emit("user-registered", { userId, socketId: socket.id });
        console.log(`📌 Registered user ${userId} with socket ${socket.id}`);
      }
    });

    // Cleanup on disconnect
    socket.on("disconnect", (reason) => {
      console.log(`👤 User disconnected: ${socket.id} (${reason})`);
      const userId = unregisterSocketById(socket.id);
      if (userId) {
        console.log(`📍 Unregistered user ${userId} from socket map`);
      }
    });

    // Register all handlers
    registerRoomHandlers(socket, io);
    registerWebRTCHandlers(socket, io);
    registerChatHandlers(socket, rooms);
    registerScreenShareHandlers(socket, rooms);
    registerMemberAdminHandlers(socket, io, rooms);
    registerInvitationHandlers(socket, io, rooms);
  });

  console.log("🔌 Socket.IO initialized with modular handlers");
  return io;
};

// Export rooms for REST endpoints
export { rooms };
