import { memo } from "react";
import Chat from "./Chat";

/**
 * ChatSidebar Component
 * Isolated wrapper for chat to prevent re-renders of video components
 */
const ChatSidebar = memo(
  ({ socketRef, username, roomId, userId, isOpen, userCount }) => {
    // Return null when closed - socket listeners will be in RoomPage
    if (!isOpen) return null;

    return (
      <div className="w-[15%] min-w-80 h-full py-2 pr-2 animate-in slide-in-from-right fade-in duration-300">
        <Chat
          socketRef={socketRef}
          username={username}
          roomId={roomId}
          userId={userId}
          userCount={userCount}
        />
      </div>
    );
  }
);

ChatSidebar.displayName = "ChatSidebar";

export default ChatSidebar;
