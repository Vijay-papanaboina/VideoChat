import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, Smile, X, Users, Loader2 } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { chatAPI } from "../../utils/api";
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
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messageInputRef = useRef(null);

    // Use global chatStore for messages to persist across panel open/close
    const messages = useChatStore((state) => state.messages);
    const currentRoomId = useChatStore((state) => state.currentRoomId);
    const addMessage = useChatStore((state) => state.addMessage);
    const setRoomMessages = useChatStore((state) => state.setRoomMessages);
    const setCurrentRoom = useChatStore((state) => state.setCurrentRoom);
    const setChatOpen = useChatStore((state) => state.setChatOpen);

    // Local state for typing users (doesn't need persistence)
    const [typingUsers, setTypingUsers] = useState([]);

    // Load chat history when room changes (not on every mount)
    const loadChatHistory = useCallback(async () => {
      // Only load if room changed or no messages exist
      if (!roomId) return;

      // If room hasn't changed and we have messages, don't reload
      if (currentRoomId === roomId && messages.length > 0) {
        console.log("📚 Chat history already loaded for room:", roomId);
        return;
      }

      setIsLoadingHistory(true);
      try {
        console.log("📚 Loading chat history for room:", roomId);

        // Set current room in store
        setCurrentRoom(roomId);

        const response = await chatAPI.getRecentMessages(roomId, 50);

        if (response.success && response.data) {
          console.log(
            "✅ Chat history loaded:",
            response.data.length,
            "messages"
          );
          // Convert database messages to frontend format
          const formattedMessages = response.data.map((msg) => ({
            id: msg.id.toString(),
            username: msg.username,
            message: msg.message,
            timestamp: msg.timestamp,
            type: msg.messageType || "text",
            roomId: msg.roomId,
          }));
          setRoomMessages(formattedMessages);
        }
      } catch (error) {
        console.error("❌ Failed to load chat history:", error);
        // Don't show error to user, just continue without history
      } finally {
        setIsLoadingHistory(false);
      }
    }, [
      roomId,
      currentRoomId,
      messages.length,
      setCurrentRoom,
      setRoomMessages,
    ]);

    // Set current room when component mounts
    useEffect(() => {
      console.log("🏠 Chat component mounted for room:", roomId);
      console.log("🔌 Socket connected:", socketRef.current?.connected);
      console.log("🔌 Socket ID:", socketRef.current?.id);
      console.log("🔌 Socket rooms:", socketRef.current?.rooms);

      // Load chat history when component mounts
      loadChatHistory();
    }, [roomId, socketRef, loadChatHistory]);

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
          addMessage(newMessage);
        } else {
          console.log("⏭️ Skipped own message (already added when sending)");
        }
      },
      [username, addMessage]
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

    // Socket event listeners - chat-message handled at RoomPage level
    // This only handles typing indicators and errors
    useEffect(() => {
      const socket = socketRef.current;
      if (!socket) {
        console.log("❌ No socket available for chat listeners");
        return;
      }

      console.log("🔌 Setting up chat typing listeners");

      // chat-message is handled at RoomPage level to persist when panel is closed
      socket.on("chat-message-sent", handleMessageSent);
      socket.on("chat-error", handleChatError);
      socket.on("user-typing", handleUserTyping);
      socket.on("user-stopped-typing", handleUserStoppedTyping);

      console.log("✅ Chat listeners set up successfully");

      return () => {
        socket.off("chat-message-sent", handleMessageSent);
        socket.off("chat-error", handleChatError);
        socket.off("user-typing", handleUserTyping);
        socket.off("user-stopped-typing", handleUserStoppedTyping);
      };
    }, [
      socketRef,
      username,
      roomId,
      handleUserTyping,
      handleUserStoppedTyping,
      handleMessageSent,
      handleChatError,
    ]);

    const handleSendMessage = async (e) => {
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

      // Add message to store for immediate display (persists across panel open/close)
      addMessage(messageData);

      // Send message to other users via WebSocket (backend will save to database)
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

    // Use store messages and local typing users
    const currentMessages = messages;
    const currentTypingUsers = typingUsers;

    return (
      <div className="w-full h-full bg-background shadow-xl border-2 border-white rounded-lg flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-foreground">Chat</h3>
            <span className="text-sm text-muted-foreground">({userCount})</span>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          {isLoadingHistory ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading chat history...</p>
              </div>
            </div>
          ) : (
            <>
              <MessageList
                messages={currentMessages}
                currentUsername={username}
              />
              <TypingIndicator typingUsers={currentTypingUsers} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={messageInputRef}
                type="text"
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground placeholder-muted-foreground"
                maxLength={500}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <Smile className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
