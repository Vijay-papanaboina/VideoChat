import { useState, useEffect } from "react";
import { Circle, Square, Download, Trash2, Clock } from "lucide-react";

/**
 * RecordingStatus Component
 * Shows recording status and provides controls for recorded content
 */
const RecordingStatus = ({
  isRecording,
  recordedBlobs,
  recordingType,
  onDownloadRecording,
  onClearRecordings,
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [showRecordings, setShowRecordings] = useState(false);

  // Update recording time when recording is active
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isRecording && recordedBlobs.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-background/90 backdrop-blur-sm rounded-lg shadow-lg border border-border p-4">
        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-red-500 animate-pulse fill-red-500" />
              <span className="text-sm font-medium text-foreground">
                Recording {recordingType}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatTime(recordingTime)}</span>
            </div>
          </div>
        )}

        {/* Recordings List */}
        {recordedBlobs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Recordings ({recordedBlobs.length})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRecordings(!showRecordings)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showRecordings ? "Hide" : "Show"}
                </button>
                <button
                  onClick={onClearRecordings}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  title="Clear all recordings"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>

            {showRecordings && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recordedBlobs.map((recording, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {recording.type} Recording
                      </div>
                      <div className="text-muted-foreground">
                        {recording.timestamp.toLocaleTimeString()} •{" "}
                        {formatFileSize(recording.size)}
                      </div>
                    </div>
                    <button
                      onClick={() => onDownloadRecording(index)}
                      className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                      title="Download recording"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingStatus;
