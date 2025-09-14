import { create } from "zustand";

/**
 * Chat message structure
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique message ID
 * @property {string} username - Username of the sender
 * @property {string} message - Message content
 * @property {string} timestamp - ISO timestamp
 * @property {string} type - Message type ('text', 'emoji', 'system')
 * @property {string} roomId - Room ID where message was sent
 */

/**
 * Chat store using Zustand for global state management
 * NO PERSISTENCE - messages are only kept in memory during the session
 */
export const useChatStore = create((set) => ({
  // State
  messages: [],
  isChatOpen: false, // Open by default
  currentRoomId: null,
  isTyping: false,
  typingUsers: [],

  // Actions
  setCurrentRoom: (roomId) => {
    set((state) => {
      // Only clear messages if room actually changed
      if (state.currentRoomId !== roomId) {
        return { currentRoomId: roomId, messages: [] };
      } else {
        return { currentRoomId: roomId };
      }
    });
  },

  addMessage: (message) => {
    set((state) => {
      const newMessages = [...state.messages, message];
      return { messages: newMessages };
    });
  },

  addMultipleMessages: (messages) => {
    set((state) => ({
      messages: [...state.messages, ...messages],
    }));
  },

  setRoomMessages: (messages) => {
    set({ messages });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  toggleChat: () => {
    set((state) => ({ isChatOpen: !state.isChatOpen }));
  },

  setChatOpen: (isOpen) => {
    set({ isChatOpen: isOpen });
  },

  setTyping: (isTyping) => {
    set({ isTyping });
  },

  addTypingUser: (username) => {
    set((state) => ({
      typingUsers: [...new Set([...state.typingUsers, username])],
    }));
  },

  removeTypingUser: (username) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter((user) => user !== username),
    }));
  },

  clearTypingUsers: () => {
    set({ typingUsers: [] });
  },
}));

/**
 * Hook for chat actions
 */
export const useChatActions = () => {
  const {
    addMessage,
    addMultipleMessages,
    setRoomMessages,
    clearMessages,
    toggleChat,
    setChatOpen,
    setTyping,
    addTypingUser,
    removeTypingUser,
    clearTypingUsers,
    setCurrentRoom,
  } = useChatStore();

  return {
    addMessage,
    addMultipleMessages,
    setRoomMessages,
    clearMessages,
    toggleChat,
    setChatOpen,
    setTyping,
    addTypingUser,
    removeTypingUser,
    clearTypingUsers,
    setCurrentRoom,
  };
};

/**
 * Hook for chat state
 */
export const useChatState = () => {
  const { messages, isChatOpen, currentRoomId, isTyping, typingUsers } =
    useChatStore();

  return {
    messages,
    isChatOpen,
    currentRoomId,
    isTyping,
    typingUsers,
  };
};
