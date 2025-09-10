import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing screen sharing functionality
 * @param {Object} socketRef - Socket.IO reference
 * @param {string} roomId - Current room ID
 * @param {string} username - Current username
 * @param {Object} peerConnectionsRef - WebRTC peer connections reference
 * @param {Object} localStreamRef - Local media stream reference
 */
export const useScreenShare = (
  socketRef,
  roomId,
  username,
  peerConnectionsRef,
  localStreamRef,
  isVideoMuted = false
) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [screenShareType, setScreenShareType] = useState(null);
  const [isScreenShareSupported, setIsScreenShareSupported] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState({});

  // Create a blank video track for when video is muted
  const createBlankVideoTrack = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const stream = canvas.captureStream(30);
    return stream.getVideoTracks()[0];
  };

  // Check screen sharing support
  useEffect(() => {
    const checkScreenShareSupport = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        setIsScreenShareSupported(true);
        console.log("Screen sharing is supported");
      } else {
        setIsScreenShareSupported(false);
        console.log("Screen sharing is not supported");
      }
    };
    checkScreenShareSupport();
  }, []);

  // Listen for remote screen sharing events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleUserScreenSharing = (data) => {
      console.log(`${data.username} screen sharing: ${data.isSharing}`);
      setRemoteScreenSharing((prev) => ({
        ...prev,
        [data.username]: {
          isSharing: data.isSharing,
          shareType: data.shareType || null,
        },
      }));
    };

    socket.on("user-screen-sharing", handleUserScreenSharing);

    return () => {
      socket.off("user-screen-sharing", handleUserScreenSharing);
    };
  }, [socketRef]);

  const startScreenShare = async () => {
    try {
      console.log("Starting screen share");

      // Let browser handle the selection, just provide basic constraints
      const constraints = {
        video: {
          cursor: "always", // Show cursor
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Store the screen stream
      setScreenStream(stream);
      setIsScreenSharing(true);
      setScreenShareType("screen"); // Default to "screen" since browser handles selection

      console.log("Screen sharing started:", stream);

      // Replace video track in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        // If video is muted, create a blank video track
        const trackToSend = isVideoMuted ? createBlankVideoTrack() : videoTrack;

        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(trackToSend);
            console.log(
              `Replaced video track in peer connection (muted: ${isVideoMuted})`
            );
          }
        });
      }

      // Handle screen share end
      stream.getVideoTracks()[0].onended = () => {
        console.log("Screen sharing ended by user");
        stopScreenShare();
      };

      // Notify other users about screen sharing
      socketRef.current.emit("screen-share-started", {
        roomId,
        shareType: "screen", // Default to "screen" since browser handles selection
        username,
      });
    } catch (error) {
      console.error("Error starting screen share:", error);
      alert("Failed to start screen sharing. Please try again.");
    }
  };

  const stopScreenShare = useCallback(() => {
    try {
      console.log("Stopping screen share");

      // Stop the screen stream
      if (screenStream) {
        screenStream.getTracks().forEach((track) => {
          console.log("Stopping screen track:", track.kind);
          track.stop();
        });
        setScreenStream(null);
      }

      setIsScreenSharing(false);
      setScreenShareType(null);

      // Restore camera video track
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          Object.values(peerConnectionsRef.current).forEach((pc) => {
            const sender = pc
              .getSenders()
              .find((s) => s.track && s.track.kind === "video");
            if (sender) {
              sender.replaceTrack(videoTrack);
              console.log("Restored camera video track");
            }
          });
        }
      }

      // Notify other users
      socketRef.current.emit("screen-share-stopped", { roomId, username });
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  }, [
    screenStream,
    localStreamRef,
    peerConnectionsRef,
    socketRef,
    roomId,
    username,
  ]);

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Handle video mute changes during screen sharing
  const handleVideoMuteChange = useCallback(
    (videoMuted) => {
      if (isScreenSharing && screenStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
          const trackToSend = videoMuted ? createBlankVideoTrack() : videoTrack;

          Object.values(peerConnectionsRef.current).forEach((pc) => {
            const sender = pc
              .getSenders()
              .find((s) => s.track && s.track.kind === "video");
            if (sender) {
              sender.replaceTrack(trackToSend);
              console.log(
                `Updated video track for screen share (muted: ${videoMuted})`
              );
            }
          });
        }
      }
    },
    [isScreenSharing, screenStream, peerConnectionsRef]
  );

  // Expose the function to be called externally when video mute state changes
  const updateVideoMuteState = useCallback(
    (videoMuted) => {
      handleVideoMuteChange(videoMuted);
    },
    [handleVideoMuteChange]
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("Cleaning up screen share");

    // Force stop screen share if active
    if (isScreenSharing) {
      console.log("Force stopping screen share during cleanup");
      stopScreenShare();
    }

    // Additional cleanup for screen stream
    if (screenStream) {
      console.log("Stopping screen stream tracks during cleanup");
      screenStream.getTracks().forEach((track) => {
        console.log("Stopping screen track:", track.kind, track.label);
        track.stop();
      });
    }

    // Reset all screen share state
    setScreenStream(null);
    setIsScreenSharing(false);
    setScreenShareType(null);

    console.log("Screen share cleanup completed");
  }, [stopScreenShare, isScreenSharing, screenStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isScreenSharing,
    screenStream,
    screenShareType,
    isScreenShareSupported,
    remoteScreenSharing,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
    updateVideoMuteState,
    cleanup,
  };
};
