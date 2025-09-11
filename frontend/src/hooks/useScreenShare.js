import { useState, useEffect, useCallback } from "react";

/**
 * Simple screen sharing hook - just replaces tracks, no SDP renegotiation
 */
export const useScreenShare = (
  socketRef,
  roomId,
  username,
  peerConnectionsRef,
  localStreamRef,
  socketReady = false
) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenShareSupported, setIsScreenShareSupported] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState({});

  // Check screen sharing support
  useEffect(() => {
    setIsScreenShareSupported(
      !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
    );
  }, []);

  // Listen for remote screen sharing events
  useEffect(() => {
    if (!socketReady) {
      return;
    }

    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    const handleUserScreenSharing = (data) => {
      console.log("📺 Received screen sharing event:", data);
      setRemoteScreenSharing((prev) => {
        const newState = {
          ...prev,
          [data.username]: {
            isSharing: data.isSharing,
          },
        };
        return newState;
      });
    };

    const handleInitialScreenSharingState = (screenSharingState) => {
      console.log(
        "📺 Received initial screen sharing state:",
        screenSharingState
      );
      setRemoteScreenSharing(screenSharingState);
    };

    socket.on("user-screen-sharing", handleUserScreenSharing);
    socket.on("initial-screen-sharing-state", handleInitialScreenSharingState);

    return () => {
      socket.off("user-screen-sharing", handleUserScreenSharing);
      socket.off(
        "initial-screen-sharing-state",
        handleInitialScreenSharingState
      );
    };
  }, [socketRef, socketReady]);

  // Simple function to replace video track in all peer connections
  const replaceVideoTrack = useCallback(
    (newTrack) => {
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        if (
          pc.connectionState === "connected" ||
          pc.connectionState === "connecting"
        ) {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender && newTrack) {
            sender.replaceTrack(newTrack).catch((error) => {
              console.error("Error replacing video track:", error);
            });
          }
        }
      });
    },
    [peerConnectionsRef]
  );

  const startScreenShare = useCallback(async () => {
    try {
      console.log("Starting screen share");

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setScreenStream(stream);
      setIsScreenSharing(true);

      // Create a new stream that combines screen share video with original audio
      const newStream = new MediaStream();

      // Add screen share video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        newStream.addTrack(videoTrack);
      }

      // Add original audio track (if available)
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }
      }

      // Update the local stream reference to use the screen sharing stream
      localStreamRef.current = newStream;

      // Replace video track in existing peer connections
      if (videoTrack) {
        replaceVideoTrack(videoTrack);
      }

      // Handle when user stops screen sharing from browser UI
      stream.getVideoTracks()[0].onended = async () => {
        console.log("Screen sharing ended by user");
        // Stop screen stream
        stream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
        setIsScreenSharing(false);

        // Restore original camera stream
        try {
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 },
              frameRate: { ideal: 30, max: 60 },
              facingMode: "user",
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
              channelCount: 2,
            },
          });

          // Update localStreamRef to use the fresh camera stream
          localStreamRef.current = cameraStream;

          // Replace video track in existing peer connections
          const cameraTrack = cameraStream.getVideoTracks()[0];
          if (cameraTrack) {
            replaceVideoTrack(cameraTrack);
          }
        } catch (error) {
          console.error("Error getting camera stream:", error);
        }

        // Notify other users
        if (socketRef.current) {
          socketRef.current.emit("screen-share-stopped", { roomId, username });
        }
      };

      // Notify other users
      if (socketRef.current) {
        socketRef.current.emit("screen-share-started", { roomId, username });
      }
    } catch (error) {
      console.error("Error starting screen share:", error);
      alert("Failed to start screen sharing. Please try again.");
    }
  }, [socketRef, roomId, username, replaceVideoTrack, localStreamRef]);

  const stopScreenShare = useCallback(async () => {
    try {
      console.log("Stopping screen share");

      // Stop screen stream
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }

      setIsScreenSharing(false);

      // Restore original camera stream
      // We need to get a fresh camera stream since we replaced localStreamRef.current
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 2,
          },
        });

        // Update localStreamRef to use the fresh camera stream
        localStreamRef.current = cameraStream;

        // Replace video track in existing peer connections
        const cameraTrack = cameraStream.getVideoTracks()[0];
        if (cameraTrack) {
          replaceVideoTrack(cameraTrack);
        }
      } catch (error) {
        console.error("Error getting camera stream:", error);
      }

      // Notify other users
      if (socketRef.current) {
        socketRef.current.emit("screen-share-stopped", { roomId, username });
      }
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  }, [
    screenStream,
    localStreamRef,
    socketRef,
    roomId,
    username,
    replaceVideoTrack,
  ]);

  const toggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [screenStream]);

  return {
    isScreenSharing,
    screenStream,
    isScreenShareSupported,
    remoteScreenSharing,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
  };
};
