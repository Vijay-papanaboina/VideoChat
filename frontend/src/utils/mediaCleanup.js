/**
 * Utility functions for aggressive media cleanup
 */

/**
 * Force stop all media tracks globally
 * This function tries multiple approaches to ensure tracks are stopped
 */
export const forceStopAllMediaTracks = () => {
  console.log("=== FORCE STOPPING ALL MEDIA TRACKS ===");

  // Method 1: Stop all tracks from navigator.mediaDevices
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("Attempting to stop tracks via navigator.mediaDevices");
    // This is a fallback - we can't directly access active tracks from here
    // but we can try to revoke permissions
  }

  // Method 2: Try to find and stop tracks from any active streams
  // This is a more aggressive approach
  try {
    // Get all video and audio elements that might have streams
    const videoElements = document.querySelectorAll("video");
    const audioElements = document.querySelectorAll("audio");

    console.log(
      `Found ${videoElements.length} video elements and ${audioElements.length} audio elements`
    );

    // Stop tracks from video elements
    videoElements.forEach((video, index) => {
      if (video.srcObject) {
        console.log(`Stopping tracks from video element ${index}`);
        const stream = video.srcObject;
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((track) => {
            console.log(
              `Stopping track from video ${index}:`,
              track.kind,
              track.label
            );
            track.enabled = false;
            track.stop();
          });
        }
        video.srcObject = null;
      }
    });

    // Stop tracks from audio elements
    audioElements.forEach((audio, index) => {
      if (audio.srcObject) {
        console.log(`Stopping tracks from audio element ${index}`);
        const stream = audio.srcObject;
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((track) => {
            console.log(
              `Stopping track from audio ${index}:`,
              track.kind,
              track.label
            );
            track.enabled = false;
            track.stop();
          });
        }
        audio.srcObject = null;
      }
    });
  } catch (error) {
    console.error("Error during aggressive media cleanup:", error);
  }

  // Method 3: Try to revoke media permissions (this might help in some cases)
  if (navigator.permissions) {
    navigator.permissions
      .query({ name: "camera" })
      .then((result) => {
        console.log("Camera permission state:", result.state);
      })
      .catch(console.error);

    navigator.permissions
      .query({ name: "microphone" })
      .then((result) => {
        console.log("Microphone permission state:", result.state);
      })
      .catch(console.error);
  }

  console.log("=== FORCE STOP COMPLETED ===");
};

/**
 * Debug function to check current media track states
 */
export const debugMediaTracks = () => {
  console.log("=== DEBUGGING MEDIA TRACKS ===");

  // Check all video and audio elements
  const videoElements = document.querySelectorAll("video");
  const audioElements = document.querySelectorAll("audio");

  console.log(
    `Found ${videoElements.length} video elements and ${audioElements.length} audio elements`
  );

  videoElements.forEach((video, index) => {
    console.log(`Video element ${index}:`, {
      srcObject: !!video.srcObject,
      paused: video.paused,
      ended: video.ended,
      readyState: video.readyState,
    });

    if (video.srcObject && video.srcObject.getTracks) {
      const tracks = video.srcObject.getTracks();
      console.log(`  Video ${index} has ${tracks.length} tracks:`);
      tracks.forEach((track, trackIndex) => {
        console.log(`    Track ${trackIndex}:`, {
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
        });
      });
    }
  });

  audioElements.forEach((audio, index) => {
    console.log(`Audio element ${index}:`, {
      srcObject: !!audio.srcObject,
      paused: audio.paused,
      ended: audio.ended,
      readyState: audio.readyState,
    });

    if (audio.srcObject && audio.srcObject.getTracks) {
      const tracks = audio.srcObject.getTracks();
      console.log(`  Audio ${index} has ${tracks.length} tracks:`);
      tracks.forEach((track, trackIndex) => {
        console.log(`    Track ${trackIndex}:`, {
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
        });
      });
    }
  });

  console.log("=== DEBUG COMPLETED ===");
};

/**
 * Stop tracks from a specific stream reference
 */
export const stopStreamTracks = (streamRef) => {
  if (!streamRef || !streamRef.current) {
    console.log("No stream reference provided");
    return;
  }

  const stream = streamRef.current;
  const tracks = stream.getTracks();

  console.log(`Stopping ${tracks.length} tracks from stream reference`);

  tracks.forEach((track, index) => {
    console.log(`Track ${index}:`, {
      kind: track.kind,
      label: track.label,
      enabled: track.enabled,
      readyState: track.readyState,
      muted: track.muted,
    });

    // Disable first
    track.enabled = false;

    // Then stop
    track.stop();

    // Verify
    if (track.readyState === "live") {
      console.warn(`Track ${index} still live after stop, trying again`);
      track.stop();
    }
  });

  // Clear the stream reference
  streamRef.current = null;
};
