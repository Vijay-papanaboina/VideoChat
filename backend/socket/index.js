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
