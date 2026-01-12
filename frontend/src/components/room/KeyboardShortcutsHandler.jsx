import { useEffect } from "react";
import { useMuteState } from "../../contexts/MuteStateContext";
import { useChatActions, useChatStore } from "../../stores/chatStore";

/**
 * KeyboardShortcutsHandler Component
 * Handles keyboard shortcuts for room controls
 * Must be rendered inside MuteStateProvider
 */
const KeyboardShortcutsHandler = ({ onToggleScreenShare, isScreenSharing }) => {
  const { toggleAudio, toggleVideo } = useMuteState();
  const { toggleChat } = useChatActions();
  const isChatOpen = useChatStore((state) => state.isChatOpen);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't trigger if modifier keys are pressed
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "m":
          event.preventDefault();
          toggleAudio?.();
          break;
        case "v":
          event.preventDefault();
          toggleVideo?.();
          break;
        case "s":
          event.preventDefault();
          onToggleScreenShare?.();
          break;
        case "c":
          event.preventDefault();
          toggleChat?.();
          break;
        case "escape":
          event.preventDefault();
          if (isChatOpen) {
            toggleChat?.();
          } else if (isScreenSharing) {
            onToggleScreenShare?.();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    toggleAudio,
    toggleVideo,
    onToggleScreenShare,
    toggleChat,
    isScreenSharing,
    isChatOpen,
  ]);

  // This component doesn't render anything
  return null;
};

export default KeyboardShortcutsHandler;
