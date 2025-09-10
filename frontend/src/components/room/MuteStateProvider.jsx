import { useState, useCallback } from "react";
import { MuteStateContext } from "../../contexts/MuteStateContext";

// Provider component that manages mute state
export const MuteStateProvider = ({ children, localStreamRef }) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  }, [localStreamRef, isAudioMuted]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isVideoMuted;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  }, [localStreamRef, isVideoMuted]);

  const value = {
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
  };

  return (
    <MuteStateContext.Provider value={value}>
      {children}
    </MuteStateContext.Provider>
  );
};
