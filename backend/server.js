// Import required modules
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";
dotenv.config();

// Import routes
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import roomRoutes from "./routes/rooms.js";

// Import middleware
import { errorHandler, notFound } from "./src/middleware/errorHandler.js";
import { apiLimiter, authLimiter } from "./src/middleware/rateLimiter.js";

// Import Socket.IO initialization
import { initializeSocketIO, rooms } from "./socket/index.js";

// Import background jobs
import { initJobs } from "./jobs/roomCleanup.js";

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Security Middleware
app.use(helmet());

// Configure Socket.IO
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:4000";
const io = initializeSocketIO(server, corsOrigin);

// Initialize background jobs
initJobs();

// Trust proxy (required for rate limiting behind reverse proxies like Render, Heroku, etc.)
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

// Use CORS middleware for Express
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Apply strict rate limiting to auth endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/rooms", roomRoutes);

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
  console.log(`🔌 Socket.IO handlers loaded from modular structure`);
});
