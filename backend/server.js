// Import required modules
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// Import authentication routes and database
import { router as authRoutes, authenticateToken } from "./routes/auth.js";
import callHistoryRoutes from "./routes/callHistory.js";
import { initializeDatabase } from "./src/init-db.js";

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Allow all origins for development. Restrict in production.
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use CORS middleware for Express
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Authentication routes
app.use("/api/auth", authRoutes);

// Call history routes
app.use("/api/call-history", callHistoryRoutes);

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
  console.log(`�� User connected: ${socket.id}`);

  // Event listener for a user joining a room
  socket.on("join-room", (data) => {
    const { roomId, password, username } = data;

    // --- Room Validation ---
    // If the room doesn't exist, create it with the provided password
    if (!rooms[roomId]) {
      rooms[roomId] = {
        password: password,
        users: {},
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
    // Add the user to the room and join the socket to the room's channel
    rooms[roomId].users[socket.id] = username;
    socket.join(roomId);
    console.log(`�� User ${username} (${socket.id}) joined room: ${roomId}`);

    // Get a list of all other users currently in the room with their usernames
    const otherUsers = Object.keys(rooms[roomId].users)
      .filter((id) => id !== socket.id)
      .map((id) => ({
        socketId: id,
        username: rooms[roomId].users[id],
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

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`�� User disconnected: ${socket.id}`);
    let userRoomId = null;

    // Find the room the user was in and remove them
    for (const roomId in rooms) {
      if (rooms[roomId].users[socket.id]) {
        userRoomId = roomId;
        delete rooms[roomId].users[socket.id];

        // If the room becomes empty, delete it
        if (Object.keys(rooms[roomId].users).length === 0) {
          delete rooms[roomId];
          console.log(`🗑️ Room ${roomId} deleted as it is now empty.`);
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

// Initialize database and start server
const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Database connected and tables initialized`);
      console.log(`🔐 Authentication endpoints available at /api/auth`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
