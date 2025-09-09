import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Monitor } from "lucide-react";

// Import custom hooks
import { useWebRTC } from "../hooks/useWebRTC";
import { useMediaControls } from "../hooks/useMediaControls";
import { useScreenShare } from "../hooks/useScreenShare";
import { useAuthState } from "../stores/authStore";
import { useChatActions } from "../stores/chatStore";

// Import components
import MediaControls from "../components/MediaControls";
import VideoGrid from "../components/VideoGrid";
import CredentialPrompt from "../components/CredentialPrompt";
import Chat from "../components/chat/Chat";

// Import utilities
import {
  forceStopAllMediaTracks,
  stopStreamTracks,
  debugMediaTracks,
} from "../utils/mediaCleanup";

/**
 * RoomPage Component (Refactored)
 * This component handles the core video call functionality with separated concerns
 */
const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthState();

  // Refs for socket
  const socketRef = useRef(null);

  // State for credential prompt
  const [showCredentialPrompt, setShowCredentialPrompt] = useState(false);

  // State for stream focusing
  const [focusedStream, setFocusedStream] = useState(null);

  // Get user details from navigation state
  const username = location.state?.username;
  const password = location.state?.password;

  // Custom hooks
  const {
    localStreamRef,
    peerConnectionsRef,
    remoteStreams,
    remoteUsernames,
    localStreamReady,
    initializeLocalStream,
    setupSocketListeners,
    cleanup,
  } = useWebRTC(socketRef);

  const {
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    forceStopAllTracks,
  } = useMediaControls(localStreamRef);

  const { toggleChat } = useChatActions();

  const {
    isScreenSharing,
    isScreenShareSupported,
    screenShareType,
    remoteScreenSharing,
    toggleScreenShare,
    cleanup: cleanupScreenShare,
  } = useScreenShare(
    socketRef,
    roomId,
    username,
    peerConnectionsRef,
    localStreamRef,
    isVideoMuted
  );

  // Check if credentials are missing and show prompt
  useEffect(() => {
    if (!username || !password) {
      setShowCredentialPrompt(true);
    }
  }, [username, password]);

  // Main room setup effect
  useEffect(() => {
    console.log("useEffect running - checking credentials");
    // Only proceed if credentials are available
    if (!username || !password) {
      console.log("No credentials found, showing prompt");
      return;
    }
    console.log("Credentials found, proceeding with room setup");

    // Capture ref value for cleanup
    const currentStreamRef = localStreamRef;

    // Add beforeunload event listener to ensure cleanup on page close
    const handleBeforeUnload = () => {
      console.log("Page unloading - stopping media tracks");
      if (currentStreamRef.current) {
        const tracks = currentStreamRef.current.getTracks();
        tracks.forEach((track) => {
          console.log(
            "Beforeunload: stopping track:",
            track.kind,
            track.label,
            "enabled:",
            track.enabled,
            "readyState:",
            track.readyState
          );
          track.enabled = false;
          track.stop();
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Initialize socket connection
    const serverUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    socketRef.current = io(serverUrl);

    // Initialize local stream and setup
    initializeLocalStream()
      .then(() => {
        // Emit 'join-room' event with user details
        socketRef.current.emit("join-room", {
          roomId,
          password,
          username,
          userId: isAuthenticated ? user.id : null,
        });

        // Setup socket event listeners
        setupSocketListeners();

        // Error handlers
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
      console.log("Component unmounting - performing cleanup");

      // Remove beforeunload event listener
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // AGGRESSIVE cleanup on unmount
      forceStopAllTracks();
      stopStreamTracks(currentStreamRef);
      forceStopAllMediaTracks();

      // Also try direct approach
      if (currentStreamRef.current) {
        const tracks = currentStreamRef.current.getTracks();
        console.log(`Unmount cleanup: stopping ${tracks.length} media tracks`);
        tracks.forEach((track) => {
          console.log(
            "Unmount cleanup: stopping track:",
            track.kind,
            track.label,
            "enabled:",
            track.enabled,
            "readyState:",
            track.readyState
          );
          track.enabled = false;
          track.stop();
        });
      }

      // Cleanup WebRTC and screen share
      cleanup();
      cleanupScreenShare();

      // Disconnect the socket
      if (socketRef.current) {
        console.log("Unmount cleanup: disconnecting socket");
        socketRef.current.disconnect();
      }

      console.log("Unmount cleanup completed");
    };
  }, [
    roomId,
    username,
    password,
    navigate,
    initializeLocalStream,
    setupSocketListeners,
    cleanup,
    cleanupScreenShare,
    isAuthenticated,
    user?.id,
    localStreamRef,
    forceStopAllTracks,
  ]);

  // Stream click handlers
  const handleStreamClick = (streamType, socketId = null) => {
    if (focusedStream === (streamType === "local" ? "local" : socketId)) {
      // If clicking the same stream, return to normal layout
      setFocusedStream(null);
    } else {
      // Focus on the clicked stream
      setFocusedStream(streamType === "local" ? "local" : socketId);
    }
  };

  const leaveRoom = () => {
    console.log("Leaving room - starting AGGRESSIVE cleanup");

    // Debug current state before cleanup
    debugMediaTracks();

    // Method 1: Use the media controls force stop
    forceStopAllTracks();

    // Method 2: Use the utility function for stream reference
    stopStreamTracks(localStreamRef);

    // Method 3: Global aggressive cleanup
    forceStopAllMediaTracks();

    // Method 4: Direct approach as fallback
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log(`Direct stopping ${tracks.length} local media tracks`);
      tracks.forEach((track) => {
        console.log(
          "Direct stopping track:",
          track.kind,
          track.label,
          "enabled:",
          track.enabled,
          "readyState:",
          track.readyState
        );
        track.enabled = false;
        track.stop();
      });
    }

    // Cleanup WebRTC connections
    cleanup();

    // Cleanup screen share
    cleanupScreenShare();

    // Disconnect the socket
    if (socketRef.current) {
      console.log("Disconnecting socket");
      socketRef.current.disconnect();
    }

    // Debug state after cleanup
    console.log("=== STATE AFTER CLEANUP ===");
    debugMediaTracks();

    console.log("AGGRESSIVE cleanup completed, navigating to home");
    // Navigate back to home
    navigate("/");
  };

  // Dynamic Layout Calculation
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

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* Credential Prompt Modal */}
      {showCredentialPrompt && (
        <CredentialPrompt
          roomId={roomId}
          onClose={() => setShowCredentialPrompt(false)}
        />
      )}

      {/* Media Control Bar */}
      <MediaControls
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        isScreenSharing={isScreenSharing}
        isScreenShareSupported={isScreenShareSupported}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={toggleChat}
        onLeaveRoom={leaveRoom}
      />

      {/* Main grid for videos */}
      <VideoGrid
        remoteStreamsArray={remoteStreamsArray}
        localStreamRef={localStreamRef}
        localStreamReady={localStreamReady}
        username={username}
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        isScreenSharing={isScreenSharing}
        remoteScreenSharing={remoteScreenSharing}
        focusedStream={focusedStream}
        onStreamClick={handleStreamClick}
        gridClass={gridClass}
      />

      {/* Chat Component */}
      <Chat
        socketRef={socketRef}
        username={username}
        roomId={roomId}
        userId={user?.id || null}
      />

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
                }
              }}
              className="w-full h-full object-cover rounded-lg border-2 border-white shadow-lg"
              style={{ transform: "scaleX(-1)" }} // Mirror effect
            />
            {/* Local username overlay */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
              {username} (You)
            </div>
            {/* Screen sharing indicator for local user */}
            {isScreenSharing && (
              <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                {screenShareType || "Screen"}
              </div>
            )}
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
