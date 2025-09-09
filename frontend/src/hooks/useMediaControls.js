import { useState, useCallback } from "react";

/**
 * Custom hook for managing media controls (audio/video mute)
 * @param {Object} localStreamRef - Local media stream reference
 */
export const useMediaControls = (localStreamRef) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isVideoMuted;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Force stop all media tracks
  const forceStopAllTracks = useCallback(() => {
    console.log("Force stopping all media tracks from useMediaControls");
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log(`Force stopping ${tracks.length} tracks from media controls`);

      tracks.forEach((track) => {
        console.log(
          `Force stopping track: ${track.kind} - ${track.label} (enabled: ${track.enabled}, readyState: ${track.readyState})`
        );

        // Disable the track first
        track.enabled = false;

        // Then stop it
        track.stop();

        // Verify it's stopped
        if (track.readyState === "live") {
          console.warn(
            `Track ${track.kind} still live after stop, trying again`
          );
          track.stop();
        }
      });

      console.log("All tracks force stopped from media controls");
    }
  }, [localStreamRef]);

  return {
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    forceStopAllTracks,
  };
};
