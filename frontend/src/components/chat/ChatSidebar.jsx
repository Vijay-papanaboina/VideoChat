import { memo } from "react";
import { X } from "lucide-react";
import Chat from "./Chat";
import { useChatActions } from "../../stores/chatStore";

/**
 * ChatSidebar Component
 * - Mobile: Full-screen overlay with close button
 * - Desktop: 15% width sidebar
 */
const ChatSidebar = memo(
  ({ socketRef, username, roomId, userId, isOpen, userCount }) => {
    const { toggleChat } = useChatActions();

    // Return null when closed - socket listeners will be in RoomPage
    if (!isOpen) return null;

    return (
      <>
        {/* Mobile: Full-screen overlay */}
        <div className="fixed inset-0 z-50 bg-background sm:hidden">
          {/* Close button */}
          <button
            onClick={toggleChat}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-full pt-2 px-2 pb-2">
            <Chat
              socketRef={socketRef}
              username={username}
              roomId={roomId}
              userId={userId}
              userCount={userCount}
            />
          </div>
        </div>

        {/* Desktop: Sidebar */}
        <div className="hidden sm:block w-[15%] min-w-80 h-full py-2 pr-2 animate-in slide-in-from-right fade-in duration-300">
          <Chat
            socketRef={socketRef}
            username={username}
            roomId={roomId}
            userId={userId}
            userCount={userCount}
          />
        </div>
      </>
    );
  }
);

ChatSidebar.displayName = "ChatSidebar";

export default ChatSidebar;
