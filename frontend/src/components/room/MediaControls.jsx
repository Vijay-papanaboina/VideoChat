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
  Circle,
  Square,
  Camera,
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
  // Recording props
  isRecording,
  onToggleRecording,
  // Screenshot props
  onTakeScreenshot,
  // Unread messages
  unreadCount = 0,
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
          title={`${isAudioMuted ? "Unmute" : "Mute"} (M)`}
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
          title={`${isVideoMuted ? "Turn on" : "Turn off"} video (V)`}
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
            title={`${isScreenSharing ? "Stop" : "Start"} screen share (S)`}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Chat Toggle Button with Unread Badge */}
        <button
          onClick={onToggleChat}
          className={`relative p-3 rounded-full transition-all duration-200 ${
            isChatOpen
              ? "bg-blue-600 hover:bg-blue-700 text-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
          aria-label="Toggle chat"
          title={`Toggle chat (C)`}
        >
          <MessageCircle className="w-5 h-5" />
          {/* Unread Badge */}
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Recording Button */}
        <button
          onClick={onToggleRecording}
          className={`p-3 rounded-full transition-all duration-200 ${
            isRecording
              ? "bg-red-600 hover:bg-red-700 text-foreground animate-pulse"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <Square className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Screenshot Button */}
        <button
          onClick={onTakeScreenshot}
          className="p-3 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-all duration-200"
          aria-label="Take screenshot"
          title="Take screenshot"
        >
          <Camera className="w-5 h-5" />
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
