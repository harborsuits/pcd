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
  return captureTabCropped();
}

/**
 * Capture the current browser tab and optionally crop to a specific element
 * This allows capturing just the preview area even when running inside Lovable editor
 */
export async function captureTabCropped(cropEl?: HTMLElement): Promise<CaptureResult> {
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

    // Use ImageCapture API if available, fallback to video element
    let bitmap: ImageBitmap | null = null;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (window as any).ImageCapture !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imageCapture = new (window as any).ImageCapture(track);
      bitmap = await imageCapture.grabFrame();
    }

    // Create canvas for full frame
    const full = document.createElement("canvas");
    
    if (bitmap) {
      full.width = bitmap.width;
      full.height = bitmap.height;
      const fctx = full.getContext("2d");
      if (!fctx) {
        throw { type: "unknown", message: "Could not create canvas context" } as CaptureError;
      }
      fctx.drawImage(bitmap, 0, 0);
    } else {
      // Fallback: use video element
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(reject);
        };
        video.onerror = () => reject(new Error("Video load failed"));
      });

      // Small delay to ensure frame is rendered
      await new Promise((r) => setTimeout(r, 100));

      full.width = video.videoWidth;
      full.height = video.videoHeight;
      const fctx = full.getContext("2d");
      if (!fctx) {
        throw { type: "unknown", message: "Could not create canvas context" } as CaptureError;
      }
      fctx.drawImage(video, 0, 0);
    }

    // Optional crop to preview region
    if (cropEl) {
      const r = cropEl.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Scale coordinates to match captured frame resolution
      const scaleX = full.width / window.innerWidth;
      const scaleY = full.height / window.innerHeight;

      const sx = Math.max(0, Math.floor(r.left * scaleX));
      const sy = Math.max(0, Math.floor(r.top * scaleY));
      const sw = Math.max(1, Math.floor(r.width * scaleX));
      const sh = Math.max(1, Math.floor(r.height * scaleY));

      const cropped = document.createElement("canvas");
      cropped.width = sw;
      cropped.height = sh;
      const cctx = cropped.getContext("2d");
      if (!cctx) {
        throw { type: "unknown", message: "Could not create canvas context" } as CaptureError;
      }
      cctx.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);

      return {
        dataUrl: cropped.toDataURL("image/png", 1.0),
        width: sw,
        height: sh,
      };
    }

    return {
      dataUrl: full.toDataURL("image/png", 1.0),
      width: full.width,
      height: full.height,
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
