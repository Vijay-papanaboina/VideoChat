import { useState, useRef, useCallback } from "react";

/**
 * Custom hook for video recording functionality
 * Supports recording individual streams or combined streams
 */
export const useVideoRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState([]);
  const [recordingType, setRecordingType] = useState("local"); // "local", "grid", "screen"
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Start recording individual stream (your own video/audio)
  const startRecording = useCallback(
    async (stream, type = "local") => {
      try {
        if (!stream) {
          throw new Error("No stream provided for recording");
        }

        // Check if MediaRecorder is supported
        if (!window.MediaRecorder) {
          throw new Error("MediaRecorder not supported in this browser");
        }

        // Stop any existing recording
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }

        recordedChunksRef.current = [];
        setRecordingType(type);

        // Create MediaRecorder with optimal settings
        const options = {
          mimeType: getSupportedMimeType(),
          videoBitsPerSecond: 2500000, // 2.5 Mbps
          audioBitsPerSecond: 128000, // 128 kbps
        };

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        // Handle data available event
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        // Handle recording stop
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, {
            type: getSupportedMimeType(),
          });

          setRecordedBlobs((prev) => [
            ...prev,
            {
              blob,
              type: recordingType,
              timestamp: new Date(),
              size: blob.size,
              duration: getRecordingDuration(),
            },
          ]);

          recordedChunksRef.current = [];
          setIsRecording(false);
        };

        // Start recording
        mediaRecorder.start(1000); // Collect data every second
        setIsRecording(true);

        console.log(`🎥 Started ${type} recording`);
      } catch (error) {
        console.error("Error starting recording:", error);
        alert(`Failed to start recording: ${error.message}`);
      }
    },
    [recordingType]
  );

  // Stop recording
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      console.log("🛑 Stopped recording");
    }
  }, []);

  // Create combined stream for grid recording
  const createGridStream = useCallback(
    async (videoElements, audioStream) => {
      try {
        // Create canvas to combine video streams
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size (adjust based on your grid layout)
        canvas.width = 1920;
        canvas.height = 1080;

        // Create canvas stream
        const canvasStream = canvas.captureStream(30); // 30 FPS

        // Add audio if available
        if (audioStream) {
          const audioTracks = audioStream.getAudioTracks();
          audioTracks.forEach((track) => canvasStream.addTrack(track));
        }

        // Function to draw video frames to canvas
        const drawVideoFrames = () => {
          if (!isRecording) return;

          // Clear canvas
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw each video element
          videoElements.forEach((videoElement, index) => {
            if (videoElement && videoElement.videoWidth > 0) {
              const cols = Math.ceil(Math.sqrt(videoElements.length));
              const rows = Math.ceil(videoElements.length / cols);
              const cellWidth = canvas.width / cols;
              const cellHeight = canvas.height / rows;

              const x = (index % cols) * cellWidth;
              const y = Math.floor(index / cols) * cellHeight;

              ctx.drawImage(videoElement, x, y, cellWidth, cellHeight);
            }
          });

          requestAnimationFrame(drawVideoFrames);
        };

        // Start drawing
        drawVideoFrames();

        return canvasStream;
      } catch (error) {
        console.error("Error creating grid stream:", error);
        throw error;
      }
    },
    [isRecording]
  );

  // Download recorded video
  const downloadRecording = useCallback(
    (recordingIndex = -1) => {
      const recordings = recordedBlobs;
      const recording =
        recordingIndex === -1
          ? recordings[recordings.length - 1]
          : recordings[recordingIndex];

      if (!recording) {
        alert("No recording available to download");
        return;
      }

      const url = URL.createObjectURL(recording.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${recording.type}-${recording.timestamp
        .toISOString()
        .slice(0, 19)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [recordedBlobs]
  );

  // Clear all recordings
  const clearRecordings = useCallback(() => {
    setRecordedBlobs([]);
    recordedChunksRef.current = [];
  }, []);

  return {
    isRecording,
    recordedBlobs,
    recordingType,
    startRecording,
    stopRecording,
    createGridStream,
    downloadRecording,
    clearRecordings,
  };
};

// Helper function to get supported MIME type
const getSupportedMimeType = () => {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "video/webm"; // fallback
};

// Helper function to get recording duration
const getRecordingDuration = () => {
  // This would need to be implemented based on your timing needs
  return Date.now(); // placeholder
};
