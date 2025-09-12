import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  MessageCircle,
  Settings,
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
  isChatOpen,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onLeaveRoom,
  isAdmin,
  onOpenRoomManagement,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-full px-6 py-4 shadow-2xl border border-border">
        {/* Audio Toggle Button */}
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full transition-all duration-200 ${
            isAudioMuted
              ? "bg-red-600 hover:bg-red-700 text-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
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
              ? "bg-red-600 hover:bg-red-700 text-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
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
          <button
            onClick={onToggleScreenShare}
            className={`p-3 rounded-full transition-all duration-200 ${
              isScreenSharing
                ? "bg-green-600 hover:bg-green-700 text-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
            aria-label={
              isScreenSharing ? "Stop screen sharing" : "Start screen sharing"
            }
          >
            {isScreenSharing ? (
              <MonitorOff className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Chat Toggle Button */}
        <button
          onClick={onToggleChat}
          className={`p-3 rounded-full transition-all duration-200 ${
            isChatOpen
              ? "bg-blue-600 hover:bg-blue-700 text-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
          aria-label="Toggle chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        {/* Room Management Button (Admin Only) */}
        {isAdmin && (
          <button
            onClick={onOpenRoomManagement}
            className="p-3 rounded-full bg-yellow-600 hover:bg-yellow-700 text-foreground transition-all duration-200"
            aria-label="Room management"
            title="Room Management"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-foreground transition-all duration-200"
          aria-label="Leave room"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MediaControls;
