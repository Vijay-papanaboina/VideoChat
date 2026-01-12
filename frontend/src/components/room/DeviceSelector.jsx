import { useState, useEffect, useCallback } from "react";
import { Settings, Mic, Video, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";

/**
 * DeviceSelector Component
 * Allows users to select audio/video devices
 */
const DeviceSelector = ({ localStreamRef, onDeviceChange }) => {
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState("");
  const [selectedVideo, setSelectedVideo] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Enumerate available devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioInputs = devices.filter((d) => d.kind === "audioinput");
      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);

      // Set current device from active stream
      if (localStreamRef?.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const videoTrack = localStreamRef.current.getVideoTracks()[0];

        if (audioTrack) {
          const settings = audioTrack.getSettings();
          setSelectedAudio(settings.deviceId || "");
        }
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          setSelectedVideo(settings.deviceId || "");
        }
      }
    } catch (error) {
      console.error("Failed to enumerate devices:", error);
    }
  }, [localStreamRef]);

  useEffect(() => {
    enumerateDevices();

    // Re-enumerate when devices change
    navigator.mediaDevices.addEventListener("devicechange", enumerateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        enumerateDevices
      );
    };
  }, [enumerateDevices]);

  // Switch audio device
  const switchAudioDevice = async (deviceId) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });

      const newAudioTrack = newStream.getAudioTracks()[0];

      // Replace track in local stream
      if (localStreamRef?.current) {
        const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
        if (oldAudioTrack) {
          localStreamRef.current.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
        }
        localStreamRef.current.addTrack(newAudioTrack);
      }

      setSelectedAudio(deviceId);
      onDeviceChange?.("audio", newAudioTrack);
      console.log("🎤 Switched to audio device:", deviceId);
    } catch (error) {
      console.error("Failed to switch audio device:", error);
    }
  };

  // Switch video device
  const switchVideoDevice = async (deviceId) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace track in local stream
      if (localStreamRef?.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStreamRef.current.addTrack(newVideoTrack);
      }

      setSelectedVideo(deviceId);
      onDeviceChange?.("video", newVideoTrack);
      console.log("📹 Switched to video device:", deviceId);
    } catch (error) {
      console.error("Failed to switch video device:", error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="p-3 rounded-full bg-muted hover:bg-muted/80"
          aria-label="Device settings"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        {/* Audio Devices */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Microphone
        </DropdownMenuLabel>
        {audioDevices.length === 0 ? (
          <DropdownMenuItem disabled>No microphones found</DropdownMenuItem>
        ) : (
          audioDevices.map((device) => (
            <DropdownMenuItem
              key={device.deviceId}
              onClick={() => switchAudioDevice(device.deviceId)}
              className={selectedAudio === device.deviceId ? "bg-accent" : ""}
            >
              {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              {selectedAudio === device.deviceId && (
                <span className="ml-auto text-xs text-green-500">✓</span>
              )}
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />

        {/* Video Devices */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          Camera
        </DropdownMenuLabel>
        {videoDevices.length === 0 ? (
          <DropdownMenuItem disabled>No cameras found</DropdownMenuItem>
        ) : (
          videoDevices.map((device) => (
            <DropdownMenuItem
              key={device.deviceId}
              onClick={() => switchVideoDevice(device.deviceId)}
              className={selectedVideo === device.deviceId ? "bg-accent" : ""}
            >
              {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              {selectedVideo === device.deviceId && (
                <span className="ml-auto text-xs text-green-500">✓</span>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DeviceSelector;
