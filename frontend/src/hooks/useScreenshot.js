import { useState, useCallback } from "react";

/**
 * Custom hook for screenshot functionality
 * Supports capturing individual streams or the entire video grid
 */
export const useScreenshot = () => {
  const [screenshots, setScreenshots] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);

  // Capture screenshot of a specific video element
  const captureVideoScreenshot = useCallback(
    (videoElement, username = "Unknown") => {
      try {
        if (!videoElement || videoElement.videoWidth === 0) {
          throw new Error("Video element not ready for capture");
        }

        setIsCapturing(true);

        // Create canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size to match video
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const screenshot = {
                blob,
                username,
                timestamp: new Date(),
                size: blob.size,
                type: "video",
                dimensions: { width: canvas.width, height: canvas.height },
              };

              setScreenshots((prev) => [...prev, screenshot]);
              setIsCapturing(false);

              console.log(`📸 Captured screenshot of ${username}`);
            } else {
              throw new Error("Failed to create screenshot blob");
            }
          },
          "image/png",
          0.95
        );
      } catch (error) {
        console.error("Error capturing video screenshot:", error);
        setIsCapturing(false);
        alert(`Failed to capture screenshot: ${error.message}`);
      }
    },
    []
  );

  // Capture screenshot of the entire video grid
  const captureGridScreenshot = useCallback(
    (containerElement, title = "Video Grid") => {
      try {
        if (!containerElement) {
          throw new Error("Container element not provided");
        }

        setIsCapturing(true);

        // Use html2canvas library would be ideal, but for now we'll use a simpler approach
        // Create a canvas to capture the container
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Get container dimensions
        const rect = containerElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // For now, we'll capture each video element individually and combine them
        // This is a simplified approach - for better results, use html2canvas
        const videoElements = containerElement.querySelectorAll("video");

        if (videoElements.length === 0) {
          throw new Error("No video elements found in container");
        }

        // Fill background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw each video element
        videoElements.forEach((videoElement, index) => {
          if (videoElement && videoElement.videoWidth > 0) {
            // Calculate position based on grid layout
            const cols = Math.ceil(Math.sqrt(videoElements.length));
            const cellWidth = canvas.width / cols;
            const cellHeight =
              canvas.height / Math.ceil(videoElements.length / cols);

            const x = (index % cols) * cellWidth;
            const y = Math.floor(index / cols) * cellHeight;

            ctx.drawImage(videoElement, x, y, cellWidth, cellHeight);
          }
        });

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const screenshot = {
                blob,
                username: title,
                timestamp: new Date(),
                size: blob.size,
                type: "grid",
                dimensions: { width: canvas.width, height: canvas.height },
              };

              setScreenshots((prev) => [...prev, screenshot]);
              setIsCapturing(false);

              console.log(`📸 Captured grid screenshot`);
            } else {
              throw new Error("Failed to create grid screenshot blob");
            }
          },
          "image/png",
          0.95
        );
      } catch (error) {
        console.error("Error capturing grid screenshot:", error);
        setIsCapturing(false);
        alert(`Failed to capture grid screenshot: ${error.message}`);
      }
    },
    []
  );

  // Capture screenshot of screen sharing content
  const captureScreenShareScreenshot = useCallback(
    (screenShareElement, username = "Screen Share") => {
      try {
        if (!screenShareElement || screenShareElement.videoWidth === 0) {
          throw new Error("Screen share element not ready for capture");
        }

        setIsCapturing(true);

        // Create canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size to match screen share
        canvas.width = screenShareElement.videoWidth;
        canvas.height = screenShareElement.videoHeight;

        // Draw screen share frame to canvas
        ctx.drawImage(screenShareElement, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const screenshot = {
                blob,
                username,
                timestamp: new Date(),
                size: blob.size,
                type: "screen",
                dimensions: { width: canvas.width, height: canvas.height },
              };

              setScreenshots((prev) => [...prev, screenshot]);
              setIsCapturing(false);

              console.log(`📸 Captured screen share screenshot`);
            } else {
              throw new Error("Failed to create screen share screenshot blob");
            }
          },
          "image/png",
          0.95
        );
      } catch (error) {
        console.error("Error capturing screen share screenshot:", error);
        setIsCapturing(false);
        alert(`Failed to capture screen share screenshot: ${error.message}`);
      }
    },
    []
  );

  // Download screenshot
  const downloadScreenshot = useCallback(
    (screenshotIndex = -1) => {
      const screenshotList = screenshots;
      const screenshot =
        screenshotIndex === -1
          ? screenshotList[screenshotList.length - 1]
          : screenshotList[screenshotIndex];

      if (!screenshot) {
        alert("No screenshot available to download");
        return;
      }

      const url = URL.createObjectURL(screenshot.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `screenshot-${screenshot.type}-${
        screenshot.username
      }-${screenshot.timestamp.toISOString().slice(0, 19)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [screenshots]
  );

  // Clear all screenshots
  const clearScreenshots = useCallback(() => {
    setScreenshots([]);
  }, []);

  // Get screenshot preview URL
  const getScreenshotPreview = useCallback((screenshot) => {
    return URL.createObjectURL(screenshot.blob);
  }, []);

  return {
    screenshots,
    isCapturing,
    captureVideoScreenshot,
    captureGridScreenshot,
    captureScreenShareScreenshot,
    downloadScreenshot,
    clearScreenshots,
    getScreenshotPreview,
  };
};
