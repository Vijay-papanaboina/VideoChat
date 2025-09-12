import { memo } from "react";
import { MicOff, VideoOff } from "lucide-react";
import { useMuteState } from "../../contexts/MuteStateContext";

/**
 * MuteIndicators Component
 * Displays mute indicators without causing parent re-renders
 */
const MuteIndicators = memo(
  ({ isScreenSharing, showForFullScreen = false, showForCorner = false }) => {
    const { isAudioMuted, isVideoMuted } = useMuteState();
    if (showForFullScreen) {
      return (
        <>
          {isAudioMuted && (
            <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 z-10">
              <MicOff className="w-4 h-4" />
              Muted
            </div>
          )}
          {isVideoMuted && (
            <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 z-10">
              <VideoOff className="w-4 h-4" />
              {isScreenSharing ? "Screen Off" : "Camera Off"}
            </div>
          )}
        </>
      );
    }

    if (showForCorner) {
      return (
        <>
          {isAudioMuted && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded-full">
              <MicOff className="w-3 h-3" />
            </div>
          )}
          {isVideoMuted && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded-full">
              <VideoOff className="w-3 h-3" />
            </div>
          )}
        </>
      );
    }

    return null;
  }
);

MuteIndicators.displayName = "MuteIndicators";

export default MuteIndicators;
