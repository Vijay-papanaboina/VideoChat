import express from "express";
import * as chatController from "../src/controllers/chatController.js";
import { authenticateToken } from "../src/middleware/auth.js";
import {
  validatePaginationMiddleware,
  validateDateRangeMiddleware,
} from "../src/middleware/validation.js";

const router = express.Router();

// Guest routes (no authentication required)
router.get("/room/:roomId/recent", chatController.getRecentMessages);
router.get("/room/:roomId/count", chatController.getRoomMessageCount);
// sendMessage removed - now handled via WebSocket

// Authenticated routes (require authentication)
router.use(authenticateToken);

// Message routes
router.get(
  "/room/:roomId",
  validatePaginationMiddleware,
  chatController.getRoomMessages
);
router.get("/room/:roomId/search", chatController.searchMessages);
router.get("/room/:roomId/activity", chatController.getRoomActivitySummary);
router.get(
  "/room/:roomId/by-date-range",
  validateDateRangeMiddleware,
  chatController.getMessagesByDateRange
);

// Message management routes
router.get("/message/:messageId", chatController.getMessageById);
router.put("/message/:messageId", chatController.editMessage);
router.delete("/message/:messageId", chatController.deleteMessage);

// User message routes
router.get(
  "/user/messages",
  validatePaginationMiddleware,
  chatController.getUserMessages
);

export default router;
