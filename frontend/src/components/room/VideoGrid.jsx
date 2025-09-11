import { Monitor, Maximize2, Minimize2 } from "lucide-react";

/**
 * VideoGrid Component
 * Renders the video grid layout with local and remote streams
 */

const VideoGrid = ({
  remoteStreamsArray,
  localStreamRef,
  localStreamReady,
  username,
  isScreenSharing,
  remoteScreenSharing,
  focusedStream,
  fullscreenStream,
  onStreamClick,
  onFullscreenClick,
  gridClass,
}) => {
  // Handle fullscreen mode
  if (fullscreenStream) {
    const fullscreenStreamData =
      fullscreenStream === "local"
        ? { type: "local", username: username }
        : remoteStreamsArray.find((s) => s.socketId === fullscreenStream);

    return (
      <div className="relative w-full h-full bg-black">
        {fullscreenStream === "local" ? (
          // Local stream fullscreen
          <>
            <video
              key="local-video-fullscreen"
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (video && localStreamRef.current) {
                  video.srcObject = localStreamRef.current;
                }
              }}
              className={`w-full h-full ${
                isScreenSharing ? "object-contain" : "object-cover"
              }`}
              style={isScreenSharing ? {} : { transform: "scaleX(-1)" }}
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-lg font-medium">
              {username} (You) - FULLSCREEN
            </div>
            {/* Screen sharing indicator */}
            {isScreenSharing && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Screen Sharing
              </div>
            )}
          </>
        ) : (
          // Remote stream fullscreen
          <>
            <video
              autoPlay
              playsInline
              ref={(video) => {
                if (video && fullscreenStreamData?.stream) {
                  video.srcObject = fullscreenStreamData.stream;
                }
              }}
              className={`w-full h-full ${
                remoteScreenSharing[fullscreenStreamData?.username]?.isSharing
                  ? "object-contain"
                  : "object-cover"
              }`}
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-lg font-medium">
              {fullscreenStreamData?.username} - FULLSCREEN
            </div>
            {/* Screen sharing indicator */}
            {remoteScreenSharing[fullscreenStreamData?.username]?.isSharing && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Screen Sharing
              </div>
            )}
          </>
        )}
        {/* Exit fullscreen button */}
        <div
          className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-opacity-70 transition-all duration-200"
          onClick={() => onFullscreenClick(null)}
        >
          <Minimize2 className="w-4 h-4" />
        </div>
      </div>
    );
  }

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
              if (video && localStreamRef.current) {
                video.srcObject = localStreamRef.current;
              }
            }}
            className={`w-full h-full ${
              isScreenSharing ? "object-contain" : "object-cover"
            } rounded-lg border-2 border-white shadow-lg`}
            style={
              isScreenSharing ? {} : { transform: "scaleX(-1)" } // Mirror effect for camera
            }
            onLoadedMetadata={() => {}}
            onCanPlay={() => {}}
          />
          {/* Local username overlay for full screen */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-lg font-medium">
            {username} (You)
          </div>
          {/* Screen sharing indicator */}
          {isScreenSharing && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Screen Sharing
            </div>
          )}
          {/* Fullscreen button */}
          <div
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs sm:text-xs md:text-sm cursor-pointer hover:bg-opacity-70 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onFullscreenClick("local");
            }}
          >
            <Maximize2 className="w-3 h-3" />
          </div>
          {/* Click to focus indicator */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs sm:text-xs md:text-sm">
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
                        className={`w-full h-full ${
                          isScreenSharing ? "object-contain" : "object-cover"
                        } rounded-lg border-2 border-white shadow-lg`}
                        style={
                          isScreenSharing ? {} : { transform: "scaleX(-1)" }
                        }
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
                        className={`w-full h-full ${
                          remoteScreenSharing[focusedStreamData?.username]
                            ?.isSharing
                            ? "object-contain"
                            : "object-cover"
                        }`}
                      />
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-lg font-medium">
                        {focusedStreamData?.username} - FOCUSED
                      </div>
                      {/* Screen sharing indicator for focused remote stream */}
                      {remoteScreenSharing[focusedStreamData?.username]
                        ?.isSharing && (
                        <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Screen Sharing
                        </div>
                      )}
                    </>
                  )}
                  {/* Fullscreen button */}
                  <div
                    className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs sm:text-xs md:text-sm cursor-pointer hover:bg-opacity-70 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFullscreenClick(
                        focusedStream === "local" ? "local" : focusedStream
                      );
                    }}
                  >
                    <Maximize2 className="w-3 h-3" />
                  </div>
                  {/* Click to unfocus indicator */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs sm:text-xs md:text-sm">
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
                          className={`w-full h-full ${
                            type === "local"
                              ? isScreenSharing
                                ? "object-contain"
                                : "object-cover"
                              : remoteScreenSharing[remoteUsername]?.isSharing
                              ? "object-contain"
                              : "object-cover"
                          } rounded-lg`}
                          style={
                            type === "local" && !isScreenSharing
                              ? { transform: "scaleX(-1)" }
                              : {}
                          }
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
                          {remoteUsername} {type === "local" ? "(You)" : ""}
                        </div>
                        {/* Screen sharing indicator */}
                        {(type === "local" && isScreenSharing) ||
                        (type !== "local" &&
                          remoteScreenSharing[remoteUsername]?.isSharing) ? (
                          <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            Screen
                          </div>
                        ) : null}
                        {/* Fullscreen button */}
                        <div
                          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-1 py-1 rounded text-xs cursor-pointer hover:bg-opacity-70 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFullscreenClick(
                              type === "local" ? "local" : "remote",
                              socketId
                            );
                          }}
                        >
                          <Maximize2 className="w-3 h-3" />
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
                  onClick={() => onStreamClick("remote", socketId)}
                >
                  <video
                    autoPlay
                    playsInline
                    ref={(video) => {
                      if (video && stream) {
                        video.srcObject = stream;
                      }
                    }}
                    className={`w-full h-full ${
                      remoteScreenSharing[remoteUsername]?.isSharing
                        ? "object-contain"
                        : "object-cover"
                    } rounded-lg`}
                    onLoadedMetadata={() => {}}
                    onCanPlay={() => {}}
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
                      Screen
                    </div>
                  )}
                  {/* Fullscreen button */}
                  <div
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-1 py-1 rounded text-xs cursor-pointer hover:bg-opacity-70 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFullscreenClick("remote", socketId);
                    }}
                  >
                    <Maximize2 className="w-3 h-3" />
                  </div>
                  {/* Click to focus indicator */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-1 py-1 rounded text-xs sm:text-xs md:text-sm">
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
