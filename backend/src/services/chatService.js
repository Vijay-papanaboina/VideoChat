import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "../db.js";
import { chatMessages } from "../schema.js";

// Send a message
export const sendMessage = async (messageData) => {
  const {
    roomId,
    userId,
    username,
    message,
    messageType = "text",
  } = messageData;

  // Validate input (userId can be null for guest users)
  if (!roomId || !username || !message) {
    throw new Error("Room ID, username, and message are required");
  }

  if (message.length > 1000) {
    throw new Error("Message must be less than 1000 characters");
  }

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

  const [newMessage] = await db
    .insert(chatMessages)
    .values(chatData)
    .returning();
  return newMessage;
};

// Get messages for a room
export const getRoomMessages = async (roomId, limit = 100, offset = 0) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(
      and(eq(chatMessages.roomId, roomId), eq(chatMessages.isDeleted, false))
    )
    .orderBy(desc(chatMessages.timestamp))
    .limit(limit)
    .offset(offset);

  return messages;
};

// Get recent messages for a room
export const getRecentMessages = async (roomId, limit = 50) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(
      and(eq(chatMessages.roomId, roomId), eq(chatMessages.isDeleted, false))
    )
    .orderBy(desc(chatMessages.timestamp))
    .limit(limit);

  return messages.reverse(); // Return in chronological order
};

// Edit a message
export const editMessage = async (messageId, newMessage, userId) => {
  if (!messageId || !newMessage || !userId) {
    throw new Error("Message ID, new message, and user ID are required");
  }

  if (newMessage.length > 1000) {
    throw new Error("Message must be less than 1000 characters");
  }

  const [updatedMessage] = await db
    .update(chatMessages)
    .set({
      message: newMessage,
      isEdited: true,
      editedAt: new Date(),
    })
    .where(and(eq(chatMessages.id, messageId), eq(chatMessages.userId, userId)))
    .returning();

  if (!updatedMessage) {
    throw new Error("Message not found or unauthorized to edit");
  }

  return updatedMessage;
};

// Delete a message
export const deleteMessage = async (messageId, userId) => {
  if (!messageId || !userId) {
    throw new Error("Message ID and user ID are required");
  }

  const [deletedMessage] = await db
    .update(chatMessages)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
    })
    .where(and(eq(chatMessages.id, messageId), eq(chatMessages.userId, userId)))
    .returning();

  if (!deletedMessage) {
    throw new Error("Message not found or unauthorized to delete");
  }

  return deletedMessage;
};

// Get user's messages
export const getUserMessages = async (userId, limit = 50, offset = 0) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(
      and(eq(chatMessages.userId, userId), eq(chatMessages.isDeleted, false))
    )
    .orderBy(desc(chatMessages.timestamp))
    .limit(limit)
    .offset(offset);

  return messages;
};

// Get message count for room
export const getRoomMessageCount = async (roomId) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const result = await db
    .select({ count: chatMessages.id })
    .from(chatMessages)
    .where(
      and(eq(chatMessages.roomId, roomId), eq(chatMessages.isDeleted, false))
    );

  return result[0]?.count || 0;
};

// Search messages in room
export const searchMessages = async (roomId, searchTerm, limit = 50) => {
  if (!roomId || !searchTerm) {
    throw new Error("Room ID and search term are required");
  }

  // Note: This is a basic implementation. For better search, you'd want to use
  // full-text search or a search engine like Elasticsearch
  const messages = await db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.roomId, roomId),
        eq(chatMessages.isDeleted, false)
        // Add search condition here - this would need to be adapted based on your DB
        // like: like(chatMessages.message, `%${searchTerm}%`)
      )
    )
    .orderBy(desc(chatMessages.timestamp))
    .limit(limit);

  return messages;
};

// Get messages by date range
export const getMessagesByDateRange = async (roomId, startDate, endDate) => {
  if (!roomId || !startDate || !endDate) {
    throw new Error("Room ID, start date, and end date are required");
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.roomId, roomId),
        eq(chatMessages.isDeleted, false),
        gte(chatMessages.timestamp, new Date(startDate)),
        lte(chatMessages.timestamp, new Date(endDate))
      )
    )
    .orderBy(desc(chatMessages.timestamp));

  return messages;
};

// Get room activity summary
export const getRoomActivitySummary = async (roomId) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const messageCount = await getRoomMessageCount(roomId);
  const recentMessages = await getRecentMessages(roomId, 5);

  return {
    roomId,
    messageCount,
    recentMessages,
    lastActivity:
      recentMessages.length > 0 ? recentMessages[0].timestamp : null,
  };
};

// Get message by ID
export const getMessageById = async (messageId) => {
  if (!messageId) {
    throw new Error("Message ID is required");
  }

  const [message] = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.id, messageId))
    .limit(1);

  if (!message) {
    throw new Error("Message not found");
  }

  return message;
};

// Delete all messages for a room (when room is destroyed)
export const deleteRoomMessages = async (roomId) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  console.log(`🗑️ Deleting all messages for room: ${roomId}`);

  const result = await db
    .delete(chatMessages)
    .where(eq(chatMessages.roomId, roomId));

  console.log(`✅ Deleted messages for room: ${roomId}`);
  return result;
};

// Export all functions as a service object
export const chatService = {
  sendMessage,
  getRoomMessages,
  getRecentMessages,
  editMessage,
  deleteMessage,
  getUserMessages,
  getRoomMessageCount,
  searchMessages,
  getMessagesByDateRange,
  getRoomActivitySummary,
  getMessageById,
  deleteRoomMessages,
};
