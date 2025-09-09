import express from "express";
import { ChatController } from "../src/controllers/chatController.js";
import { authenticateToken, optionalAuth } from "../src/middleware/auth.js";
import {
  validateChatMessage,
  validatePagination,
  validateDateRange,
} from "../src/middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Message routes
router.post("/send", validateChatMessage, ChatController.sendMessage);
router.get("/room/:roomId", validatePagination, ChatController.getRoomMessages);
router.get("/room/:roomId/recent", ChatController.getRecentMessages);
router.get("/room/:roomId/count", ChatController.getRoomMessageCount);
router.get("/room/:roomId/search", ChatController.searchMessages);
router.get("/room/:roomId/activity", ChatController.getRoomActivitySummary);
router.get(
  "/room/:roomId/by-date-range",
  validateDateRange,
  ChatController.getMessagesByDateRange
);

// Message management routes
router.get("/message/:messageId", ChatController.getMessageById);
router.put("/message/:messageId", ChatController.editMessage);
router.delete("/message/:messageId", ChatController.deleteMessage);

// User message routes
router.get(
  "/user/messages",
  validatePagination,
  ChatController.getUserMessages
);

export default router;
