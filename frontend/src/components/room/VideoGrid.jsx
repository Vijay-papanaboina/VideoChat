import { memo } from "react";
import { Monitor, Maximize2, Minimize2 } from "lucide-react";

/**
 * VideoGrid Component
 * Renders the video grid layout with local and remote streams
 * Wrapped with memo to prevent re-renders from chat state updates
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
  isChatOpen,
}) => {
  // Handle fullscreen mode
  if (fullscreenStream) {
    const fullscreenStreamData =
      fullscreenStream === "local"
        ? { type: "local", username: username }
        : remoteStreamsArray.find((s) => s.socketId === fullscreenStream);

    return (
      <div className="relative w-full h-full bg-background">
        {fullscreenStream === "local" ? (
          // Local stream fullscreen
          <>
            <video
              key="local-video-fullscreen"
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (
                  video &&
                  localStreamRef.current &&
                  video.srcObject !== localStreamRef.current
                ) {
                  video.srcObject = localStreamRef.current;
                }
              }}
              className={`w-full h-full ${
                isScreenSharing ? "object-contain" : "object-cover"
              }`}
              style={isScreenSharing ? {} : { transform: "scaleX(-1)" }}
            />
            <div className="absolute bottom-4 left-4 bg-background bg-opacity-70 text-foreground px-3 py-2 rounded text-lg font-medium">
              {username} (You) - FULLSCREEN
            </div>
            {/* Screen sharing indicator */}
            {isScreenSharing && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
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
                if (
                  video &&
                  fullscreenStreamData?.stream &&
                  video.srcObject !== fullscreenStreamData.stream
                ) {
                  video.srcObject = fullscreenStreamData.stream;
                }
              }}
              className={`w-full h-full ${
                remoteScreenSharing[fullscreenStreamData?.username]?.isSharing
                  ? "object-contain"
                  : "object-cover"
              }`}
            />
            <div className="absolute bottom-4 left-4 bg-background bg-opacity-70 text-foreground px-3 py-2 rounded text-lg font-medium">
              {fullscreenStreamData?.username} - FULLSCREEN
            </div>
            {/* Screen sharing indicator */}
            {remoteScreenSharing[fullscreenStreamData?.username]?.isSharing && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Screen Sharing
              </div>
            )}
          </>
        )}
        {/* Exit fullscreen button */}
        <div
          className="absolute top-4 right-4 bg-background bg-opacity-50 text-foreground px-2 py-1 rounded text-xs cursor-pointer hover:bg-opacity-70 transition-all duration-200"
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
              if (
                video &&
                localStreamRef.current &&
                video.srcObject !== localStreamRef.current
              ) {
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
          <div className="absolute bottom-4 left-4 bg-background bg-opacity-70 text-foreground px-3 py-2 rounded text-lg font-medium">
            {username} (You)
          </div>
          {/* Screen sharing indicator */}
          {isScreenSharing && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Screen Sharing
            </div>
          )}
          {/* Fullscreen button */}
          <div
            className="absolute top-4 right-4 bg-background bg-opacity-50 text-foreground px-2 py-1 rounded text-xs sm:text-xs md:text-sm cursor-pointer hover:bg-opacity-70 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onFullscreenClick("local");
            }}
          >
            <Maximize2 className="w-3 h-3" />
          </div>
          {/* Click to focus indicator */}
          <div className="absolute top-4 left-4 bg-background bg-opacity-50 text-foreground px-2 py-1 rounded text-xs sm:text-xs md:text-sm">
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
                          if (
                            video &&
                            localStreamRef.current &&
                            video.srcObject !== localStreamRef.current
                          ) {
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
                      <div className="absolute bottom-4 left-4 bg-background bg-opacity-70 text-foreground px-3 py-2 rounded text-lg font-medium">
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
                          if (
                            video &&
                            focusedStreamData?.stream &&
                            video.srcObject !== focusedStreamData.stream
                          ) {
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
                      <div className="absolute bottom-4 left-4 bg-background bg-opacity-70 text-foreground px-3 py-2 rounded text-lg font-medium">
                        {focusedStreamData?.username} - FOCUSED
                      </div>
                      {/* Screen sharing indicator for focused remote stream */}
                      {remoteScreenSharing[focusedStreamData?.username]
                        ?.isSharing && (
                        <div className="absolute top-4 left-4 bg-green-600 text-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Screen Sharing
                        </div>
                      )}
                    </>
                  )}
                  {/* Fullscreen button */}
                  <div
                    className="absolute top-4 right-4 bg-background bg-opacity-50 text-foreground px-2 py-1 rounded text-xs sm:text-xs md:text-sm cursor-pointer hover:bg-opacity-70 transition-all duration-200"
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
                  <div className="absolute top-4 left-4 bg-background bg-opacity-50 text-foreground px-2 py-1 rounded text-xs sm:text-xs md:text-sm">
                    <span className="hidden sm:inline">Click to unfocus</span>
                    <span className="sm:hidden">Tap to unfocus</span>
                  </div>
                </div>

                {/* Other streams - layout depends on chat state */}
                <div className="relative h-full overflow-hidden">
                  {isChatOpen ? (
                    // Chat open: horizontal scrollable layout
                    <div
                      className="flex flex-row gap-1 h-full overflow-x-auto overflow-y-hidden px-2 py-1"
                      style={{ width: "100%" }}
                    >
                      {otherStreams.map(
                        ({
                          socketId,
                          stream,
                          username: remoteUsername,
                          type,
                        }) => (
                          <div
                            key={socketId}
                            className="relative flex-shrink-0 cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-blue-300 touch-manipulation active:ring-2 active:ring-blue-400"
                            style={{
                              width: isChatOpen ? "calc(25% - 2px)" : "100%",
                              height: isChatOpen ? "100%" : "calc(25% - 2px)",
                            }}
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
                                  const targetStream =
                                    type === "local"
                                      ? localStreamRef.current
                                      : stream;
                                  if (
                                    targetStream &&
                                    video.srcObject !== targetStream
                                  ) {
                                    video.srcObject = targetStream;
                                  }
                                }
                              }}
                              className={`w-full h-full ${
                                type === "local"
                                  ? isScreenSharing
                                    ? "object-contain"
                                    : "object-cover"
                                  : remoteScreenSharing[remoteUsername]
                                      ?.isSharing
                                  ? "object-contain"
                                  : "object-cover"
                              } rounded-lg`}
                              style={
                                type === "local" && !isScreenSharing
                                  ? { transform: "scaleX(-1)" }
                                  : {}
                              }
                            />
                            <div className="absolute bottom-2 left-2 bg-background bg-opacity-70 text-foreground px-2 py-1 rounded text-sm font-medium">
                              {remoteUsername} {type === "local" ? "(You)" : ""}
                            </div>
                            {/* Screen sharing indicator */}
                            {(type === "local" && isScreenSharing) ||
                            (type !== "local" &&
                              remoteScreenSharing[remoteUsername]
                                ?.isSharing) ? (
                              <div className="absolute top-2 left-2 bg-green-600 text-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                Screen
                              </div>
                            ) : null}
                            {/* Fullscreen button */}
                            <div
                              className="absolute top-2 right-2 bg-background bg-opacity-50 text-foreground px-1 py-1 rounded text-xs cursor-pointer hover:bg-opacity-70 transition-all duration-200"
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
                  ) : (
                    // Chat closed: vertical stacked layout
                    <div className="flex flex-col gap-1 h-full overflow-y-auto overflow-x-hidden px-1 py-1">
                      {otherStreams.map(
                        ({
                          socketId,
                          stream,
                          username: remoteUsername,
                          type,
                        }) => (
                          <div
                            key={socketId}
                            className="relative flex-shrink-0 cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-blue-300 touch-manipulation active:ring-2 active:ring-blue-400"
                            style={{
                              width: "100%",
                              height: "calc(25% - 2px)",
                            }}
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
                                  const targetStream =
                                    type === "local"
                                      ? localStreamRef.current
                                      : stream;
                                  if (
                                    targetStream &&
                                    video.srcObject !== targetStream
                                  ) {
                                    video.srcObject = targetStream;
                                  }
                                }
                              }}
                              className={`w-full h-full ${
                                type === "local"
                                  ? isScreenSharing
                                    ? "object-contain"
                                    : "object-cover"
                                  : remoteScreenSharing[remoteUsername]
                                      ?.isSharing
                                  ? "object-contain"
                                  : "object-cover"
                              } rounded-lg`}
                              style={
                                type === "local" && !isScreenSharing
                                  ? { transform: "scaleX(-1)" }
                                  : {}
                              }
                            />
                            <div className="absolute bottom-2 left-2 bg-background bg-opacity-70 text-foreground px-2 py-1 rounded text-sm font-medium">
                              {remoteUsername} {type === "local" ? "(You)" : ""}
                            </div>
                            {/* Screen sharing indicator */}
                            {(type === "local" && isScreenSharing) ||
                            (type !== "local" &&
                              remoteScreenSharing[remoteUsername]
                                ?.isSharing) ? (
                              <div className="absolute top-2 left-2 bg-green-600 text-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                Screen
                              </div>
                            ) : null}
                            {/* Fullscreen button */}
                            <div
                              className="absolute top-2 right-2 bg-background bg-opacity-50 text-foreground px-1 py-1 rounded text-xs cursor-pointer hover:bg-opacity-70 transition-all duration-200"
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
                  )}
                </div>

                {/* Scroll indicator when there are more than 4 users */}
                {otherStreams.length > 4 && (
                  <div
                    className={`absolute ${
                      isChatOpen
                        ? "right-2 top-1/2 transform -translate-y-1/2"
                        : "bottom-2 right-1/2 transform translate-x-1/2"
                    } bg-background bg-opacity-70 text-foreground px-2 py-1 rounded text-xs pointer-events-none z-10`}
                  >
                    {isChatOpen ? "← Scroll →" : "↑ Scroll ↑"}
                  </div>
                )}
              </>
            );
          } else {
            // Normal layout - show all remote streams
            const shouldScroll = remoteStreamsArray.length > 12;
            return (
              <div
                className={`w-full h-full ${
                  shouldScroll ? "overflow-auto" : ""
                }`}
              >
                {remoteStreamsArray.map(
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
                      <div className="absolute bottom-2 left-2 bg-background bg-opacity-70 text-foreground px-2 py-1 rounded text-sm font-medium">
                        {remoteUsername}
                      </div>
                      {/* Screen sharing indicator for remote users */}
                      {remoteScreenSharing[remoteUsername]?.isSharing && (
                        <div className="absolute top-2 left-2 bg-green-600 text-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          Screen
                        </div>
                      )}
                      {/* Fullscreen button */}
                      <div
                        className="absolute top-2 right-2 bg-background bg-opacity-50 text-foreground px-1 py-1 rounded text-xs cursor-pointer hover:bg-opacity-70 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFullscreenClick("remote", socketId);
                        }}
                      >
                        <Maximize2 className="w-3 h-3" />
                      </div>
                      {/* Click to focus indicator */}
                      <div className="absolute bottom-2 right-2 bg-background bg-opacity-50 text-foreground px-1 py-1 rounded text-xs sm:text-xs md:text-sm">
                        <span className="hidden sm:inline">Click to focus</span>
                        <span className="sm:hidden">Tap to focus</span>
                      </div>
                    </div>
                  )
                )}
                {/* Scroll indicator for normal layout when there are more than 12 users */}
                {shouldScroll && (
                  <div className="absolute bottom-2 right-2 bg-background bg-opacity-70 text-foreground px-2 py-1 rounded text-xs pointer-events-none z-10">
                    Scroll to see more
                  </div>
                )}
              </div>
            );
          }
        })()
      )}
    </div>
  );
};

VideoGrid.displayName = "VideoGrid";

export default memo(VideoGrid);
