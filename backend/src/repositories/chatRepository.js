import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "../db.js";
import { chatMessages } from "../schema.js";

export class ChatRepository {
  // Create a new chat message
  static async create(messageData) {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();
    return newMessage;
  }

  // Find message by ID
  static async findById(id) {
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, id))
      .limit(1);
    return message;
  }

  // Get messages by room ID
  static async getMessagesByRoom(roomId, limit = 100, offset = 0) {
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
  }

  // Get recent messages for a room
  static async getRecentMessages(roomId, limit = 50) {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        and(eq(chatMessages.roomId, roomId), eq(chatMessages.isDeleted, false))
      )
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
    return messages.reverse(); // Return in chronological order
  }

  // Update message
  static async update(id, updateData) {
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(chatMessages.id, id))
      .returning();
    return updatedMessage;
  }

  // Edit message
  static async editMessage(id, newMessage, userId) {
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({
        message: newMessage,
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(chatMessages.id, id), eq(chatMessages.userId, userId)))
      .returning();
    return updatedMessage;
  }

  // Soft delete message
  static async deleteMessage(id, userId) {
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(chatMessages.id, id), eq(chatMessages.userId, userId)))
      .returning();
    return updatedMessage;
  }

  // Get messages by user
  static async getMessagesByUser(userId, limit = 50, offset = 0) {
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
  }

  // Get message count for room
  static async getMessageCount(roomId) {
    const result = await db
      .select({ count: chatMessages.id })
      .from(chatMessages)
      .where(
        and(eq(chatMessages.roomId, roomId), eq(chatMessages.isDeleted, false))
      );
    return result[0]?.count || 0;
  }

  // Search messages in room
  static async searchMessages(roomId, searchTerm, limit = 50) {
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
  }

  // Get messages by date range
  static async getMessagesByDateRange(roomId, startDate, endDate) {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.roomId, roomId),
          eq(chatMessages.isDeleted, false),
          gte(chatMessages.timestamp, startDate),
          lte(chatMessages.timestamp, endDate)
        )
      )
      .orderBy(desc(chatMessages.timestamp));
    return messages;
  }
}
