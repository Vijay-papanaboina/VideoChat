/**
 * WebRTC configuration and utilities
 */

// TURN server credentials from environment (for production reliability)
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME;
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL;
const TURN_SERVER = import.meta.env.VITE_TURN_SERVER || "a.relay.metered.ca";

export const ICE_SERVERS = {
  iceServers: [
    // STUN servers (free, for NAT traversal)
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    // TURN servers (for restrictive firewalls/symmetric NAT)
    // Only add if credentials are configured
    ...(TURN_USERNAME && TURN_CREDENTIAL
      ? [
          {
            urls: `turn:${TURN_SERVER}:80`,
            username: TURN_USERNAME,
            credential: TURN_CREDENTIAL,
          },
          {
            urls: `turn:${TURN_SERVER}:443`,
            username: TURN_USERNAME,
            credential: TURN_CREDENTIAL,
          },
          {
            urls: `turn:${TURN_SERVER}:443?transport=tcp`,
            username: TURN_USERNAME,
            credential: TURN_CREDENTIAL,
          },
        ]
      : []),
  ],
  // Enhanced configuration for better quality
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceTransportPolicy: "all",
};

/**
 * Function to adjust video quality based on network conditions
 * @param {MediaStream} stream - The media stream to adjust
 * @param {string} quality - Quality level: 'high', 'medium', 'low'
 */
export const adjustVideoQuality = (stream, quality = "high") => {
  if (!stream) return;

  const videoTracks = stream.getVideoTracks();
  videoTracks.forEach((track) => {
    const settings = track.getSettings();
    console.log("Current video settings:", settings);

    // Apply quality constraints
    const constraints = {
      width:
        quality === "high"
          ? { ideal: 1920, max: 1920 }
          : quality === "medium"
          ? { ideal: 1280, max: 1280 }
          : { ideal: 640, max: 640 },
      height:
        quality === "high"
          ? { ideal: 1080, max: 1080 }
          : quality === "medium"
          ? { ideal: 720, max: 720 }
          : { ideal: 480, max: 480 },
      frameRate:
        quality === "high"
          ? { ideal: 30, max: 60 }
          : quality === "medium"
          ? { ideal: 24, max: 30 }
          : { ideal: 15, max: 24 },
    };

    track.applyConstraints(constraints).catch(console.error);
  });
};

/**
 * Creates and configures a new RTCPeerConnection
 * @param {string} targetSocketId - The socket ID of the peer to connect with
 * @param {boolean} isInitiator - True if this client is initiating the connection
 * @param {Object} localStreamRef - Reference to local media stream
 * @param {Object} socketRef - Socket.IO reference
 * @param {Function} setRemoteStreams - Function to update remote streams state
 * @returns {RTCPeerConnection} The configured peer connection
 */
export const createPeerConnection = (
  targetSocketId,
  isInitiator,
  localStreamRef,
  socketRef,
  setRemoteStreams
) => {
  console.log(
    `Creating peer connection for ${targetSocketId}, isInitiator: ${isInitiator}`
  );

  // Initialize deferred candidates array
  const pc = new RTCPeerConnection(ICE_SERVERS);
  pc.deferredCandidates = [];

  // Configure codec preferences for better quality
  const transceivers = pc.getTransceivers();
  if (transceivers.length > 0) {
    // Prefer VP9 for better quality, fallback to VP8, then H.264
    const codecPreferences = [
      { mimeType: "video/VP9", clockRate: 90000 },
      { mimeType: "video/VP8", clockRate: 90000 },
      { mimeType: "video/H264", clockRate: 90000 },
    ];

    transceivers.forEach((transceiver) => {
      if (
        transceiver.sender &&
        transceiver.sender.track &&
        transceiver.sender.track.kind === "video"
      ) {
        const { setCodecPreferences } = transceiver;
        if (setCodecPreferences) {
          setCodecPreferences(codecPreferences);
        }
      }
    });
  }

  // Add connection state logging and monitoring
  pc.onconnectionstatechange = () => {
    console.log(`Connection state for ${targetSocketId}:`, pc.connectionState);

    // If connection fails or closes, remove the stream
    if (pc.connectionState === "failed" || pc.connectionState === "closed") {
      console.log(
        `Connection ${pc.connectionState} for ${targetSocketId}, removing stream`
      );
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[targetSocketId];
        return newStreams;
      });
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log(
      `ICE connection state for ${targetSocketId}:`,
      pc.iceConnectionState
    );

    // If ICE connection fails, remove the stream
    if (
      pc.iceConnectionState === "failed" ||
      pc.iceConnectionState === "disconnected"
    ) {
      console.log(
        `ICE connection ${pc.iceConnectionState} for ${targetSocketId}, removing stream`
      );
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[targetSocketId];
        return newStreams;
      });
    }
  };

  // Add local stream tracks to the connection
  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach((track) => {
      console.log(
        `Adding track to peer connection for ${targetSocketId}:`,
        track.kind
      );
      pc.addTrack(track, localStreamRef.current);
    });
  }

  // Handle incoming remote tracks
  pc.ontrack = (event) => {
    console.log(
      `Received remote track from ${targetSocketId}:`,
      event.streams[0]
    );
    const remoteStream = event.streams[0];

    // Add event listeners to track stream state
    remoteStream.onaddtrack = () => {
      console.log(`Track added to stream for ${targetSocketId}`);
    };

    remoteStream.onremovetrack = () => {
      console.log(`Track removed from stream for ${targetSocketId}`);
    };

    // Update remote streams state
    setRemoteStreams((prev) => {
      const newStreams = {
        ...prev,
        [targetSocketId]: remoteStream,
      };
      console.log(`Updated remote streams:`, Object.keys(newStreams));
      return newStreams;
    });
  };

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log(`Sending ICE candidate to ${targetSocketId}`);
      socketRef.current.emit("ice-candidate", {
        target: targetSocketId,
        candidate: event.candidate,
      });
    }
  };

  // If this client is the initiator, create and send an offer
  if (isInitiator) {
    console.log(`Creating offer for ${targetSocketId}`);
    // Add a small delay to ensure the peer connection is fully set up
    setTimeout(() => {
      // Check if peer connection is still valid before creating offer
      if (pc.connectionState === "new" || pc.connectionState === "connecting") {
        pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
          voiceActivityDetection: true,
          iceRestart: false,
        })
          .then((offer) => {
            console.log(`Setting local description for ${targetSocketId}`);
            return pc.setLocalDescription(offer);
          })
          .then(() => {
            console.log(`Sending offer to ${targetSocketId}`);
            socketRef.current.emit("offer", {
              target: targetSocketId,
              caller: socketRef.current.id,
              sdp: pc.localDescription,
            });
          })
          .catch((error) => {
            console.error(`Error creating offer for ${targetSocketId}:`, error);
          });
      } else {
        console.log(
          `Skipping offer creation for ${targetSocketId} - connection state: ${pc.connectionState}`
        );
      }
    }, 100);
  }

  return pc;
};
