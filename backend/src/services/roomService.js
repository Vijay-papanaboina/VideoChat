import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import {
  temporaryRooms,
  permanentRooms,
  temporaryChatSessions,
  permanentChatSessions,
  temporaryChatMessages,
  permanentChatMessages,
  permanentRoomMembers,
  users,
} from "../schema.js";

// ===== TEMPORARY ROOM FUNCTIONS =====

// Create a temporary room in the database
export const createTemporaryRoom = async (roomId, password, createdBy) => {
  try {
    const [newRoom] = await db
      .insert(temporaryRooms)
      .values({
        roomId,
        password,
        createdBy,
        maxUsers: 100,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`🏠 Temporary room created in DB: ${roomId} by ${createdBy}`);
    return newRoom;
  } catch (error) {
    console.error(`❌ Failed to create temporary room:`, error);
    throw error;
  }
};

// Create a temporary room chat session
export const createTemporaryChatSession = async (roomId) => {
  try {
    const [newSession] = await db
      .insert(temporaryChatSessions)
      .values({
        roomId,
        isActive: true,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        messageCount: 0,
      })
      .returning();

    console.log(`📊 Temporary chat session created: ${roomId}`);
    return newSession;
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation - session already exists
      return await updateTemporaryChatSession(roomId, { isActive: true });
    }
    console.error(`❌ Failed to create temporary chat session:`, error);
    throw error;
  }
};

// Update temporary chat session
export const updateTemporaryChatSession = async (roomId, updates) => {
  try {
    const [updatedSession] = await db
      .update(temporaryChatSessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(temporaryChatSessions.roomId, roomId))
      .returning();

    console.log(`📊 Temporary chat session updated: ${roomId}`);
    return updatedSession;
  } catch (error) {
    console.error(`❌ Failed to update temporary chat session:`, error);
    throw error;
  }
};

// End temporary chat session
export const endTemporaryChatSession = async (roomId) => {
  try {
    const [endedSession] = await db
      .update(temporaryChatSessions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(temporaryChatSessions.roomId, roomId))
      .returning();

    console.log(`📊 Temporary chat session ended: ${roomId}`);
    return endedSession;
  } catch (error) {
    console.error(`❌ Failed to end temporary chat session:`, error);
    throw error;
  }
};

// Delete temporary room and all its data (CASCADE will handle related records)
export const deleteTemporaryRoom = async (roomId) => {
  try {
    // Delete room - CASCADE will automatically delete chat messages and sessions
    await db.delete(temporaryRooms).where(eq(temporaryRooms.roomId, roomId));

    console.log(
      `🗑️ Temporary room deleted: ${roomId} (with CASCADE deletion of related data)`
    );
  } catch (error) {
    console.error(`❌ Failed to delete temporary room:`, error);
    throw error;
  }
};

// ===== PERMANENT ROOM FUNCTIONS =====

// Create a permanent room in the database
export const createPermanentRoom = async (roomId, createdBy) => {
  try {
    const [newRoom] = await db
      .insert(permanentRooms)
      .values({
        roomId,
        createdBy,
        maxUsers: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(
      `🏠 Permanent room created in DB: ${roomId} by user ${createdBy}`
    );
    return newRoom;
  } catch (error) {
    console.error(`❌ Failed to create permanent room:`, error);
    throw error;
  }
};

// Create a permanent room chat session
export const createPermanentChatSession = async (roomId) => {
  try {
    const [newSession] = await db
      .insert(permanentChatSessions)
      .values({
        roomId,
        isActive: true,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        messageCount: 0,
      })
      .returning();

    console.log(`📊 Permanent chat session created: ${roomId}`);
    return newSession;
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation - session already exists
      return await updatePermanentChatSession(roomId, { isActive: true });
    }
    console.error(`❌ Failed to create permanent chat session:`, error);
    throw error;
  }
};

// Update permanent chat session
export const updatePermanentChatSession = async (roomId, updates) => {
  try {
    const [updatedSession] = await db
      .update(permanentChatSessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(permanentChatSessions.roomId, roomId))
      .returning();

    console.log(`📊 Permanent chat session updated: ${roomId}`);
    return updatedSession;
  } catch (error) {
    console.error(`❌ Failed to update permanent chat session:`, error);
    throw error;
  }
};

// End permanent chat session
export const endPermanentChatSession = async (roomId) => {
  try {
    const [endedSession] = await db
      .update(permanentChatSessions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(permanentChatSessions.roomId, roomId))
      .returning();

    console.log(`📊 Permanent chat session ended: ${roomId}`);
    return endedSession;
  } catch (error) {
    console.error(`❌ Failed to end permanent chat session:`, error);
    throw error;
  }
};

// Get user's permanent rooms
export const getUserPermanentRooms = async (userId) => {
  try {
    const userRooms = await db
      .select()
      .from(permanentRooms)
      .where(eq(permanentRooms.createdBy, userId));

    return userRooms;
  } catch (error) {
    console.error(`❌ Failed to get user permanent rooms:`, error);
    return [];
  }
};

// ===== CHAT MESSAGE FUNCTIONS =====

// Send message to temporary room
export const sendTemporaryMessage = async (messageData) => {
  try {
    const [newMessage] = await db
      .insert(temporaryChatMessages)
      .values({
        roomId: messageData.roomId,
        userId: messageData.userId,
        username: messageData.username,
        message: messageData.message,
        messageType: messageData.messageType || "text",
        timestamp: new Date(),
        createdAt: new Date(),
      })
      .returning();

    // Update message count
    await updateTemporaryChatSession(messageData.roomId, {
      lastMessageAt: new Date(),
      messageCount: { increment: 1 },
    });

    console.log(`💬 Temporary message sent to ${messageData.roomId}`);
    return newMessage;
  } catch (error) {
    console.error(`❌ Failed to send temporary message:`, error);
    throw error;
  }
};

// Send message to permanent room
export const sendPermanentMessage = async (messageData) => {
  try {
    const [newMessage] = await db
      .insert(permanentChatMessages)
      .values({
        roomId: messageData.roomId,
        userId: messageData.userId,
        username: messageData.username,
        message: messageData.message,
        messageType: messageData.messageType || "text",
        timestamp: new Date(),
        createdAt: new Date(),
      })
      .returning();

    // Update message count
    await updatePermanentChatSession(messageData.roomId, {
      lastMessageAt: new Date(),
      messageCount: { increment: 1 },
    });

    console.log(`💬 Permanent message sent to ${messageData.roomId}`);
    return newMessage;
  } catch (error) {
    console.error(`❌ Failed to send permanent message:`, error);
    throw error;
  }
};

// Get temporary room messages
export const getTemporaryMessages = async (roomId, limit = 50) => {
  try {
    const messages = await db
      .select()
      .from(temporaryChatMessages)
      .where(eq(temporaryChatMessages.roomId, roomId))
      .orderBy(temporaryChatMessages.timestamp)
      .limit(limit);

    return messages;
  } catch (error) {
    console.error(`❌ Failed to get temporary messages:`, error);
    return [];
  }
};

// Get permanent room messages
export const getPermanentMessages = async (roomId, limit = 50) => {
  try {
    const messages = await db
      .select()
      .from(permanentChatMessages)
      .where(eq(permanentChatMessages.roomId, roomId))
      .orderBy(permanentChatMessages.timestamp)
      .limit(limit);

    return messages;
  } catch (error) {
    console.error(`❌ Failed to get permanent messages:`, error);
    return [];
  }
};

// ===== UTILITY FUNCTIONS =====

// Check if room exists in temporary rooms
export const checkTemporaryRoomExists = async (roomId) => {
  try {
    const [room] = await db
      .select()
      .from(temporaryRooms)
      .where(eq(temporaryRooms.roomId, roomId))
      .limit(1);

    return !!room;
  } catch (error) {
    console.error(`❌ Failed to check temporary room:`, error);
    return false;
  }
};

// Check if room exists in permanent rooms
export const checkPermanentRoomExists = async (roomId) => {
  try {
    const [room] = await db
      .select()
      .from(permanentRooms)
      .where(eq(permanentRooms.roomId, roomId))
      .limit(1);

    return !!room;
  } catch (error) {
    console.error(`❌ Failed to check permanent room:`, error);
    return false;
  }
};

// ===== PERMANENT ROOM MEMBER FUNCTIONS =====

// Add a member to a permanent room
export const addPermanentRoomMember = async (
  roomId,
  userId,
  addedBy,
  isAdmin = false
) => {
  try {
    const [newMember] = await db
      .insert(permanentRoomMembers)
      .values({
        roomId,
        userId,
        addedBy,
        isAdmin,
        addedAt: new Date(),
      })
      .returning();

    console.log(
      `👥 Added member ${userId} to permanent room ${roomId} by ${addedBy}`
    );
    return newMember;
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation - user already a member
      throw new Error("User is already a member of this room");
    }
    console.error(`❌ Failed to add permanent room member:`, error);
    throw error;
  }
};

// Remove a member from a permanent room
export const removePermanentRoomMember = async (roomId, userId) => {
  try {
    const [removedMember] = await db
      .delete(permanentRoomMembers)
      .where(
        and(
          eq(permanentRoomMembers.roomId, roomId),
          eq(permanentRoomMembers.userId, userId)
        )
      )
      .returning();

    console.log(`👥 Removed member ${userId} from permanent room ${roomId}`);
    return removedMember;
  } catch (error) {
    console.error(`❌ Failed to remove permanent room member:`, error);
    throw error;
  }
};

// Get all members of a permanent room
export const getPermanentRoomMembers = async (roomId) => {
  try {
    const members = await db
      .select({
        id: permanentRoomMembers.id,
        userId: permanentRoomMembers.userId,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isAdmin: permanentRoomMembers.isAdmin,
        addedBy: permanentRoomMembers.addedBy,
        addedAt: permanentRoomMembers.addedAt,
      })
      .from(permanentRoomMembers)
      .innerJoin(users, eq(permanentRoomMembers.userId, users.id))
      .where(eq(permanentRoomMembers.roomId, roomId));

    return members;
  } catch (error) {
    console.error(`❌ Failed to get permanent room members:`, error);
    return [];
  }
};

// Check if a user is a member of a permanent room
export const isPermanentRoomMember = async (roomId, userId) => {
  try {
    const [member] = await db
      .select()
      .from(permanentRoomMembers)
      .where(
        and(
          eq(permanentRoomMembers.roomId, roomId),
          eq(permanentRoomMembers.userId, userId)
        )
      )
      .limit(1);

    return !!member;
  } catch (error) {
    console.error(`❌ Failed to check permanent room membership:`, error);
    return false;
  }
};

// Update member admin status
export const updatePermanentRoomMemberAdmin = async (
  roomId,
  userId,
  isAdmin
) => {
  try {
    const [updatedMember] = await db
      .update(permanentRoomMembers)
      .set({ isAdmin })
      .where(
        and(
          eq(permanentRoomMembers.roomId, roomId),
          eq(permanentRoomMembers.userId, userId)
        )
      )
      .returning();

    console.log(
      `👥 Updated admin status for member ${userId} in room ${roomId} to ${isAdmin}`
    );
    return updatedMember;
  } catch (error) {
    console.error(
      `❌ Failed to update permanent room member admin status:`,
      error
    );
    throw error;
  }
};

// Get rooms where user is a member
export const getUserPermanentRoomMemberships = async (userId) => {
  try {
    const memberships = await db
      .select({
        roomId: permanentRoomMembers.roomId,
        isAdmin: permanentRoomMembers.isAdmin,
        addedAt: permanentRoomMembers.addedAt,
        roomCreatedAt: permanentRooms.createdAt,
        roomIsActive: permanentRooms.isActive,
      })
      .from(permanentRoomMembers)
      .innerJoin(
        permanentRooms,
        eq(permanentRoomMembers.roomId, permanentRooms.roomId)
      )
      .where(eq(permanentRoomMembers.userId, userId));

    return memberships;
  } catch (error) {
    console.error(`❌ Failed to get user permanent room memberships:`, error);
    return [];
  }
};

// Delete permanent room (CASCADE will handle related data)
export const deletePermanentRoom = async (roomId) => {
  try {
    // Delete room - CASCADE will automatically delete:
    // - permanent_room_members (members)
    // - permanent_chat_messages (chat messages)
    // - permanent_chat_sessions (chat sessions)
    await db.delete(permanentRooms).where(eq(permanentRooms.roomId, roomId));
    console.log(
      `🗑️ Permanent room deleted: ${roomId} (with CASCADE deletion of related data)`
    );
  } catch (error) {
    console.error(`❌ Failed to delete permanent room:`, error);
    throw error;
  }
};

// Export all functions as a service object
export const roomService = {
  // Temporary room functions
  createTemporaryRoom,
  createTemporaryChatSession,
  updateTemporaryChatSession,
  endTemporaryChatSession,
  deleteTemporaryRoom,
  checkTemporaryRoomExists,

  // Permanent room functions
  createPermanentRoom,
  createPermanentChatSession,
  updatePermanentChatSession,
  endPermanentChatSession,
  getUserPermanentRooms,
  checkPermanentRoomExists,

  // Chat message functions
  sendTemporaryMessage,
  sendPermanentMessage,
  getTemporaryMessages,
  getPermanentMessages,

  // Permanent room member functions
  addPermanentRoomMember,
  removePermanentRoomMember,
  getPermanentRoomMembers,
  isPermanentRoomMember,
  updatePermanentRoomMemberAdmin,
  getUserPermanentRoomMemberships,

  // Delete permanent room (CASCADE will handle related data)
  deletePermanentRoom,
};
