import express from "express";
import Chat from "../src/models/Chat.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// JWT Secret (should match auth.js)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Middleware to verify JWT token (optional for chat)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we allow guest access
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

// Get chat messages for a room
router.get("/:roomId/messages", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Chat.getRecentRoomMessages(roomId, parseInt(limit));

    res.json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg.id,
        username: msg.username,
        message: msg.message,
        messageType: msg.messageType,
        timestamp: msg.timestamp,
        userId: msg.userId,
      })),
      roomId,
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat messages",
    });
  }
});

// Get room chat session info
router.get("/:roomId/session", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const session = await Chat.getRoomChatSession(roomId);
    const messageCount = await Chat.getRoomMessageCount(roomId);

    res.json({
      success: true,
      session: session
        ? {
            roomId: session.roomId,
            isActive: session.isActive,
            createdAt: session.createdAt,
            lastMessageAt: session.lastMessageAt,
            messageCount: session.messageCount,
          }
        : null,
      totalMessages: messageCount,
    });
  } catch (error) {
    console.error("Error fetching chat session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat session",
    });
  }
});

// Create a new chat message
router.post("/:roomId/messages", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { username, message, messageType = "text" } = req.body;

    if (!username || !message) {
      return res.status(400).json({
        success: false,
        message: "Username and message are required",
      });
    }

    const newMessage = await Chat.createMessage({
      roomId,
      username,
      userId: req.user?.id || null,
      message,
      messageType,
    });

    res.json({
      success: true,
      message: {
        id: newMessage.id,
        username: newMessage.username,
        message: newMessage.message,
        messageType: newMessage.messageType,
        timestamp: newMessage.timestamp,
        userId: newMessage.userId,
      },
    });
  } catch (error) {
    console.error("Error creating chat message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create chat message",
    });
  }
});

// Delete all messages for a room (when room is destroyed)
router.delete("/:roomId/messages", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    await Chat.deleteRoomMessages(roomId);

    res.json({
      success: true,
      message: "Room messages deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete room messages",
    });
  }
});

// Delete a specific message (for future message deletion feature)
router.delete("/messages/:messageId", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to delete messages",
      });
    }

    const deleted = await Chat.deleteMessage(messageId, req.user.id);

    if (deleted) {
      res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Message not found or not authorized to delete",
      });
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
});

export default router;
