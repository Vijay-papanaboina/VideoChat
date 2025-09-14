import { memo } from "react";
import { useMuteState } from "../../contexts/MuteStateContext";
import MediaControls from "./MediaControls";

/**
 * MediaControlsWrapper Component
 * Isolates media controls to prevent main component re-renders
 */
const MediaControlsWrapper = memo(
  ({
    isScreenSharing,
    isScreenShareSupported,
    isChatOpen,
    onToggleScreenShare,
    onToggleChat,
    onLeaveRoom,
    isAdmin,
    onOpenRoomManagement,
    // Recording props
    isRecording,
    onToggleRecording,
    // Screenshot props
    onTakeScreenshot,
  }) => {
    const { isAudioMuted, isVideoMuted, toggleAudio, toggleVideo } =
      useMuteState();

    return (
      <MediaControls
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        isScreenSharing={isScreenSharing}
        isScreenShareSupported={isScreenShareSupported}
        isChatOpen={isChatOpen}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={onToggleScreenShare}
        onToggleChat={onToggleChat}
        onLeaveRoom={onLeaveRoom}
        isAdmin={isAdmin}
        onOpenRoomManagement={onOpenRoomManagement}
        // Recording props
        isRecording={isRecording}
        onToggleRecording={onToggleRecording}
        // Screenshot props
        onTakeScreenshot={onTakeScreenshot}
      />
    );
  }
);

MediaControlsWrapper.displayName = "MediaControlsWrapper";

export default MediaControlsWrapper;
