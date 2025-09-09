import express from "express";
import * as chatController from "../src/controllers/chatController.js";
import { authenticateToken } from "../src/middleware/auth.js";
import {
  validateChatMessage,
  validatePagination,
  validateDateRange,
} from "../src/middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Message routes
router.post("/send", validateChatMessage, chatController.sendMessage);
router.get("/room/:roomId", validatePagination, chatController.getRoomMessages);
router.get("/room/:roomId/recent", chatController.getRecentMessages);
router.get("/room/:roomId/count", chatController.getRoomMessageCount);
router.get("/room/:roomId/search", chatController.searchMessages);
router.get("/room/:roomId/activity", chatController.getRoomActivitySummary);
router.get(
  "/room/:roomId/by-date-range",
  validateDateRange,
  chatController.getMessagesByDateRange
);

// Message management routes
router.get("/message/:messageId", chatController.getMessageById);
router.put("/message/:messageId", chatController.editMessage);
router.delete("/message/:messageId", chatController.deleteMessage);

// User message routes
router.get(
  "/user/messages",
  validatePagination,
  chatController.getUserMessages
);

export default router;
