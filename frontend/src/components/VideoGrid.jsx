import { Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react";

/**
 * VideoGrid Component
 * Renders the video grid layout with local and remote streams
 */

const VideoGrid = ({
  remoteStreamsArray,
  localStreamRef,
  localStreamReady,
  username,
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  remoteScreenSharing,
  focusedStream,
  onStreamClick,
  gridClass,
}) => {
  return (
    <div className={`grid w-full h-full gap-2 p-2 ${gridClass}`}>
      {remoteStreamsArray.length === 0 ? (
        // Show local video full screen when no remote streams
        <div
          className={`relative w-full h-full cursor-pointer transition-all duration-300 ${
            focusedStream === "local"
              ? "ring-4 ring-blue-500 ring-opacity-75"
              : ""
          }`}
          onClick={() => onStreamClick("local")}
        >
          <video
            key={localStreamReady ? "local-video-ready" : "local-video-waiting"}
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
            onLoadedMetadata={() => console.log("Local video metadata loaded")}
            onCanPlay={() => console.log("Local video can play")}
          />
          {/* Local username overlay for full screen */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-lg font-medium">
            {username} (You)
          </div>
          {/* Mute indicators */}
          {isAudioMuted && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <MicOff className="w-4 h-4" />
              Muted
            </div>
          )}
          {isVideoMuted && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <VideoOff className="w-4 h-4" />
              {isScreenSharing ? "Screen Off" : "Camera Off"}
            </div>
          )}
          {/* Screen sharing indicator */}
          {isScreenSharing && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Screen Sharing
            </div>
          )}
          {/* Click to focus indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs sm:text-xs md:text-sm">
            <span className="hidden sm:inline">Click to focus</span>
            <span className="sm:hidden">Tap to focus</span>
          </div>
        </div>
      ) : (
        // Show streams based on focus state
        (() => {
          const isFocused = focusedStream !== null;

          if (isFocused) {
            // When focused, show focused stream on left, others stacked vertically on right
            const focusedStreamData =
              focusedStream === "local"
                ? { type: "local", username: username }
                : remoteStreamsArray.find((s) => s.socketId === focusedStream);

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
                    onStreamClick(
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
                    ({ socketId, stream, username: remoteUsername, type }) => (
                      <div
                        key={socketId}
                        className="relative flex-1 min-h-0 cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-blue-300 touch-manipulation active:ring-2 active:ring-blue-400"
                        onClick={() =>
                          onStreamClick(
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
                              if (type === "local" && localStreamRef.current) {
                                video.srcObject = localStreamRef.current;
                              } else if (type !== "local" && stream) {
                                video.srcObject = stream;
                              }
                            }
                          }}
                          className="w-full h-full object-cover rounded-lg"
                          style={
                            type === "local" ? { transform: "scaleX(-1)" } : {}
                          }
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
                          {remoteUsername} {type === "local" ? "(You)" : ""}
                        </div>
                        {/* Screen sharing indicator for remote users */}
                        {type !== "local" &&
                          remoteScreenSharing[remoteUsername]?.isSharing && (
                            <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {remoteScreenSharing[remoteUsername].shareType ||
                                "Screen"}
                            </div>
                          )}
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
                  onClick={() => onStreamClick("remote", socketId)}
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
                  {/* Screen sharing indicator for remote users */}
                  {remoteScreenSharing[remoteUsername]?.isSharing && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      {remoteScreenSharing[remoteUsername].shareType ||
                        "Screen"}
                    </div>
                  )}
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
  );
};

export default VideoGrid;
