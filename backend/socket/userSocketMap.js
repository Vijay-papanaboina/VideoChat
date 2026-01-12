// User Socket Mapping
// Maps userId -> socketId for real-time notifications
// This enables getUserSocket() to find online users

const userSocketMap = new Map();

/**
 * Register a user's socket connection
 * @param {string|number} userId - The user's ID
 * @param {string} socketId - The socket ID
 */
export const registerUserSocket = (userId, socketId) => {
  if (userId) {
    userSocketMap.set(String(userId), socketId);
    console.log(`📌 Registered socket for user ${userId}: ${socketId}`);
  }
};

/**
 * Unregister a user's socket connection
 * @param {string|number} userId - The user's ID
 */
export const unregisterUserSocket = (userId) => {
  if (userId) {
    userSocketMap.delete(String(userId));
    console.log(`📍 Unregistered socket for user ${userId}`);
  }
};

/**
 * Unregister a socket by its ID (for disconnect cleanup)
 * @param {string} socketId - The socket ID to remove
 * @returns {string|null} The userId that was removed, or null
 */
export const unregisterSocketById = (socketId) => {
  for (const [userId, sid] of userSocketMap.entries()) {
    if (sid === socketId) {
      userSocketMap.delete(userId);
      console.log(`📍 Unregistered socket ${socketId} for user ${userId}`);
      return userId;
    }
  }
  return null;
};

/**
 * Get a user's socket instance
 * @param {object} io - The Socket.IO server instance
 * @param {string|number} userId - The user's ID
 * @returns {Socket|null} The socket instance or null if not found
 */
export const getUserSocket = (io, userId) => {
  if (!userId) return null;

  const socketId = userSocketMap.get(String(userId));
  if (!socketId) return null;

  return io.sockets.sockets.get(socketId) || null;
};

/**
 * Check if a user is currently online
 * @param {string|number} userId - The user's ID
 * @returns {boolean}
 */
export const isUserOnline = (userId) => {
  return userId ? userSocketMap.has(String(userId)) : false;
};

/**
 * Get all online user IDs
 * @returns {string[]}
 */
export const getOnlineUsers = () => {
  return Array.from(userSocketMap.keys());
};

export default {
  registerUserSocket,
  unregisterUserSocket,
  unregisterSocketById,
  getUserSocket,
  isUserOnline,
  getOnlineUsers,
};
