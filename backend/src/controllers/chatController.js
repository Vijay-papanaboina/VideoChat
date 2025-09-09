import { ChatService } from "../services/chatService.js";

export class ChatController {
  // Send a message
  static async sendMessage(req, res) {
    try {
      const { roomId, message, messageType = "text" } = req.body;
      const userId = req.user.id;
      const username = req.user.username;

      if (!roomId || !message) {
        return res.status(400).json({
          success: false,
          message: "Room ID and message are required",
        });
      }

      const newMessage = await ChatService.sendMessage({
        roomId,
        userId,
        username,
        message,
        messageType,
      });

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: newMessage,
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get messages for a room
  static async getRoomMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { limit = 100, offset = 0 } = req.query;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: "Room ID is required",
        });
      }

      const messages = await ChatService.getRoomMessages(
        roomId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: messages,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: messages.length === parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get room messages error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get recent messages for a room
  static async getRecentMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { limit = 50 } = req.query;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: "Room ID is required",
        });
      }

      const messages = await ChatService.getRecentMessages(
        roomId,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Get recent messages error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Edit a message
  static async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { message } = req.body;
      const userId = req.user.id;

      if (!messageId || !message) {
        return res.status(400).json({
          success: false,
          message: "Message ID and new message are required",
        });
      }

      const updatedMessage = await ChatService.editMessage(
        messageId,
        message,
        userId
      );

      res.json({
        success: true,
        message: "Message edited successfully",
        data: updatedMessage,
      });
    } catch (error) {
      console.error("Edit message error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete a message
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: "Message ID is required",
        });
      }

      const deletedMessage = await ChatService.deleteMessage(messageId, userId);

      res.json({
        success: true,
        message: "Message deleted successfully",
        data: deletedMessage,
      });
    } catch (error) {
      console.error("Delete message error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get user's messages
  static async getUserMessages(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await ChatService.getUserMessages(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: messages,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: messages.length === parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get user messages error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get message count for room
  static async getRoomMessageCount(req, res) {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: "Room ID is required",
        });
      }

      const count = await ChatService.getRoomMessageCount(roomId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error("Get room message count error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Search messages in room
  static async searchMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { q: searchTerm, limit = 50 } = req.query;

      if (!roomId || !searchTerm) {
        return res.status(400).json({
          success: false,
          message: "Room ID and search term are required",
        });
      }

      const messages = await ChatService.searchMessages(
        roomId,
        searchTerm,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Search messages error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get messages by date range
  static async getMessagesByDateRange(req, res) {
    try {
      const { roomId } = req.params;
      const { startDate, endDate } = req.query;

      if (!roomId || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Room ID, start date, and end date are required",
        });
      }

      const messages = await ChatService.getMessagesByDateRange(
        roomId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Get messages by date range error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get room activity summary
  static async getRoomActivitySummary(req, res) {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: "Room ID is required",
        });
      }

      const summary = await ChatService.getRoomActivitySummary(roomId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Get room activity summary error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get message by ID
  static async getMessageById(req, res) {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: "Message ID is required",
        });
      }

      const message = await ChatService.getMessageById(messageId);

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error("Get message by ID error:", error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}
