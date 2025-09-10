import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, Smile, X, Users } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import EmojiPicker from "./EmojiPicker";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";

/**
 * Chat Component
 * Main chat interface for video call rooms
 */
const Chat = memo(
  ({ socketRef, username, roomId, userId = null, userCount }) => {
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messageInputRef = useRef(null);

    // Use local state for messages and typing to prevent parent re-renders
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    // Get setChatOpen function directly from store to avoid hook re-renders
    const setChatOpen = useChatStore.getState().setChatOpen;

    // Set current room when component mounts
    useEffect(() => {
      console.log("🏠 Chat component mounted for room:", roomId);
      console.log("🔌 Socket connected:", socketRef.current?.connected);
      console.log("🔌 Socket ID:", socketRef.current?.id);
      console.log("🔌 Socket rooms:", socketRef.current?.rooms);
    }, [roomId, socketRef]);

    // Socket event handlers
    const handleNewMessage = useCallback(
      (data) => {
        console.log(
          "📨 Received chat message:",
          data.username,
          ":",
          data.message
        );
        // Add message from other users (own messages are already added when sending)
        if (data.username !== username) {
          console.log("✅ Adding other user's message to local state");
          const newMessage = {
            id: data.id || Date.now().toString(),
            username: data.username,
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            type: data.type || "text",
            roomId: data.roomId,
          };
          setMessages((prev) => [...prev, newMessage]);
        } else {
          console.log("⏭️ Skipped own message (already added when sending)");
        }
      },
      [username]
    );

    const handleUserTyping = useCallback(
      (data) => {
        console.log(
          "👤 User typing:",
          data.username,
          "Current user:",
          username
        );
        if (data.username !== username) {
          setTypingUsers((prev) => {
            const newTypingUsers = [...new Set([...prev, data.username])];
            console.log("📝 Updated typing users:", newTypingUsers);
            return newTypingUsers;
          });
        }
      },
      [username]
    );

    const handleUserStoppedTyping = useCallback(
      (data) => {
        console.log("👤 User stopped typing:", data.username);
        if (data.username !== username) {
          setTypingUsers((prev) => {
            const newTypingUsers = prev.filter(
              (user) => user !== data.username
            );
            console.log("📝 Updated typing users after stop:", newTypingUsers);
            return newTypingUsers;
          });
        }
      },
      [username]
    );

    const handleMessageSent = useCallback(() => {
      // Message sent successfully
    }, []);

    const handleChatError = useCallback((error) => {
      console.error("❌ Chat error:", error);
    }, []);

    // Socket event listeners - ONLY real-time messaging, no history
    useEffect(() => {
      const socket = socketRef.current;
      if (!socket) {
        console.log("❌ No socket available for chat listeners");
        return;
      }

      console.log("🔌 Setting up chat socket listeners");

      // Only listen to real-time events
      socket.on("chat-message", handleNewMessage);
      socket.on("chat-message-sent", handleMessageSent);
      socket.on("chat-error", handleChatError);
      socket.on("user-typing", handleUserTyping);
      socket.on("user-stopped-typing", handleUserStoppedTyping);

      // Debug: Listen to all socket events to see what's being received
      socket.onAny((eventName, ...args) => {
        if (eventName.includes("chat") || eventName.includes("message")) {
          console.log("🔍 Socket event received:", eventName, args);
        }
      });

      console.log("✅ Socket event listeners set up successfully");

      return () => {
        socket.off("chat-message", handleNewMessage);
        socket.off("chat-message-sent", handleMessageSent);
        socket.off("chat-error", handleChatError);
        socket.off("user-typing", handleUserTyping);
        socket.off("user-stopped-typing", handleUserStoppedTyping);
      };
    }, [
      socketRef,
      username,
      roomId,
      handleNewMessage,
      handleUserTyping,
      handleUserStoppedTyping,
      handleMessageSent,
      handleChatError,
    ]);

    const handleSendMessage = (e) => {
      e.preventDefault();
      if (!message.trim() || !socketRef.current) return;

      const messageData = {
        id: Date.now().toString(),
        username,
        userId,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        type: "text",
        roomId,
      };

      console.log(
        "📤 Sending chat message:",
        messageData.username,
        ":",
        messageData.message
      );

      // Add message to local state for immediate display
      setMessages((prev) => [...prev, messageData]);

      // Send message to other users via WebSocket
      socketRef.current.emit("chat-message", messageData);

      // Clear input and stop typing
      setMessage("");
      setIsTyping(false);
      socketRef.current.emit("stop-typing", { username, roomId });

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };

    const handleEmojiSelect = (emoji) => {
      setMessage((prev) => prev + emoji);
      setShowEmojiPicker(false);
      messageInputRef.current?.focus();
    };

    const handleInputChange = (e) => {
      const value = e.target.value;
      setMessage(value);

      // Handle typing indicators
      if (value.trim() && !isTyping) {
        setIsTyping(true);
        socketRef.current?.emit("typing", { username, roomId });
      } else if (!value.trim() && isTyping) {
        setIsTyping(false);
        socketRef.current?.emit("stop-typing", { username, roomId });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      if (value.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          socketRef.current?.emit("stop-typing", { username, roomId });
        }, 1000);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
      }
    };

    // Use local state instead of global store
    const currentMessages = messages;
    const currentTypingUsers = typingUsers;

    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 shadow-xl border-2 border-white rounded-lg flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Chat
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({userCount})
            </span>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList messages={currentMessages} currentUsername={username} />
          <TypingIndicator typingUsers={currentTypingUsers} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={messageInputRef}
                type="text"
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                maxLength={500}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <Smile className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 right-4 z-10">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
        </div>
      </div>
    );
  }
);

Chat.displayName = "Chat";

export default Chat;
