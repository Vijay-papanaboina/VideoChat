import { memo } from "react";
import { useMuteState } from "../../hooks/useMuteState";
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
      />
    );
  }
);

MediaControlsWrapper.displayName = "MediaControlsWrapper";

export default MediaControlsWrapper;
