import { useEffect, useRef } from "react";
import { format } from "date-fns";

/**
 * MessageList Component
 * Displays the list of chat messages
 */
const MessageList = ({ messages, currentUsername }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp), "HH:mm");
    } catch {
      return "00:00";
    }
  };

  const formatDate = (timestamp) => {
    try {
      const messageDate = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (messageDate.toDateString() === today.toDateString()) {
        return "Today";
      } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return format(messageDate, "MMM dd");
      }
    } catch {
      return "";
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-sm">No messages yet</p>
          <p className="text-xs">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message, index) => {
        const isCurrentUser = message.username === currentUsername;
        const showDate =
          index === 0 ||
          formatDate(message.timestamp) !==
            formatDate(messages[index - 1].timestamp);
        const showAvatar =
          index === 0 ||
          message.username !== messages[index - 1].username ||
          formatDate(message.timestamp) !==
            formatDate(messages[index - 1].timestamp);

        return (
          <div key={message.id}>
            {/* Date separator */}
            {showDate && (
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                  {formatDate(message.timestamp)}
                </div>
              </div>
            )}

            {/* Message */}
            <div
              className={`flex gap-2 ${
                isCurrentUser ? "flex-row" : "flex-row-reverse"
              }`}
            >
              {/* Avatar */}
              {showAvatar && (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCurrentUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {message.username.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Message content */}
              <div
                className={`flex-1 max-w-xs ${
                  !showAvatar ? (isCurrentUser ? "ml-10" : "mr-10") : ""
                }`}
              >
                {/* Username and time */}
                {showAvatar && (
                  <div
                    className={`flex items-center gap-2 mb-1 ${
                      isCurrentUser ? "justify-start" : "justify-end"
                    }`}
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {isCurrentUser ? "You" : message.username}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    isCurrentUser
                      ? "bg-blue-600 text-white rounded-bl-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-br-sm"
                  }`}
                >
                  {message.type === "system" ? (
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 italic">
                      {message.message}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">
                      {message.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
