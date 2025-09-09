import { db } from "../db.js";
import { chatMessages, roomChatSessions } from "../schema.js";
import { eq, and, desc, count } from "drizzle-orm";

class Chat {
  constructor(data) {
    this.id = data.id;
    this.roomId = data.roomId;
    this.username = data.username;
    this.userId = data.userId;
    this.message = data.message;
    this.messageType = data.messageType;
    this.timestamp = data.timestamp;
    this.isDeleted = data.isDeleted;
  }

  // Create a new chat message
  static async createMessage({
    roomId,
    username,
    userId = null,
    message,
    messageType = "text",
  }) {
    try {
      const [newMessage] = await db
        .insert(chatMessages)
        .values({
          roomId,
          username,
          userId,
          message,
          messageType,
        })
        .returning();

      // Update room chat session
      await Chat.updateRoomChatSession(roomId);

      return new Chat(newMessage);
    } catch (error) {
      throw error;
    }
  }

  // Get messages for a room
  static async getRoomMessages(roomId, limit = 100, offset = 0) {
    try {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.roomId, roomId),
            eq(chatMessages.isDeleted, false)
          )
        )
        .orderBy(desc(chatMessages.timestamp))
        .limit(limit)
        .offset(offset);

      return messages.map((msg) => new Chat(msg));
    } catch (error) {
      throw error;
    }
  }

  // Get recent messages for a room (for new users joining)
  static async getRecentRoomMessages(roomId, limit = 50) {
    try {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.roomId, roomId),
            eq(chatMessages.isDeleted, false)
          )
        )
        .orderBy(desc(chatMessages.timestamp))
        .limit(limit);

      return messages.map((msg) => new Chat(msg)).reverse(); // Return in chronological order
    } catch (error) {
      throw error;
    }
  }

  // Create or update room chat session
  static async updateRoomChatSession(roomId) {
    try {
      // Check if room chat session exists
      const existingSession = await db
        .select()
        .from(roomChatSessions)
        .where(eq(roomChatSessions.roomId, roomId))
        .limit(1);

      if (existingSession.length > 0) {
        // Update existing session
        await db
          .update(roomChatSessions)
          .set({
            lastMessageAt: new Date(),
            messageCount: existingSession[0].messageCount + 1,
          })
          .where(eq(roomChatSessions.roomId, roomId));
      } else {
        // Create new session
        await db.insert(roomChatSessions).values({
          roomId,
          lastMessageAt: new Date(),
          messageCount: 1,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  // Get room chat session info
  static async getRoomChatSession(roomId) {
    try {
      const session = await db
        .select()
        .from(roomChatSessions)
        .where(eq(roomChatSessions.roomId, roomId))
        .limit(1);

      return session[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Mark room chat session as inactive (when room becomes empty)
  static async deactivateRoomChatSession(roomId) {
    try {
      // Mark room chat session as inactive instead of deleting
      await db
        .update(roomChatSessions)
        .set({ isActive: false })
        .where(eq(roomChatSessions.roomId, roomId));

      console.log(`📝 Room ${roomId} chat session marked as inactive`);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Delete all messages for a room (only for admin cleanup)
  static async deleteRoomMessages(roomId) {
    try {
      await db
        .update(chatMessages)
        .set({ isDeleted: true })
        .where(eq(chatMessages.roomId, roomId));

      // Delete room chat session
      await db
        .delete(roomChatSessions)
        .where(eq(roomChatSessions.roomId, roomId));

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get message count for a room
  static async getRoomMessageCount(roomId) {
    try {
      const result = await db
        .select({ count: count() })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.roomId, roomId),
            eq(chatMessages.isDeleted, false)
          )
        );

      return result[0]?.count || 0;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete a message (for future message deletion feature)
  static async deleteMessage(messageId, userId) {
    try {
      const result = await db
        .update(chatMessages)
        .set({ isDeleted: true })
        .where(
          and(eq(chatMessages.id, messageId), eq(chatMessages.userId, userId))
        )
        .returning();

      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

export default Chat;
