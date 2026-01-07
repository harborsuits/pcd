/**
 * Tab Capture Utility
 * Uses browser's getDisplayMedia API to capture the current tab
 * This works with cross-origin iframes (unlike html2canvas)
 */

export interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
}

export interface CaptureError {
  type: "not_supported" | "permission_denied" | "cancelled" | "unknown";
  message: string;
}

/**
 * Check if tab capture is supported in this browser
 */
export function isTabCaptureSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === "function"
  );
}

/**
 * Capture the current browser tab as a screenshot
 * Uses getDisplayMedia with preferCurrentTab option
 */
export async function captureTab(): Promise<CaptureResult> {
  if (!isTabCaptureSupported()) {
    throw {
      type: "not_supported",
      message: "Screen capture is not supported in this browser",
    } as CaptureError;
  }

  let stream: MediaStream | null = null;

  try {
    // Request screen capture with preference for current tab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      video: {
        displaySurface: "browser",
      },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: "include",
    };
    stream = await navigator.mediaDevices.getDisplayMedia(options);

    // Get the video track
    const track = stream.getVideoTracks()[0];
    if (!track) {
      throw {
        type: "unknown",
        message: "No video track available",
      } as CaptureError;
    }

    // Get track settings for dimensions
    const settings = track.getSettings();
    const width = settings.width || 1920;
    const height = settings.height || 1080;

    // Create video element to capture a frame
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    // Wait for video to be ready
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(resolve).catch(reject);
      };
      video.onerror = () => reject(new Error("Video load failed"));
    });

    // Small delay to ensure frame is rendered
    await new Promise((r) => setTimeout(r, 100));

    // Create canvas and draw the frame
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || width;
    canvas.height = video.videoHeight || height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw {
        type: "unknown",
        message: "Could not create canvas context",
      } as CaptureError;
    }

    ctx.drawImage(video, 0, 0);

    // Convert to data URL
    const dataUrl = canvas.toDataURL("image/png");

    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error: unknown) {
    // Handle known error types
    if (error && typeof error === "object" && "type" in error) {
      throw error as CaptureError;
    }

    const err = error as Error;

    // User cancelled the picker
    if (err.name === "NotAllowedError" || err.message?.includes("cancel")) {
      throw {
        type: "cancelled",
        message: "Screen capture was cancelled",
      } as CaptureError;
    }

    // Permission denied
    if (err.name === "NotAllowedError") {
      throw {
        type: "permission_denied",
        message: "Screen capture permission was denied",
      } as CaptureError;
    }

    throw {
      type: "unknown",
      message: err.message || "Failed to capture screen",
    } as CaptureError;
  } finally {
    // Always stop the stream to release resources
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }
}
