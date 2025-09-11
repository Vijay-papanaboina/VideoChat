import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { roomChatSessions } from "../schema.js";

// Create a room session in the database
export const createRoomSession = async (roomId) => {
  try {
    const [newSession] = await db
      .insert(roomChatSessions)
      .values({
        roomId,
        isActive: true,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        messageCount: 0,
      })
      .returning();

    console.log(`📊 Room session created in DB: ${roomId}`);
    return newSession;
  } catch (error) {
    // If room already exists, update it to active
    if (error.code === "23505") {
      // Unique constraint violation
      return await updateRoomSession(roomId, { isActive: true });
    }
    console.error(`❌ Failed to create room session:`, error);
    throw error;
  }
};

// Update a room session
export const updateRoomSession = async (roomId, updates) => {
  try {
    const [updatedSession] = await db
      .update(roomChatSessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(roomChatSessions.roomId, roomId))
      .returning();

    console.log(`📊 Room session updated in DB: ${roomId}`);
    return updatedSession;
  } catch (error) {
    console.error(`❌ Failed to update room session:`, error);
    throw error;
  }
};

// End a room session (mark as inactive)
export const endRoomSession = async (roomId) => {
  try {
    const [endedSession] = await db
      .update(roomChatSessions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(roomChatSessions.roomId, roomId))
      .returning();

    console.log(`📊 Room session ended in DB: ${roomId}`);
    return endedSession;
  } catch (error) {
    console.error(`❌ Failed to end room session:`, error);
    throw error;
  }
};

// Update message count for a room
export const updateRoomMessageCount = async (roomId, messageCount) => {
  try {
    await db
      .update(roomChatSessions)
      .set({
        messageCount,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(roomChatSessions.roomId, roomId));

    console.log(`📊 Updated message count for room ${roomId}: ${messageCount}`);
  } catch (error) {
    console.error(`❌ Failed to update message count:`, error);
    // Don't throw error - this is not critical
  }
};

// Get room session info
export const getRoomSession = async (roomId) => {
  try {
    const [session] = await db
      .select()
      .from(roomChatSessions)
      .where(eq(roomChatSessions.roomId, roomId))
      .limit(1);

    return session;
  } catch (error) {
    console.error(`❌ Failed to get room session:`, error);
    return null;
  }
};

// Get all active room sessions
export const getActiveRoomSessions = async () => {
  try {
    const sessions = await db
      .select()
      .from(roomChatSessions)
      .where(eq(roomChatSessions.isActive, true));

    return sessions;
  } catch (error) {
    console.error(`❌ Failed to get active room sessions:`, error);
    return [];
  }
};

// Export all functions as a service object
export const roomService = {
  createRoomSession,
  updateRoomSession,
  endRoomSession,
  updateRoomMessageCount,
  getRoomSession,
  getActiveRoomSessions,
};
