/**
 * API utility functions for backend communication
 */

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

/**
 * Chat API functions
 */
export const chatAPI = {
  /**
   * Get recent messages for a room
   */
  getRecentMessages: async (roomId, limit = 50) => {
    return apiRequest(`/api/chat/room/${roomId}/recent?limit=${limit}`);
  },

  // sendMessage removed - now handled via WebSocket on backend

  /**
   * Get room message count
   */
  getRoomMessageCount: async (roomId) => {
    return apiRequest(`/api/chat/room/${roomId}/count`);
  },
};

/**
 * Room API functions
 */
export const roomAPI = {
  // No frontend deletion needed - backend handles cleanup when room is destroyed
};
