import { ChatRepository } from "../repositories/chatRepository.js";
import { ChatValidation } from "../models/Chat.js";

export class ChatService {
  // Send a message
  static async sendMessage(messageData) {
    const {
      roomId,
      userId,
      username,
      message,
      messageType = "text",
    } = messageData;

    // Validate input
    this.validateMessageData({
      roomId,
      userId,
      username,
      message,
      messageType,
    });

    const chatData = {
      roomId,
      userId,
      username,
      message,
      messageType,
      timestamp: new Date(),
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(),
    };

    const newMessage = await ChatRepository.create(chatData);
    return newMessage;
  }

  // Get messages for a room
  static async getRoomMessages(roomId, limit = 100, offset = 0) {
    if (!roomId) {
      throw new Error("Room ID is required");
    }

    const messages = await ChatRepository.getMessagesByRoom(
      roomId,
      limit,
      offset
    );
    return messages;
  }

  // Get recent messages for a room
  static async getRecentMessages(roomId, limit = 50) {
    if (!roomId) {
      throw new Error("Room ID is required");
    }

    const messages = await ChatRepository.getRecentMessages(roomId, limit);
    return messages;
  }

  // Edit a message
  static async editMessage(messageId, newMessage, userId) {
    if (!messageId || !newMessage || !userId) {
      throw new Error("Message ID, new message, and user ID are required");
    }

    if (newMessage.length < ChatValidation.message.minLength) {
      throw new Error("Message must be at least 1 character long");
    }

    if (newMessage.length > ChatValidation.message.maxLength) {
      throw new Error("Message must be less than 1000 characters");
    }

    const updatedMessage = await ChatRepository.editMessage(
      messageId,
      newMessage,
      userId
    );
    if (!updatedMessage) {
      throw new Error("Message not found or unauthorized to edit");
    }

    return updatedMessage;
  }

  // Delete a message
  static async deleteMessage(messageId, userId) {
    if (!messageId || !userId) {
      throw new Error("Message ID and user ID are required");
    }

    const deletedMessage = await ChatRepository.deleteMessage(
      messageId,
      userId
    );
    if (!deletedMessage) {
      throw new Error("Message not found or unauthorized to delete");
    }

    return deletedMessage;
  }

  // Get user's messages
  static async getUserMessages(userId, limit = 50, offset = 0) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const messages = await ChatRepository.getMessagesByUser(
      userId,
      limit,
      offset
    );
    return messages;
  }

  // Get message count for room
  static async getRoomMessageCount(roomId) {
    if (!roomId) {
      throw new Error("Room ID is required");
    }

    const count = await ChatRepository.getMessageCount(roomId);
    return count;
  }

  // Search messages in room
  static async searchMessages(roomId, searchTerm, limit = 50) {
    if (!roomId || !searchTerm) {
      throw new Error("Room ID and search term are required");
    }

    const messages = await ChatRepository.searchMessages(
      roomId,
      searchTerm,
      limit
    );
    return messages;
  }

  // Get messages by date range
  static async getMessagesByDateRange(roomId, startDate, endDate) {
    if (!roomId || !startDate || !endDate) {
      throw new Error("Room ID, start date, and end date are required");
    }

    const messages = await ChatRepository.getMessagesByDateRange(
      roomId,
      new Date(startDate),
      new Date(endDate)
    );
    return messages;
  }

  // Get message by ID
  static async getMessageById(messageId) {
    if (!messageId) {
      throw new Error("Message ID is required");
    }

    const message = await ChatRepository.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    return message;
  }

  // Get room activity summary
  static async getRoomActivitySummary(roomId) {
    if (!roomId) {
      throw new Error("Room ID is required");
    }

    const messageCount = await ChatRepository.getMessageCount(roomId);
    const recentMessages = await ChatRepository.getRecentMessages(roomId, 5);

    return {
      roomId,
      messageCount,
      recentMessages,
      lastActivity:
        recentMessages.length > 0 ? recentMessages[0].timestamp : null,
    };
  }

  // Helper methods
  static validateMessageData(messageData) {
    const { roomId, userId, username, message, messageType } = messageData;

    if (!roomId || roomId.length < ChatValidation.roomId.minLength) {
      throw new Error("Invalid room ID");
    }

    if (!userId || typeof userId !== "number") {
      throw new Error("Invalid user ID");
    }

    if (!username || username.length < ChatValidation.username.minLength) {
      throw new Error("Invalid username");
    }

    if (!message || message.length < ChatValidation.message.minLength) {
      throw new Error("Message is required");
    }

    if (message.length > ChatValidation.message.maxLength) {
      throw new Error("Message is too long");
    }

    if (!ChatValidation.messageType.enum.includes(messageType)) {
      throw new Error("Invalid message type");
    }
  }
}
