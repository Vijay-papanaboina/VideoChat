// Import required modules
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
dotenv.config();

// Import routes
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

// Import middleware
import { errorHandler, notFound } from "./src/middleware/errorHandler.js";

// Import services for cleanup and room tracking
import { chatService } from "./src/services/chatService.js";
import { roomService } from "./src/services/roomService.js";

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:4000",
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

// Use CORS middleware for Express
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4000",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// In-memory data stores for rooms and their users
// rooms structure: { roomId: { password: "...", users: { socketId: "username", ... }, screenSharing: { username: { isSharing: boolean } } } }
const rooms = {};
const MAX_USERS_PER_ROOM = 100; // Allow up to 100 users per room

// Function to delete all messages for a room when it's destroyed
const deleteRoomMessages = async (roomId) => {
  try {
    await chatService.deleteRoomMessages(roomId);
  } catch (error) {
    console.error(`❌ Failed to delete messages for room ${roomId}:`, error);
  }
};

// A simple root route for health checks
app.get("/", (req, res) => {
  res.json({ message: "Video Call Server is running" });
});

// Room check endpoint
app.post("/api/rooms/check", (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    const room = rooms[roomId];

    if (!room) {
      return res.json({
        success: true,
        exists: false,
        isActive: false,
      });
    }

    const memberCount = Object.keys(room.users || {}).length;

    res.json({
      success: true,
      exists: true,
      isActive: room.isActive !== false,
      isPermanent: room.isPermanent || false,
      isInviteOnly: room.isInviteOnly || false,
      memberCount: memberCount,
      requiresPassword: !!room.password,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
    });
  } catch (error) {
    console.error("Room check error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Handle new socket connections
io.on("connection", (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Event listener for a user joining a room
  socket.on("join-room", async (data) => {
    const { roomId, password, username, userId = null } = data;

    // --- Room Validation ---
    // If the room doesn't exist, create it with the provided password
    if (!rooms[roomId]) {
      const isPermanentRoom = userId !== null; // Permanent rooms are created by logged-in users

      rooms[roomId] = {
        password: password,
        users: {},
        screenSharing: {},
        isActive: true,
        createdBy: userId, // Track who created the room
        createdAt: new Date(),
        admins: userId ? [userId] : [], // Creator is the first admin
        isPermanent: isPermanentRoom, // Distinguish room types
        isInviteOnly: isPermanentRoom, // Permanent rooms are invite-only
      };
      console.log(
        `🚪 ${
          isPermanentRoom ? "Permanent" : "Temporary"
        } room created: ${roomId} by user: ${userId || "anonymous"}`
      );

      // Track room session in database for analytics
      try {
        await roomService.createRoomSession(roomId);
      } catch (error) {
        console.error(`❌ Failed to create room session in DB:`, error);
        // Continue with room creation even if DB fails
      }
    } else {
      // Room exists, check if user is trying to create a room that already exists
      const existingRoom = rooms[roomId];
      if (existingRoom.isPermanent && !existingRoom.isActive) {
        socket.emit("join-error", {
          message:
            "This room is temporarily unavailable. It may be under maintenance or has been deactivated.",
        });
        console.log(
          `🚫 Access denied to inactive permanent room ${roomId} from ${socket.id}`
        );
        return;
      }
    }

    // Check room access permissions
    if (rooms[roomId].isInviteOnly) {
      // For invite-only rooms, check if user is invited or is the creator
      if (rooms[roomId].createdBy !== userId) {
        socket.emit("join-error", {
          message: "This room is invite-only. You need an invitation to join.",
        });
        console.log(
          `🚫 Access denied to invite-only room ${roomId} from ${socket.id}`
        );
        return;
      }
    } else {
      // For temporary rooms, check password
      if (rooms[roomId].password !== password) {
        socket.emit("join-error", { message: "Invalid room password." });
        console.log(`🚫 Invalid password for room ${roomId} from ${socket.id}`);
        return;
      }
    }

    // Check if the room is already full
    const userCount = Object.keys(rooms[roomId].users).length;
    console.log(
      `📊 Room ${roomId} currently has ${userCount} users, max allowed: ${MAX_USERS_PER_ROOM}`
    );

    if (userCount >= MAX_USERS_PER_ROOM) {
      socket.emit("room-full");
      console.log(
        `🈵 Room ${roomId} is full (${userCount}/${MAX_USERS_PER_ROOM} users). Connection rejected for ${socket.id}`
      );
      return;
    }

    // --- Join Logic ---
    // Reactivate room if it was empty
    if (rooms[roomId].isActive === false) {
      rooms[roomId].isActive = true;
      console.log(`🔄 Reactivating room ${roomId} - user rejoining`);
    }

    // Add the user to the room and join the socket to the room's channel
    const isAdmin = rooms[roomId].admins.includes(userId);
    rooms[roomId].users[socket.id] = {
      username,
      userId,
      joinedAt: new Date(),
      isAdmin: isAdmin,
      socketId: socket.id,
    };
    socket.join(roomId);
    console.log(
      `👤 User ${username} (${socket.id}) joined room: ${roomId} as ${
        isAdmin ? "admin" : "member"
      }`
    );

    // Get a list of all other users currently in the room with their usernames
    // Safety check: ensure room still exists
    if (!rooms[roomId] || !rooms[roomId].users) {
      console.log(
        `⚠️ Room ${roomId} no longer exists, user ${username} cannot join`
      );
      socket.emit("join-error", { message: "Room no longer exists." });
      return;
    }

    const otherUsers = Object.keys(rooms[roomId].users)
      .filter((id) => id !== socket.id)
      .map((id) => ({
        socketId: id,
        username: rooms[roomId].users[id].username,
        isAdmin: rooms[roomId].users[id].isAdmin,
        userId: rooms[roomId].users[id].userId,
      }));

    // Send the list of other users to the new user
    socket.emit("all-users", otherUsers);

    // Send current screen sharing state to the new user
    if (
      rooms[roomId].screenSharing &&
      Object.keys(rooms[roomId].screenSharing).length > 0
    ) {
      console.log(
        "📤 Sending screen sharing state to new user:",
        rooms[roomId].screenSharing
      );
      socket.emit("initial-screen-sharing-state", rooms[roomId].screenSharing);
    }

    // Notify all other users in the room that a new user has joined
    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
      username,
      isAdmin: isAdmin,
      userId: userId,
    });
  });

  // Forward WebRTC signaling offers to the target user
  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  // Forward WebRTC signaling answers to the target user
  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  // Forward ICE candidates to the target user
  socket.on("ice-candidate", (payload) => {
    // Add sender field for proper handling on client side
    const payloadWithSender = {
      ...payload,
      sender: socket.id,
    };
    io.to(payload.target).emit("ice-candidate", payloadWithSender);
  });

  // Handle screen sharing events
  socket.on("screen-share-started", (data) => {
    console.log(
      `📺 ${data.username} started screen sharing in room ${data.roomId}`
    );

    // Update room's screen sharing state
    if (rooms[data.roomId]) {
      rooms[data.roomId].screenSharing[data.username] = { isSharing: true };
    }

    console.log(
      "📤 Broadcasting user-screen-sharing event to room:",
      data.roomId
    );
    socket.to(data.roomId).emit("user-screen-sharing", {
      username: data.username,
      isSharing: true,
    });
  });

  socket.on("screen-share-stopped", (data) => {
    console.log(
      `📺 ${data.username} stopped screen sharing in room ${data.roomId}`
    );

    // Update room's screen sharing state
    if (rooms[data.roomId]) {
      rooms[data.roomId].screenSharing[data.username] = { isSharing: false };
    }

    console.log(
      "📤 Broadcasting user-screen-sharing event to room:",
      data.roomId
    );
    socket.to(data.roomId).emit("user-screen-sharing", {
      username: data.username,
      isSharing: false,
    });
  });

  // Handle chat events - WebSocket messaging with database persistence
  socket.on("chat-message", async (data) => {
    console.log(
      `💬 Chat message from ${data.username} in room ${data.roomId}: ${data.message}`
    );

    // Debug: Check if room exists and has users
    if (rooms[data.roomId]) {
      const userCount = Object.keys(rooms[data.roomId].users).length;
      console.log(
        `📊 Room ${data.roomId} has ${userCount} users:`,
        Object.keys(rooms[data.roomId].users)
      );
    } else {
      console.log(`❌ Room ${data.roomId} does not exist!`);
    }

    // Save message to database
    try {
      await chatService.sendMessage({
        roomId: data.roomId,
        userId: data.userId || null,
        username: data.username,
        message: data.message,
        messageType: data.type || "text",
      });
      console.log(`💾 Message saved to database`);

      // Update message count in room session
      try {
        const messageCount = await chatService.getRoomMessageCount(data.roomId);
        await roomService.updateRoomMessageCount(data.roomId, messageCount);
      } catch (error) {
        console.error(`❌ Failed to update message count:`, error);
        // Don't fail the message send if count update fails
      }
    } catch (error) {
      console.error(`❌ Failed to save message to database:`, error);
      // Continue with WebSocket broadcast even if DB save fails
    }

    // Broadcast message to all users in the room except sender
    socket.to(data.roomId).emit("chat-message", data);
    console.log(`📤 Broadcasted message to room ${data.roomId}`);

    // Send confirmation back to sender
    socket.emit("chat-message-sent", data);
    console.log(`✅ Sent confirmation to sender ${data.username}`);
  });

  socket.on("typing", (data) => {
    // Broadcast typing indicator to other users in the room
    socket.to(data.roomId).emit("user-typing", {
      username: data.username,
      roomId: data.roomId,
    });
  });

  socket.on("stop-typing", (data) => {
    // Broadcast stop typing indicator to other users in the room
    socket.to(data.roomId).emit("user-stopped-typing", {
      username: data.username,
      roomId: data.roomId,
    });
  });

  // Handle user disconnection
  socket.on("disconnect", async () => {
    console.log(`👤 User disconnected: ${socket.id}`);
    let userRoomId = null;

    // Find the room the user was in and remove them
    for (const roomId in rooms) {
      if (rooms[roomId].users[socket.id]) {
        userRoomId = roomId;

        // Get username before deleting user
        const leavingUsername = rooms[roomId].users[socket.id]?.username;

        // Clean up screen sharing state for the leaving user
        if (
          rooms[roomId].screenSharing &&
          leavingUsername &&
          rooms[roomId].screenSharing[leavingUsername]
        ) {
          delete rooms[roomId].screenSharing[leavingUsername];
          console.log(
            `🧹 Cleaned up screen sharing state for ${leavingUsername}`
          );
        }

        delete rooms[roomId].users[socket.id];

        // If the room becomes empty, handle based on room type
        if (Object.keys(rooms[roomId].users).length === 0) {
          console.log(`📝 Room ${roomId} is now empty`);

          if (rooms[roomId].isPermanent) {
            // For permanent rooms, just mark as inactive but keep in memory
            rooms[roomId].isActive = false;
            console.log(`💤 Permanent room ${roomId} marked as inactive`);
          } else {
            // For temporary rooms, completely destroy them
            console.log(`🗑️ Temporary room ${roomId} being destroyed`);

            // Delete all messages for this room since it's being destroyed
            await deleteRoomMessages(roomId);

            // End room session in database for analytics
            try {
              await roomService.endRoomSession(roomId);
            } catch (error) {
              console.error(`❌ Failed to end room session in DB:`, error);
              // Continue with room destruction even if DB fails
            }

            // Completely delete the room from memory
            delete rooms[roomId];
            console.log(
              `🗑️ Temporary room ${roomId} completely destroyed and available for reuse`
            );
          }
        }
        break;
      }
    }

    // If the user was in a room, notify other users in that room
    if (userRoomId) {
      socket.to(userRoomId).emit("user-left", socket.id);
    }
  });

  // Member Management Events
  // Kick user from room
  socket.on("kick-user", (data) => {
    const { targetSocketId, roomId } = data;
    const userRoom = rooms[roomId];

    if (!userRoom) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    const currentUser = userRoom.users[socket.id];
    if (!currentUser || !currentUser.isAdmin) {
      socket.emit("error", { message: "Insufficient permissions" });
      return;
    }

    const targetUser = userRoom.users[targetSocketId];
    if (!targetUser) {
      socket.emit("error", { message: "User not found in room" });
      return;
    }

    // Don't allow kicking other admins
    if (targetUser.isAdmin) {
      socket.emit("error", { message: "Cannot kick other administrators" });
      return;
    }

    // Remove user from room
    delete userRoom.users[targetSocketId];

    // Notify the kicked user
    io.to(targetSocketId).emit("kicked-from-room", {
      message: "You have been removed from the room by an administrator",
    });

    // Notify other users in the room
    socket.to(roomId).emit("user-kicked", {
      socketId: targetSocketId,
      username: targetUser.username,
    });

    console.log(
      `👢 User ${targetUser.username} (${targetSocketId}) was kicked from room ${roomId} by ${currentUser.username}`
    );
  });

  // Promote user to admin
  socket.on("promote-user", (data) => {
    const { targetSocketId, roomId } = data;
    const userRoom = rooms[roomId];

    if (!userRoom) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    const currentUser = userRoom.users[socket.id];
    if (!currentUser || !currentUser.isAdmin) {
      socket.emit("error", { message: "Insufficient permissions" });
      return;
    }

    const targetUser = userRoom.users[targetSocketId];
    if (!targetUser) {
      socket.emit("error", { message: "User not found in room" });
      return;
    }

    if (targetUser.isAdmin) {
      socket.emit("error", { message: "User is already an administrator" });
      return;
    }

    // Promote user to admin
    targetUser.isAdmin = true;
    if (targetUser.userId && !userRoom.admins.includes(targetUser.userId)) {
      userRoom.admins.push(targetUser.userId);
    }

    // Notify the promoted user
    io.to(targetSocketId).emit("promoted-to-admin", {
      message: "You have been promoted to administrator",
    });

    // Notify other users in the room
    socket.to(roomId).emit("user-promoted", {
      socketId: targetSocketId,
      username: targetUser.username,
    });

    console.log(
      `⬆️ User ${targetUser.username} (${targetSocketId}) was promoted to admin in room ${roomId} by ${currentUser.username}`
    );
  });

  // Demote admin to regular user
  socket.on("demote-user", (data) => {
    const { targetSocketId, roomId } = data;
    const userRoom = rooms[roomId];

    if (!userRoom) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    const currentUser = userRoom.users[socket.id];
    if (!currentUser || !currentUser.isAdmin) {
      socket.emit("error", { message: "Insufficient permissions" });
      return;
    }

    const targetUser = userRoom.users[targetSocketId];
    if (!targetUser) {
      socket.emit("error", { message: "User not found in room" });
      return;
    }

    if (!targetUser.isAdmin) {
      socket.emit("error", { message: "User is not an administrator" });
      return;
    }

    // Don't allow demoting the room creator
    if (targetUser.userId === userRoom.createdBy) {
      socket.emit("error", { message: "Cannot demote the room creator" });
      return;
    }

    // Demote user from admin
    targetUser.isAdmin = false;
    if (targetUser.userId) {
      userRoom.admins = userRoom.admins.filter(
        (adminId) => adminId !== targetUser.userId
      );
    }

    // Notify the demoted user
    io.to(targetSocketId).emit("demoted-from-admin", {
      message: "You have been demoted from administrator",
    });

    // Notify other users in the room
    socket.to(roomId).emit("user-demoted", {
      socketId: targetSocketId,
      username: targetUser.username,
    });

    console.log(
      `⬇️ User ${targetUser.username} (${targetSocketId}) was demoted from admin in room ${roomId} by ${currentUser.username}`
    );
  });

  // Create permanent room (for logged-in users)
  socket.on("create-permanent-room", (data) => {
    const { roomId, username, userId } = data;

    if (!userId) {
      socket.emit("error", {
        message: "Must be logged in to create permanent rooms",
      });
      return;
    }

    if (rooms[roomId]) {
      socket.emit("error", { message: "Room already exists" });
      return;
    }

    // Create permanent room
    rooms[roomId] = {
      password: null, // No password for permanent rooms
      users: {},
      screenSharing: {},
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      admins: [userId],
      isPermanent: true,
      isInviteOnly: true,
    };

    console.log(
      `🏠 Permanent room created: ${roomId} by user: ${username} (${userId})`
    );

    // Notify creator that room was created
    socket.emit("permanent-room-created", {
      roomId,
      message: "Permanent room created successfully",
    });
  });

  // Get user's rooms
  socket.on("get-user-rooms", (data) => {
    const { userId } = data;

    if (!userId) {
      socket.emit("error", { message: "User ID required" });
      return;
    }

    // Find all rooms where user is a member or admin
    const userRooms = [];
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const userInRoom = Object.values(room.users).find(
        (user) => user.userId === userId
      );

      if (userInRoom) {
        userRooms.push({
          roomId,
          isAdmin: userInRoom.isAdmin,
          memberCount: Object.keys(room.users).length,
          createdAt: room.createdAt,
          isActive: room.isActive,
        });
      }
    }

    socket.emit("user-rooms", userRooms);
  });

  // Get room information (for admins)
  socket.on("get-room-info", (data) => {
    const { roomId } = data;
    const userRoom = rooms[roomId];

    if (!userRoom) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    const currentUser = userRoom.users[socket.id];
    if (!currentUser || !currentUser.isAdmin) {
      socket.emit("error", { message: "Insufficient permissions" });
      return;
    }

    // Send room information to admin
    const roomInfo = {
      roomId,
      createdBy: userRoom.createdBy,
      createdAt: userRoom.createdAt,
      admins: userRoom.admins,
      userCount: Object.keys(userRoom.users).length,
      users: Object.values(userRoom.users).map((user) => ({
        username: user.username,
        userId: user.userId,
        isAdmin: user.isAdmin,
        joinedAt: user.joinedAt,
      })),
    };

    socket.emit("room-info", roomInfo);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const PORT = process.env.PORT || 8000;

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Database connected`);
  console.log(`🔐 Authentication endpoints available at /api/auth`);
  console.log(`💬 Chat endpoints available at /api/chat`);
});
