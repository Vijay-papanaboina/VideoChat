import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Monitor } from "lucide-react";

// Import custom hooks
import { useWebRTC } from "../hooks/useWebRTC";
import { useScreenShare } from "../hooks/useScreenShare";
import { useAuthState } from "../stores/authStore";
import { useChatActions, useChatStore } from "../stores/chatStore";

// Import components
import MediaControlsWrapper from "../components/room/MediaControlsWrapper";
import VideoGrid from "../components/room/VideoGrid";
import CredentialPrompt from "../components/room/CredentialPrompt";
import ChatSidebar from "../components/chat/ChatSidebar";
import MuteIndicators from "../components/room/MuteIndicators";
import { MuteStateProvider } from "../components/room/MuteStateProvider";

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
  // Hook 1: useParams - get roomId from URL
  const { roomId } = useParams();

  // Hook 2: useLocation - get location object for navigation state
  const location = useLocation();

  // Hook 3: useNavigate - navigation function
  const navigate = useNavigate();

  // Hook 4: useAuthState - get user authentication state
  const { user, isAuthenticated } = useAuthState();

  // Hook 5: useRef - socket reference
  const socketRef = useRef(null);

  // Hook 6: useState - credential prompt visibility
  const [showCredentialPrompt, setShowCredentialPrompt] = useState(false);

  // Hook 7: useState - focused stream state
  const [focusedStream, setFocusedStream] = useState(null);

  // Get user details from navigation state
  const username = location.state?.username;
  const password = location.state?.password;

  // Hook 8: useWebRTC - WebRTC functionality (contains multiple internal hooks)
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

  // Hook 9: useCallback - force stop all media tracks function
  const forceStopAllTracks = useCallback(() => {
    console.log("Force stopping all media tracks from RoomPage");
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log(`Force stopping ${tracks.length} tracks from RoomPage`);

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

      console.log("All tracks force stopped from RoomPage");
    }
  }, [localStreamRef]);

  // Hook 10: useChatActions - chat action functions
  const { toggleChat } = useChatActions();

  // Hook 11: useChatStore - chat state (only isChatOpen)
  const isChatOpen = useChatStore((state) => state.isChatOpen);

  // Hook 12: useScreenShare - screen sharing functionality (contains multiple internal hooks)
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
    localStreamRef
  );

  // Hook 13: useEffect - check credentials and show prompt
  useEffect(() => {
    if (!username || !password) {
      setShowCredentialPrompt(true);
    }
  }, [username, password]);

  // Hook 14: useEffect - main room setup effect
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

  // Hook 15: useCallback - stream click handlers (memoized to prevent re-renders)
  const handleStreamClick = useCallback(
    (streamType, socketId = null) => {
      if (focusedStream === (streamType === "local" ? "local" : socketId)) {
        // If clicking the same stream, return to normal layout
        setFocusedStream(null);
      } else {
        // Focus on the clicked stream
        setFocusedStream(streamType === "local" ? "local" : socketId);
      }
    },
    [focusedStream]
  );

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

  const userCount = remoteStreamsArray.length + (localStreamReady ? 1 : 0);

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

  // Hook 16: useMemo - VideoGrid (memoized to prevent re-renders on chat state changes)
  const memoizedVideoGrid = useMemo(
    () => (
      <VideoGrid
        remoteStreamsArray={remoteStreamsArray}
        localStreamRef={localStreamRef}
        localStreamReady={localStreamReady}
        username={username}
        isScreenSharing={isScreenSharing}
        remoteScreenSharing={remoteScreenSharing}
        focusedStream={focusedStream}
        onStreamClick={handleStreamClick}
        gridClass={gridClass}
      />
    ),
    [
      remoteStreamsArray,
      localStreamRef,
      localStreamReady,
      username,
      isScreenSharing,
      remoteScreenSharing,
      focusedStream,
      handleStreamClick,
      gridClass,
    ]
  );

  // Hook 17: useMemo - local video corner (memoized to prevent re-renders)
  const memoizedLocalVideoCorner = useMemo(() => {
    if (remoteStreamsArray.length === 0 || isFocused) return null;

    return (
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
    );
  }, [
    remoteStreamsArray.length,
    isFocused,
    localStreamReady,
    localStreamRef,
    username,
    isScreenSharing,
    screenShareType,
    handleStreamClick,
  ]);

  // Chat sidebar - now isolated from video re-renders
  const chatSidebar = (
    <ChatSidebar
      socketRef={socketRef}
      username={username}
      roomId={roomId}
      userId={user?.id || null}
      isOpen={isChatOpen}
      userCount={userCount}
    />
  );

  return (
    <MuteStateProvider localStreamRef={localStreamRef}>
      <div className="relative w-screen h-screen bg-black flex gap-1">
        {/* Main video area */}
        <div
          className={`relative h-full transition-all duration-300 ease-in-out ${
            isChatOpen ? "flex-1" : "w-full"
          }`}
        >
          {/* Credential Prompt Modal */}
          {showCredentialPrompt && (
            <CredentialPrompt
              roomId={roomId}
              onClose={() => setShowCredentialPrompt(false)}
            />
          )}

          {/* Media Control Bar */}
          <MediaControlsWrapper
            isScreenSharing={isScreenSharing}
            isScreenShareSupported={isScreenShareSupported}
            isChatOpen={isChatOpen}
            onToggleScreenShare={toggleScreenShare}
            onToggleChat={toggleChat}
            onLeaveRoom={leaveRoom}
          />

          {/* Main grid for videos */}
          {memoizedVideoGrid}

          {/* Mute indicators for full screen local video */}
          {remoteStreamsArray.length === 0 && (
            <MuteIndicators
              isScreenSharing={isScreenSharing}
              showForFullScreen={true}
            />
          )}

          {/* Local video in the corner (only show when there are remote streams and not focused) */}
          {memoizedLocalVideoCorner}

          {/* Mute indicators for local video corner */}
          {remoteStreamsArray.length > 0 && !isFocused && (
            <MuteIndicators
              isScreenSharing={isScreenSharing}
              showForCorner={true}
            />
          )}
        </div>

        {/* Chat Component - Sidebar */}
        {chatSidebar}
      </div>
    </MuteStateProvider>
  );
};

export default RoomPage;
