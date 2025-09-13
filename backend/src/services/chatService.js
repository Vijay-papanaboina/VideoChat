import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "../db.js";
import { temporaryChatMessages, permanentChatMessages } from "../schema.js";

// ===== TEMPORARY ROOM CHAT FUNCTIONS =====

// Send a message to temporary room
export const sendTemporaryMessage = async (messageData) => {
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
    .insert(temporaryChatMessages)
    .values(chatData)
    .returning();

  console.log(`💬 Temporary message sent to ${roomId}`);
  return newMessage;
};

// Get messages for a temporary room
export const getTemporaryRoomMessages = async (
  roomId,
  limit = 100,
  offset = 0
) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const messages = await db
    .select()
    .from(temporaryChatMessages)
    .where(
      and(
        eq(temporaryChatMessages.roomId, roomId),
        eq(temporaryChatMessages.isDeleted, false)
      )
    )
    .orderBy(desc(temporaryChatMessages.timestamp))
    .limit(limit)
    .offset(offset);

  return messages;
};

// Get recent messages for a temporary room
export const getTemporaryRecentMessages = async (roomId, limit = 50) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const messages = await db
    .select()
    .from(temporaryChatMessages)
    .where(
      and(
        eq(temporaryChatMessages.roomId, roomId),
        eq(temporaryChatMessages.isDeleted, false)
      )
    )
    .orderBy(desc(temporaryChatMessages.timestamp))
    .limit(limit);

  return messages.reverse(); // Return in chronological order
};

// Edit a temporary room message
export const editTemporaryMessage = async (messageId, newMessage, userId) => {
  if (!messageId || !newMessage || !userId) {
    throw new Error("Message ID, new message, and user ID are required");
  }

  if (newMessage.length > 1000) {
    throw new Error("Message must be less than 1000 characters");
  }

  const [updatedMessage] = await db
    .update(temporaryChatMessages)
    .set({
      message: newMessage,
      isEdited: true,
      editedAt: new Date(),
    })
    .where(
      and(
        eq(temporaryChatMessages.id, messageId),
        eq(temporaryChatMessages.userId, userId)
      )
    )
    .returning();

  if (!updatedMessage) {
    throw new Error("Message not found or unauthorized to edit");
  }

  return updatedMessage;
};

// Delete a temporary room message
export const deleteTemporaryMessage = async (messageId, userId) => {
  if (!messageId || !userId) {
    throw new Error("Message ID and user ID are required");
  }

  const [deletedMessage] = await db
    .update(temporaryChatMessages)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
    })
    .where(
      and(
        eq(temporaryChatMessages.id, messageId),
        eq(temporaryChatMessages.userId, userId)
      )
    )
    .returning();

  if (!deletedMessage) {
    throw new Error("Message not found or unauthorized to delete");
  }

  return deletedMessage;
};

// Note: deleteTemporaryRoomMessages is no longer needed - CASCADE deletion handles this automatically

// ===== PERMANENT ROOM CHAT FUNCTIONS =====

// Send a message to permanent room
export const sendPermanentMessage = async (messageData) => {
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
    .insert(permanentChatMessages)
    .values(chatData)
    .returning();

  console.log(`💬 Permanent message sent to ${roomId}`);
  return newMessage;
};

// Get messages for a permanent room
export const getPermanentRoomMessages = async (
  roomId,
  limit = 100,
  offset = 0
) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const messages = await db
    .select()
    .from(permanentChatMessages)
    .where(
      and(
        eq(permanentChatMessages.roomId, roomId),
        eq(permanentChatMessages.isDeleted, false)
      )
    )
    .orderBy(desc(permanentChatMessages.timestamp))
    .limit(limit)
    .offset(offset);

  return messages;
};

// Get recent messages for a permanent room
export const getPermanentRecentMessages = async (roomId, limit = 50) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const messages = await db
    .select()
    .from(permanentChatMessages)
    .where(
      and(
        eq(permanentChatMessages.roomId, roomId),
        eq(permanentChatMessages.isDeleted, false)
      )
    )
    .orderBy(desc(permanentChatMessages.timestamp))
    .limit(limit);

  return messages.reverse(); // Return in chronological order
};

// Edit a permanent room message
export const editPermanentMessage = async (messageId, newMessage, userId) => {
  if (!messageId || !newMessage || !userId) {
    throw new Error("Message ID, new message, and user ID are required");
  }

  if (newMessage.length > 1000) {
    throw new Error("Message must be less than 1000 characters");
  }

  const [updatedMessage] = await db
    .update(permanentChatMessages)
    .set({
      message: newMessage,
      isEdited: true,
      editedAt: new Date(),
    })
    .where(
      and(
        eq(permanentChatMessages.id, messageId),
        eq(permanentChatMessages.userId, userId)
      )
    )
    .returning();

  if (!updatedMessage) {
    throw new Error("Message not found or unauthorized to edit");
  }

  return updatedMessage;
};

// Delete a permanent room message
export const deletePermanentMessage = async (messageId, userId) => {
  if (!messageId || !userId) {
    throw new Error("Message ID and user ID are required");
  }

  const [deletedMessage] = await db
    .update(permanentChatMessages)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
    })
    .where(
      and(
        eq(permanentChatMessages.id, messageId),
        eq(permanentChatMessages.userId, userId)
      )
    )
    .returning();

  if (!deletedMessage) {
    throw new Error("Message not found or unauthorized to delete");
  }

  return deletedMessage;
};

// ===== UNIFIED FUNCTIONS (for backward compatibility) =====

// Send message (determines room type automatically)
export const sendMessage = async (messageData, roomType = "temporary") => {
  if (roomType === "permanent") {
    return await sendPermanentMessage(messageData);
  } else {
    return await sendTemporaryMessage(messageData);
  }
};

// Get room messages (determines room type automatically)
export const getRoomMessages = async (
  roomId,
  roomType = "temporary",
  limit = 100,
  offset = 0
) => {
  if (roomType === "permanent") {
    return await getPermanentRoomMessages(roomId, limit, offset);
  } else {
    return await getTemporaryRoomMessages(roomId, limit, offset);
  }
};

// Get recent messages (determines room type automatically)
export const getRecentMessages = async (
  roomId,
  roomType = "temporary",
  limit = 50
) => {
  if (roomType === "permanent") {
    return await getPermanentRecentMessages(roomId, limit);
  } else {
    return await getTemporaryRecentMessages(roomId, limit);
  }
};

// Edit message (determines room type automatically)
export const editMessage = async (
  messageId,
  newMessage,
  userId,
  roomType = "temporary"
) => {
  if (roomType === "permanent") {
    return await editPermanentMessage(messageId, newMessage, userId);
  } else {
    return await editTemporaryMessage(messageId, newMessage, userId);
  }
};

// Delete message (determines room type automatically)
export const deleteMessage = async (
  messageId,
  userId,
  roomType = "temporary"
) => {
  if (roomType === "permanent") {
    return await deletePermanentMessage(messageId, userId);
  } else {
    return await deleteTemporaryMessage(messageId, userId);
  }
};

// Get user's messages (searches both temporary and permanent)
export const getUserMessages = async (userId, limit = 50, offset = 0) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Get messages from both temporary and permanent rooms
  const [temporaryMessages, permanentMessages] = await Promise.all([
    db
      .select()
      .from(temporaryChatMessages)
      .where(
        and(
          eq(temporaryChatMessages.userId, userId),
          eq(temporaryChatMessages.isDeleted, false)
        )
      )
      .orderBy(desc(temporaryChatMessages.timestamp))
      .limit(limit)
      .offset(offset),

    db
      .select()
      .from(permanentChatMessages)
      .where(
        and(
          eq(permanentChatMessages.userId, userId),
          eq(permanentChatMessages.isDeleted, false)
        )
      )
      .orderBy(desc(permanentChatMessages.timestamp))
      .limit(limit)
      .offset(offset),
  ]);

  // Combine and sort by timestamp
  const allMessages = [...temporaryMessages, ...permanentMessages]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);

  return allMessages;
};

// Get message count for room (determines room type automatically)
export const getRoomMessageCount = async (roomId, roomType = "temporary") => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  let result;
  if (roomType === "permanent") {
    result = await db
      .select({ count: permanentChatMessages.id })
      .from(permanentChatMessages)
      .where(
        and(
          eq(permanentChatMessages.roomId, roomId),
          eq(permanentChatMessages.isDeleted, false)
        )
      );
  } else {
    result = await db
      .select({ count: temporaryChatMessages.id })
      .from(temporaryChatMessages)
      .where(
        and(
          eq(temporaryChatMessages.roomId, roomId),
          eq(temporaryChatMessages.isDeleted, false)
        )
      );
  }

  return result[0]?.count || 0;
};

// Get room activity summary (determines room type automatically)
export const getRoomActivitySummary = async (
  roomId,
  roomType = "temporary"
) => {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const messageCount = await getRoomMessageCount(roomId, roomType);
  const recentMessages = await getRecentMessages(roomId, roomType, 5);

  return {
    roomId,
    roomType,
    messageCount,
    recentMessages,
    lastActivity:
      recentMessages.length > 0 ? recentMessages[0].timestamp : null,
  };
};

// Get message by ID (searches both temporary and permanent)
export const getMessageById = async (messageId) => {
  if (!messageId) {
    throw new Error("Message ID is required");
  }

  // Search in temporary messages first
  let [message] = await db
    .select()
    .from(temporaryChatMessages)
    .where(eq(temporaryChatMessages.id, messageId))
    .limit(1);

  if (!message) {
    // Search in permanent messages
    [message] = await db
      .select()
      .from(permanentChatMessages)
      .where(eq(permanentChatMessages.id, messageId))
      .limit(1);
  }

  if (!message) {
    throw new Error("Message not found");
  }

  return message;
};

// Note: deleteRoomMessages is no longer needed - CASCADE deletion handles this automatically

// Export all functions as a service object
export const chatService = {
  // Temporary room functions
  sendTemporaryMessage,
  getTemporaryRoomMessages,
  getTemporaryRecentMessages,
  editTemporaryMessage,
  deleteTemporaryMessage,

  // Permanent room functions
  sendPermanentMessage,
  getPermanentRoomMessages,
  getPermanentRecentMessages,
  editPermanentMessage,
  deletePermanentMessage,

  // Unified functions (for backward compatibility)
  sendMessage,
  getRoomMessages,
  getRecentMessages,
  editMessage,
  deleteMessage,
  getUserMessages,
  getRoomMessageCount,
  getRoomActivitySummary,
  getMessageById,
};
