import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/**
 * RoomPage Component
 * This component handles the core video call functionality, including:
 * - Socket.IO connection for signaling
 * - WebRTC peer connections for video/audio streaming
 * - Dynamic video grid layout
 */
const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Refs for socket, local media stream, and peer connections
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // Maps socketId to RTCPeerConnection

  // State for remote streams and user information
  const [remoteStreams, setRemoteStreams] = useState({}); // Maps socketId to MediaStream
  const [remoteUsernames, setRemoteUsernames] = useState({}); // Maps socketId to username
  const [localStreamReady, setLocalStreamReady] = useState(false);

  // State for credential prompt
  const [showCredentialPrompt, setShowCredentialPrompt] = useState(false);
  const [promptUsername, setPromptUsername] = useState("");
  const [promptPassword, setPromptPassword] = useState("");

  // State for stream focusing
  const [focusedStream, setFocusedStream] = useState(null); // null = normal layout, "local" = local stream focused, socketId = remote stream focused

  // Monitor remote streams to prevent unexpected clearing
  useEffect(() => {
    console.log("Remote streams changed:", Object.keys(remoteStreams));
  }, [remoteStreams]);

  // This useEffect is no longer needed since we set localStreamReady directly

  // Get user details from navigation state
  const username = location.state?.username;
  const password = location.state?.password;

  // Debug logging
  console.log("Location state:", location.state);
  console.log("Username:", username);
  console.log("Password:", password);

  // Check if credentials are missing and show prompt
  useEffect(() => {
    if (!username || !password) {
      setShowCredentialPrompt(true);
    }
  }, [username, password]);

  // Handle credential prompt submission
  const handleCredentialSubmit = (e) => {
    e.preventDefault();
    if (promptUsername.trim() && promptPassword.trim()) {
      // Close the dialog
      setShowCredentialPrompt(false);
      // Update the location state with new credentials
      navigate(`/room/${roomId}`, {
        state: { username: promptUsername, password: promptPassword },
        replace: true,
      });
    }
  };

  useEffect(() => {
    console.log("useEffect running - checking credentials");
    // Only proceed if credentials are available
    if (!username || !password) {
      console.log("No credentials found, showing prompt");
      return;
    }
    console.log("Credentials found, proceeding with room setup");

    // Initialize socket connection
    const serverUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    socketRef.current = io(serverUrl);

    // Get user's camera and microphone access
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("Local stream obtained:", stream);
        localStreamRef.current = stream;
        setLocalStreamReady(true); // Set ready state immediately

        // Emit 'join-room' event with user details
        socketRef.current.emit("join-room", { roomId, password, username });

        // --- Socket Event Handlers ---

        // Fired when the user successfully joins and receives a list of other users
        socketRef.current.on("all-users", (otherUsers) => {
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

            // For each existing user, create a new peer connection
            const pc = createPeerConnection(socketId, true);
            peerConnectionsRef.current[socketId] = pc;
          });
        });

        // Fired when a new user joins the room
        socketRef.current.on("user-joined", (payload) => {
          console.log("New user joined:", payload);
          // Store the username for this socket ID
          setRemoteUsernames((prev) => ({
            ...prev,
            [payload.socketId]: payload.username,
          }));
          // Create a peer connection for the new user (but don't initiate the call)
          const pc = createPeerConnection(payload.socketId, false);
          peerConnectionsRef.current[payload.socketId] = pc;

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

        // --- Error Handlers ---
        socketRef.current.on("room-full", () => {
          alert("This room is full (max 5 users).");
          navigate("/");
        });

        socketRef.current.on("join-error", (error) => {
          alert(`Error joining room: ${error.message}`);
          navigate("/");
        });
      })
      .catch((error) => {
        console.error("Error getting user media:", error);
        alert("Could not access camera and microphone.");
        navigate("/");
      });

    // Cleanup function on component unmount
    return () => {
      // Stop all media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Close all peer connections
      const peerConnections = peerConnectionsRef.current;
      Object.values(peerConnections).forEach((pc) => pc.close());
      // Disconnect the socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, username, password, navigate]);

  /**
   * Creates and configures a new RTCPeerConnection.
   * @param {string} targetSocketId - The socket ID of the peer to connect with.
   * @param {boolean} isInitiator - True if this client is initiating the connection.
   * @returns {RTCPeerConnection} The configured peer connection.
   */
  const createPeerConnection = (targetSocketId, isInitiator) => {
    console.log(
      `Creating peer connection for ${targetSocketId}, isInitiator: ${isInitiator}`
    );
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add connection state logging and monitoring
    pc.onconnectionstatechange = () => {
      console.log(
        `Connection state for ${targetSocketId}:`,
        pc.connectionState
      );

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
        pc.createOffer()
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
      }, 100);
    }

    return pc;
  };

  // --- WebRTC Signaling Handlers ---

  const handleOffer = (payload) => {
    console.log(`Received offer from ${payload.caller}`);
    const pc = peerConnectionsRef.current[payload.caller];
    if (!pc) {
      console.error(`No peer connection found for ${payload.caller}`);
      return;
    }

    pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
      .then(() => {
        console.log(
          `Set remote description for ${payload.caller}, creating answer`
        );
        return pc.createAnswer();
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
        console.error(`Error handling offer from ${payload.caller}:`, error);
      });
  };

  const handleAnswer = (payload) => {
    console.log(`Received answer from ${payload.callee}`);
    const pc = peerConnectionsRef.current[payload.callee];
    if (!pc) {
      console.error(`No peer connection found for ${payload.callee}`);
      return;
    }

    pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
      .then(() => {
        console.log(`Set remote description for answer from ${payload.callee}`);
      })
      .catch((error) => {
        console.error(`Error handling answer from ${payload.callee}:`, error);
      });
  };

  const handleIceCandidate = (payload) => {
    const pc = peerConnectionsRef.current[payload.sender];
    if (pc && payload.candidate) {
      pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(
        (error) => {
          console.error("Error adding ICE candidate:", error);
        }
      );
    }
  };

  const handleUserLeft = (socketId) => {
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
  };

  // --- Stream Click Handlers ---
  const handleStreamClick = (streamType, socketId = null) => {
    if (focusedStream === (streamType === "local" ? "local" : socketId)) {
      // If clicking the same stream, return to normal layout
      setFocusedStream(null);
    } else {
      // Focus on the clicked stream
      setFocusedStream(streamType === "local" ? "local" : socketId);
    }
  };

  // --- Dynamic Layout Calculation ---
  const remoteStreamsArray = Object.entries(remoteStreams)
    .filter(([, stream]) => stream && stream.active) // Only include active streams
    .map(([socketId, stream]) => ({
      socketId,
      stream,
      username: remoteUsernames[socketId] || `User ${socketId.slice(-4)}`,
    }));

  // Layout classes based on number of remote streams and focused state
  const getLayoutClasses = (remoteStreamCount, isFocused) => {
    if (isFocused) {
      // When focused, use responsive grid layout
      // Desktop: 70/30 split, Mobile: vertical stack (focused on top, others below)
      return "grid-cols-1 grid-rows-2 md:grid-cols-[70%_30%] md:grid-rows-1";
    } else {
      // Normal layout - responsive based on screen size
      switch (remoteStreamCount) {
        case 0:
          return "grid-cols-1 grid-rows-1"; // Just local video - full screen
        case 1:
          return "grid-cols-1 grid-rows-1"; // 1 remote stream - full screen
        case 2:
          return "grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1"; // Mobile: vertical, Desktop: horizontal
        case 3:
          return "grid-cols-1 grid-rows-3 sm:grid-cols-2 sm:grid-rows-2"; // Mobile: vertical stack, Desktop: 2x2 grid
        case 4:
          return "grid-cols-1 grid-rows-4 sm:grid-cols-2 sm:grid-rows-2"; // Mobile: vertical stack, Desktop: 2x2 grid
        default:
          return "grid-cols-1 grid-rows-5 sm:grid-cols-3 sm:grid-rows-2"; // Mobile: vertical stack, Desktop: 3x2 grid
      }
    }
  };

  const isFocused = focusedStream !== null;
  const gridClass = getLayoutClasses(remoteStreamsArray.length, isFocused);

  console.log("Remote streams count:", remoteStreamsArray.length);
  console.log("Remote streams:", remoteStreamsArray);
  console.log("Layout class:", gridClass);

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* Credential Prompt Modal */}
      {showCredentialPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Enter Room Credentials
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Please enter your username and room password to join this room.
            </p>
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="prompt-username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Username
                </label>
                <input
                  id="prompt-username"
                  type="text"
                  value={promptUsername}
                  onChange={(e) => setPromptUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="prompt-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Room Password
                </label>
                <input
                  id="prompt-password"
                  type="password"
                  value={promptPassword}
                  onChange={(e) => setPromptPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter room password"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Join Room
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main grid for videos */}
      <div className={`grid w-full h-full gap-2 p-2 ${gridClass}`}>
        {remoteStreamsArray.length === 0 ? (
          // Show local video full screen when no remote streams
          <div
            className={`relative w-full h-full cursor-pointer transition-all duration-300 ${
              focusedStream === "local"
                ? "ring-4 ring-blue-500 ring-opacity-75"
                : ""
            }`}
            onClick={() => handleStreamClick("local")}
          >
            <video
              key={
                localStreamReady ? "local-video-ready" : "local-video-waiting"
              }
              autoPlay
              playsInline
              muted
              ref={(video) => {
                console.log(
                  "Video ref called, video:",
                  video,
                  "localStream:",
                  localStreamRef.current,
                  "ready:",
                  localStreamReady
                );
                if (video && localStreamRef.current) {
                  video.srcObject = localStreamRef.current;
                  console.log("Set local video srcObject (full screen)");
                } else {
                  console.log(
                    "Cannot set video srcObject - missing video element or stream"
                  );
                }
              }}
              className="w-full h-full object-cover rounded-lg border-2 border-white shadow-lg"
              style={{ transform: "scaleX(-1)" }} // Mirror effect
              onLoadedMetadata={() =>
                console.log("Local video metadata loaded")
              }
              onCanPlay={() => console.log("Local video can play")}
            />
            {/* Local username overlay for full screen */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-lg font-medium">
              {username} (You)
            </div>
            {/* Click to focus indicator */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs sm:text-xs md:text-sm">
              <span className="hidden sm:inline">Click to focus</span>
              <span className="sm:hidden">Tap to focus</span>
            </div>
          </div>
        ) : (
          // Show streams based on focus state
          (() => {
            if (isFocused) {
              // When focused, show focused stream on left, others stacked vertically on right
              const focusedStreamData =
                focusedStream === "local"
                  ? { type: "local", username: username }
                  : remoteStreamsArray.find(
                      (s) => s.socketId === focusedStream
                    );

              const otherStreams =
                focusedStream === "local"
                  ? remoteStreamsArray
                  : [
                      // Include local stream in the stack when remote stream is focused
                      { type: "local", username: username, socketId: "local" },
                      // Include other remote streams (excluding the focused one)
                      ...remoteStreamsArray.filter(
                        (s) => s.socketId !== focusedStream
                      ),
                    ];

              return (
                <>
                  {/* Focused stream - responsive sizing */}
                  <div
                    className="relative w-full h-full cursor-pointer transition-all duration-300 ring-4 ring-blue-500 ring-opacity-75 md:col-span-1 md:row-span-1"
                    onClick={() =>
                      handleStreamClick(
                        focusedStream === "local" ? "local" : focusedStream
                      )
                    }
                  >
                    {focusedStream === "local" ? (
                      // Local stream focused
                      <>
                        <video
                          key="local-video-focused"
                          autoPlay
                          playsInline
                          muted
                          ref={(video) => {
                            if (video && localStreamRef.current) {
                              video.srcObject = localStreamRef.current;
                            }
                          }}
                          className="w-full h-full object-cover rounded-lg border-2 border-white shadow-lg"
                          style={{ transform: "scaleX(-1)" }}
                        />
                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-lg font-medium">
                          {username} (You) - FOCUSED
                        </div>
                      </>
                    ) : (
                      // Remote stream focused
                      <>
                        <video
                          autoPlay
                          playsInline
                          ref={(video) => {
                            if (video && focusedStreamData?.stream) {
                              video.srcObject = focusedStreamData.stream;
                            }
                          }}
                          className="w-full h-full object-cover rounded-lg border-2 border-white shadow-lg"
                        />
                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-lg font-medium">
                          {focusedStreamData?.username} - FOCUSED
                        </div>
                      </>
                    )}
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs sm:text-xs md:text-sm">
                      <span className="hidden sm:inline">Click to unfocus</span>
                      <span className="sm:hidden">Tap to unfocus</span>
                    </div>
                  </div>

                  {/* Other streams - responsive layout */}
                  <div className="flex flex-col gap-2 h-full overflow-hidden md:flex-col">
                    {otherStreams.map(
                      ({
                        socketId,
                        stream,
                        username: remoteUsername,
                        type,
                      }) => (
                        <div
                          key={socketId}
                          className="relative flex-1 min-h-0 cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-blue-300 touch-manipulation active:ring-2 active:ring-blue-400"
                          onClick={() =>
                            handleStreamClick(
                              type === "local" ? "local" : "remote",
                              socketId
                            )
                          }
                        >
                          <video
                            autoPlay
                            playsInline
                            muted={type === "local"}
                            ref={(video) => {
                              if (video) {
                                if (
                                  type === "local" &&
                                  localStreamRef.current
                                ) {
                                  video.srcObject = localStreamRef.current;
                                } else if (type !== "local" && stream) {
                                  video.srcObject = stream;
                                }
                              }
                            }}
                            className="w-full h-full object-cover rounded-lg"
                            style={
                              type === "local"
                                ? { transform: "scaleX(-1)" }
                                : {}
                            }
                          />
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
                            {remoteUsername} {type === "local" ? "(You)" : ""}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </>
              );
            } else {
              // Normal layout - show all remote streams
              return remoteStreamsArray.map(
                ({ socketId, stream, username: remoteUsername }) => (
                  <div
                    key={socketId}
                    className="relative w-full h-full cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-blue-300 touch-manipulation active:ring-2 active:ring-blue-400"
                    onClick={() => handleStreamClick("remote", socketId)}
                  >
                    <video
                      autoPlay
                      playsInline
                      ref={(video) => {
                        if (video && stream) {
                          video.srcObject = stream;
                          console.log(`Set video srcObject for ${socketId}`);
                        }
                      }}
                      className="w-full h-full object-cover rounded-lg"
                      onLoadedMetadata={() => {
                        console.log(`Video metadata loaded for ${socketId}`);
                      }}
                      onCanPlay={() => {
                        console.log(`Video can play for ${socketId}`);
                      }}
                      onError={(e) => {
                        console.error(`Video error for ${socketId}:`, e);
                      }}
                    />
                    {/* Username overlay */}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
                      {remoteUsername}
                    </div>
                    {/* Click to focus indicator */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-1 py-1 rounded text-xs sm:text-xs md:text-sm">
                      <span className="hidden sm:inline">Click to focus</span>
                      <span className="sm:hidden">Tap to focus</span>
                    </div>
                  </div>
                )
              );
            }
          })()
        )}
      </div>

      {/* Local video in the corner (only show when there are remote streams and not focused) */}
      {remoteStreamsArray.length > 0 && !isFocused && (
        <div
          className="absolute bottom-4 right-4 w-32 h-24 sm:w-48 sm:h-36 md:w-64 md:h-48 cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-blue-300 touch-manipulation"
          onClick={() => handleStreamClick("local")}
        >
          <div className="relative w-full h-full">
            <video
              key={
                localStreamReady
                  ? "local-video-corner-ready"
                  : "local-video-corner-waiting"
              }
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (video && localStreamRef.current) {
                  video.srcObject = localStreamRef.current;
                  console.log("Set local video srcObject (corner)");
                }
              }}
              className="w-full h-full object-cover rounded-lg border-2 border-white shadow-lg"
              style={{ transform: "scaleX(-1)" }} // Mirror effect
            />
            {/* Local username overlay */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
              {username} (You)
            </div>
            {/* Click to focus indicator */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-1 py-1 rounded text-xs sm:text-xs md:text-sm">
              <span className="hidden sm:inline">Click to focus</span>
              <span className="sm:hidden">Tap to focus</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
