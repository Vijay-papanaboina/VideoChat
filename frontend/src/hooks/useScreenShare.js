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
  localStreamRef
) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [screenShareType, setScreenShareType] = useState(null);
  const [isScreenShareSupported, setIsScreenShareSupported] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState({});

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

  const startScreenShare = async (shareType = "screen") => {
    try {
      console.log(`Starting screen share: ${shareType}`);

      // Different constraints based on share type
      const constraints = {
        video: {
          displaySurface:
            shareType === "screen"
              ? "monitor"
              : shareType === "window"
              ? "window"
              : "browser",
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
      setScreenShareType(shareType);

      console.log("Screen sharing started:", stream);

      // Replace video track in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
            console.log("Replaced video track in peer connection");
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
        shareType,
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
      startScreenShare("screen");
    }
  };

  const startScreenShareWithType = (shareType) => {
    if (isScreenSharing) {
      stopScreenShare();
    }
    startScreenShare(shareType);
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("Cleaning up screen share");
    stopScreenShare();
  }, [stopScreenShare]);

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
    startScreenShareWithType,
    cleanup,
  };
};
