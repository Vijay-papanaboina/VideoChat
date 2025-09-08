import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  X,
  Square,
  RectangleHorizontal,
  Layout,
  PhoneOff,
} from "lucide-react";

/**
 * MediaControls Component
 * Renders the control bar with audio, video, screen share, and leave room buttons
 */
const MediaControls = ({
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  isScreenShareSupported,
  onToggleAudio,
  onToggleVideo,
  onStartScreenShareWithType,
  onStopScreenShare,
  onLeaveRoom,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-black bg-opacity-80 backdrop-blur-sm rounded-full px-6 py-4 shadow-2xl border border-gray-600">
        {/* Audio Toggle Button */}
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full transition-all duration-200 ${
            isAudioMuted
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-600 hover:bg-gray-700 text-white"
          }`}
          aria-label={isAudioMuted ? "Unmute audio" : "Mute audio"}
        >
          {isAudioMuted ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Video Toggle Button */}
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-all duration-200 ${
            isVideoMuted
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-600 hover:bg-gray-700 text-white"
          }`}
          aria-label={isVideoMuted ? "Turn on video" : "Turn off video"}
        >
          {isVideoMuted ? (
            <VideoOff className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </button>

        {/* Screen Share Button */}
        {isScreenShareSupported && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`p-3 rounded-full transition-all duration-200 ${
                  isScreenSharing
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-600 hover:bg-gray-700 text-white"
                }`}
                aria-label={
                  isScreenSharing
                    ? "Stop screen sharing"
                    : "Start screen sharing"
                }
              >
                {isScreenSharing ? (
                  <MonitorOff className="w-5 h-5" />
                ) : (
                  <Monitor className="w-5 h-5" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {isScreenSharing ? (
                <DropdownMenuItem
                  onClick={onStopScreenShare}
                  className="cursor-pointer"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop Screen Sharing
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => onStartScreenShareWithType("screen")}
                    className="cursor-pointer"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Share Entire Screen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStartScreenShareWithType("window")}
                    className="cursor-pointer"
                  >
                    <RectangleHorizontal className="w-4 h-4 mr-2" />
                    Share Application Window
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStartScreenShareWithType("tab")}
                    className="cursor-pointer"
                  >
                    <Layout className="w-4 h-4 mr-2" />
                    Share Browser Tab
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
          aria-label="Leave room"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MediaControls;
