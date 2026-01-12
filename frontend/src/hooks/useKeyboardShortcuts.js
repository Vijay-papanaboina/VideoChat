import { useEffect, useCallback } from "react";

/**
 * useKeyboardShortcuts Hook
 * Handles keyboard shortcuts for room controls
 *
 * Shortcuts:
 * - M: Toggle mute audio
 * - V: Toggle video
 * - S: Toggle screen share
 * - C: Toggle chat
 * - Escape: Exit screen share or close chat
 */
const useKeyboardShortcuts = ({
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  isScreenSharing,
  isChatOpen,
  enabled = true,
}) => {
  const handleKeyDown = useCallback(
    (event) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't trigger if modifier keys are pressed (allow browser shortcuts)
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "m":
          event.preventDefault();
          onToggleAudio?.();
          break;
        case "v":
          event.preventDefault();
          onToggleVideo?.();
          break;
        case "s":
          event.preventDefault();
          onToggleScreenShare?.();
          break;
        case "c":
          event.preventDefault();
          onToggleChat?.();
          break;
        case "escape":
          event.preventDefault();
          // Priority: close chat first, then stop screen share
          if (isChatOpen) {
            onToggleChat?.();
          } else if (isScreenSharing) {
            onToggleScreenShare?.();
          }
          break;
        default:
          break;
      }
    },
    [
      onToggleAudio,
      onToggleVideo,
      onToggleScreenShare,
      onToggleChat,
      isScreenSharing,
      isChatOpen,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  // Return shortcut hints for UI
  return {
    shortcuts: [
      { key: "M", action: "Mute/Unmute" },
      { key: "V", action: "Toggle Video" },
      { key: "S", action: "Screen Share" },
      { key: "C", action: "Toggle Chat" },
      { key: "Esc", action: "Close/Stop" },
    ],
  };
};

export default useKeyboardShortcuts;
