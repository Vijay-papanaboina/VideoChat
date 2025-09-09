// Import required modules
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// Import routes
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

// Import middleware
import { errorHandler, notFound } from "./src/middleware/errorHandler.js";

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
// rooms structure: { roomId: { password: "...", users: { socketId: "username", ... } } }
const rooms = {};
const MAX_USERS_PER_ROOM = 5; // Allow exactly 5 users (0-4 existing + 1 new = 5 total)

// A simple root route for health checks
app.get("/", (req, res) => {
  res.json({ message: "Video Call Server is running" });
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
      rooms[roomId] = {
        password: password,
        users: {},
        isActive: true,
      };
      console.log(`🚪 Room created: ${roomId}`);
    }

    // Check if the provided password is correct
    if (rooms[roomId].password !== password) {
      socket.emit("join-error", { message: "Invalid room password." });
      console.log(`🚫 Invalid password for room ${roomId} from ${socket.id}`);
      return;
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
    rooms[roomId].users[socket.id] = { username, userId };
    socket.join(roomId);
    console.log(`👤 User ${username} (${socket.id}) joined room: ${roomId}`);

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
      }));

    // Send the list of other users to the new user
    socket.emit("all-users", otherUsers);

    // Notify all other users in the room that a new user has joined
    socket.to(roomId).emit("user-joined", { socketId: socket.id, username });
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
    socket.to(data.roomId).emit("user-screen-sharing", {
      username: data.username,
      shareType: data.shareType,
      isSharing: true,
    });
  });

  socket.on("screen-share-stopped", (data) => {
    console.log(
      `📺 ${data.username} stopped screen sharing in room ${data.roomId}`
    );
    socket.to(data.roomId).emit("user-screen-sharing", {
      username: data.username,
      isSharing: false,
    });
  });

  // Handle chat events - PURE WEBSOCKET MESSAGING (NO DATABASE)
  socket.on("chat-message", (data) => {
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
        delete rooms[roomId].users[socket.id];

        // If the room becomes empty, mark it as inactive but keep it for potential rejoining
        if (Object.keys(rooms[roomId].users).length === 0) {
          // No database operations - pure in-memory room management
          console.log(`📝 Room ${roomId} is now empty`);

          // Keep the room in memory but mark as empty
          rooms[roomId].isActive = false;
          console.log(
            `📝 Room ${roomId} marked as inactive (empty but persistent)`
          );
        }
        break;
      }
    }

    // If the user was in a room, notify other users in that room
    if (userRoomId) {
      socket.to(userRoomId).emit("user-left", socket.id);
    }
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
