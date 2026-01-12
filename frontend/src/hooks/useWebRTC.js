import { useRef, useState, useCallback } from "react";
import { createPeerConnection, adjustVideoQuality } from "../utils/webrtc";

/**
 * Custom hook for managing WebRTC connections
 */
export const useWebRTC = (socketRef) => {
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteUsernames, setRemoteUsernames] = useState({});
  const [localStreamReady, setLocalStreamReady] = useState(false);

  // Get user's camera and microphone access with high-quality constraints
  const initializeLocalStream = useCallback(async () => {
    const mediaConstraints = {
      video: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: "user",
        // Prefer hardware acceleration
        advanced: [
          { width: { min: 1280 } },
          { height: { min: 720 } },
          { frameRate: { min: 24 } },
          { aspectRatio: { exact: 16 / 9 } },
        ],
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2,
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );
      console.log("Local stream obtained:", stream);
      localStreamRef.current = stream;
      setLocalStreamReady(true);

      // Apply high quality settings
      adjustVideoQuality(stream, "high");

      return stream;
    } catch (error) {
      console.error("Error getting user media:", error);
      throw error;
    }
  }, []);

  // WebRTC Signaling Handlers
  const handleOffer = useCallback(
    (payload) => {
      console.log(`Received offer from ${payload.caller}`);
      const pc = peerConnectionsRef.current[payload.caller];
      if (!pc) {
        console.error(`No peer connection found for ${payload.caller}`);
        return;
      }

      // Check if we can set remote description
      if (
        pc.signalingState === "stable" ||
        pc.signalingState === "have-remote-offer"
      ) {
        console.log(
          `Setting remote description for offer from ${payload.caller} (signaling state: ${pc.signalingState})`
        );

        pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          .then(() => {
            console.log(
              `Set remote description for ${payload.caller}, creating answer`
            );

            // Process any deferred ICE candidates
            if (pc.deferredCandidates && pc.deferredCandidates.length > 0) {
              console.log(
                `Processing ${pc.deferredCandidates.length} deferred ICE candidates for ${payload.caller}`
              );
              const candidatePromises = pc.deferredCandidates.map((candidate) =>
                pc.addIceCandidate(new RTCIceCandidate(candidate))
              );
              return Promise.all(candidatePromises).then(() => {
                pc.deferredCandidates = [];
                return pc.createAnswer({
                  voiceActivityDetection: true,
                });
              });
            } else {
              return pc.createAnswer({
                voiceActivityDetection: true,
              });
            }
          })
          .then((answer) => {
            console.log(
              `Created answer for ${payload.caller}, setting local description`
            );
            return pc.setLocalDescription(answer);
          })
          .then(() => {
            console.log(`Sending answer to ${payload.caller}`);
            socketRef.current.emit("answer", {
              target: payload.caller,
              callee: socketRef.current.id,
              sdp: pc.localDescription,
            });
          })
          .catch((error) => {
            console.error(
              `Error handling offer from ${payload.caller}:`,
              error
            );
          });
      } else {
        console.log(
          `Skipping offer from ${payload.caller} - signaling state: ${pc.signalingState}`
        );
      }
    },
    [socketRef]
  );

  const handleAnswer = useCallback((payload) => {
    console.log(`Received answer from ${payload.callee}`);
    const pc = peerConnectionsRef.current[payload.callee];
    if (!pc) {
      console.error(`No peer connection found for ${payload.callee}`);
      return;
    }

    // Check if we can set remote description
    if (
      pc.signalingState === "have-local-offer" ||
      pc.signalingState === "stable"
    ) {
      console.log(
        `Setting remote description for answer from ${payload.callee} (signaling state: ${pc.signalingState})`
      );

      pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        .then(() => {
          console.log(
            `Set remote description for answer from ${payload.callee}`
          );

          // Process any deferred ICE candidates
          if (pc.deferredCandidates && pc.deferredCandidates.length > 0) {
            console.log(
              `Processing ${pc.deferredCandidates.length} deferred ICE candidates for ${payload.callee}`
            );
            const candidatePromises = pc.deferredCandidates.map((candidate) =>
              pc.addIceCandidate(new RTCIceCandidate(candidate))
            );
            return Promise.all(candidatePromises).then(() => {
              pc.deferredCandidates = [];
            });
          }
        })
        .catch((error) => {
          console.error(`Error handling answer from ${payload.callee}:`, error);
        });
    } else {
      console.log(
        `Skipping answer from ${payload.callee} - signaling state: ${pc.signalingState}`
      );
    }
  }, []);

  const handleIceCandidate = useCallback((payload) => {
    const pc = peerConnectionsRef.current[payload.sender];
    if (pc && payload.candidate) {
      // Only add ICE candidate if remote description is set
      if (pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(
          (error) => {
            console.error("Error adding ICE candidate:", error);
          }
        );
      } else {
        console.log(
          `Deferring ICE candidate for ${payload.sender} - remote description not set yet`
        );
        // Store the candidate to add later when remote description is set
        if (!pc.deferredCandidates) {
          pc.deferredCandidates = [];
        }
        pc.deferredCandidates.push(payload.candidate);
      }
    }
  }, []);

  const handleUserLeft = useCallback(
    (socketId) => {
      console.log("User left:", socketId);
      // Close the peer connection
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
      // Remove the remote stream from state
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[socketId];
        return newStreams;
      });
      // Remove the username from state
      setRemoteUsernames((prev) => {
        const newUsernames = { ...prev };
        delete newUsernames[socketId];
        return newUsernames;
      });
    },
    [setRemoteStreams, setRemoteUsernames]
  );

  // Setup socket event listeners
  const setupSocketListeners = useCallback(() => {
    if (!socketRef.current) return;

    // Remove existing listeners to prevent duplicates
    socketRef.current.off("all-users");
    socketRef.current.off("user-joined");
    socketRef.current.off("offer");
    socketRef.current.off("answer");
    socketRef.current.off("ice-candidate");
    socketRef.current.off("user-left");

    // Fired when the user successfully joins and receives a list of other users
    socketRef.current.on("all-users", handleAllUsers);

    // Fired when a new user joins the room
    socketRef.current.on("user-joined", (payload) => {
      console.log("New user joined:", payload);
      // Store the username for this socket ID
      setRemoteUsernames((prev) => ({
        ...prev,
        [payload.socketId]: payload.username,
      }));

      // Only create peer connection if it doesn't already exist
      if (!peerConnectionsRef.current[payload.socketId]) {
        const pc = createPeerConnection(
          payload.socketId,
          false,
          localStreamRef,
          socketRef,
          setRemoteStreams
        );
        peerConnectionsRef.current[payload.socketId] = pc;
      }

      // The new user will initiate the connection, so we wait for their offer
    });

    // Fired when receiving a WebRTC offer from another peer
    socketRef.current.on("offer", handleOffer);

    // Fired when receiving a WebRTC answer from another peer
    socketRef.current.on("answer", handleAnswer);

    // Fired when receiving an ICE candidate from another peer
    socketRef.current.on("ice-candidate", handleIceCandidate);

    // Fired when a user leaves the room
    socketRef.current.on("user-left", handleUserLeft);
  }, [
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleUserLeft,
    socketRef,
  ]);

  // Handle receiving list of all users
  const handleAllUsers = useCallback(
    (otherUsers) => {
      console.log("All other users in room:", otherUsers);
      otherUsers.forEach((userData) => {
        const socketId =
          typeof userData === "string" ? userData : userData.socketId;
        const username =
          typeof userData === "string"
            ? `User ${socketId.slice(-4)}`
            : userData.username;

        // Store the username for this socket ID
        setRemoteUsernames((prev) => ({
          ...prev,
          [socketId]: username,
        }));

        // Only create peer connection if it doesn't already exist
        if (!peerConnectionsRef.current[socketId]) {
          const pc = createPeerConnection(
            socketId,
            true,
            localStreamRef,
            socketRef,
            setRemoteStreams
          );
          peerConnectionsRef.current[socketId] = pc;
        }
      });
    },
    [socketRef, localStreamRef]
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("Cleaning up WebRTC");

    // Remove socket event listeners
    if (socketRef.current) {
      socketRef.current.off("all-users");
      socketRef.current.off("user-joined");
      socketRef.current.off("offer");
      socketRef.current.off("answer");
      socketRef.current.off("ice-candidate");
      socketRef.current.off("user-left");
    }

    // Stop all media tracks
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log(`Found ${tracks.length} tracks to stop`);

      tracks.forEach((track) => {
        console.log(
          "Stopping track:",
          track.kind,
          track.label,
          "enabled:",
          track.enabled
        );
        track.stop();
        // Ensure track is stopped
        if (track.readyState === "live") {
          console.warn("Track still live after stop(), forcing stop");
          track.stop();
        }
      });

      // Clear the stream reference
      localStreamRef.current = null;
    }

    // Close all peer connections
    const peerConnections = peerConnectionsRef.current;
    Object.entries(peerConnections).forEach(([socketId, pc]) => {
      console.log("Closing peer connection for socket:", socketId);
      if (pc && pc.connectionState !== "closed") {
        pc.close();
      }
    });

    // Clear peer connections
    peerConnectionsRef.current = {};

    console.log("WebRTC cleanup completed");
  }, [socketRef]);

  return {
    localStreamRef,
    peerConnectionsRef,
    remoteStreams,
    remoteUsernames,
    localStreamReady,
    initializeLocalStream,
    setupSocketListeners,
    handleAllUsers, // Exporting this for manual triggering
    cleanup,
  };
};
