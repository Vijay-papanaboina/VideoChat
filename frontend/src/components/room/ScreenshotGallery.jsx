import { useState } from "react";
import { Camera, Download, Trash2, Eye, EyeOff } from "lucide-react";

/**
 * ScreenshotGallery Component
 * Shows screenshot gallery with preview and download options
 */
const ScreenshotGallery = ({
  screenshots,
  onDownloadScreenshot,
  onClearScreenshots,
}) => {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (screenshots.length === 0) {
    return null;
  }

  return (
    <>
      {/* Screenshot Counter Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowGallery(!showGallery)}
          className="bg-background/90 backdrop-blur-sm rounded-lg shadow-lg border border-border p-3 hover:bg-background transition-colors"
          title={`${screenshots.length} screenshots`}
        >
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-foreground" />
            <span className="text-sm font-medium text-foreground">
              {screenshots.length}
            </span>
          </div>
        </button>
      </div>

      {/* Screenshot Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-2xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Screenshots ({screenshots.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClearScreenshots}
                  className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
                <button
                  onClick={() => setShowGallery(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <EyeOff className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Screenshot Grid */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {screenshots.map((screenshot, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedScreenshot(screenshot)}
                  >
                    {/* Screenshot Preview */}
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <img
                        src={URL.createObjectURL(screenshot.blob)}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                        onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                      />
                    </div>

                    {/* Screenshot Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {screenshot.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {screenshot.type}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {screenshot.timestamp.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(screenshot.size)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadScreenshot(index);
                          }}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Download screenshot"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-size Screenshot Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={URL.createObjectURL(selectedScreenshot.blob)}
              alt="Full size screenshot"
              className="max-w-full max-h-full object-contain rounded-lg"
              onLoad={(e) => URL.revokeObjectURL(e.target.src)}
            />

            {/* Close and Download buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={() =>
                  onDownloadScreenshot(screenshots.indexOf(selectedScreenshot))
                }
                className="bg-background/80 backdrop-blur-sm rounded-full p-2 text-blue-500 hover:text-blue-700 transition-colors"
                title="Download screenshot"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="bg-background/80 backdrop-blur-sm rounded-full p-2 text-foreground hover:text-muted-foreground transition-colors"
              >
                <EyeOff className="w-5 h-5" />
              </button>
            </div>

            {/* Screenshot Info */}
            <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3">
              <div className="text-sm text-foreground font-medium">
                {selectedScreenshot.username}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedScreenshot.timestamp.toLocaleString()} •{" "}
                {formatFileSize(selectedScreenshot.size)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScreenshotGallery;
