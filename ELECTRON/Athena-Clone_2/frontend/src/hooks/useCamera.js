import { useState, useRef, useEffect, useCallback } from 'react';

export function useCamera(onError) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const mediaStreamRef = useRef(null);
  const activeVideoElements = useRef(new Set());

  // Attach active stream to a video element and ensure playback
  const attachStreamToVideo = useCallback((videoEl) => {
    if (!videoEl) return;
    activeVideoElements.current.add(videoEl);
    const stream = mediaStreamRef.current;
    if (stream) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      videoEl.play().catch(() => {});
    }
  }, []);

  // Detach video element on unmount
  const detachVideo = useCallback((videoEl) => {
    if (videoEl) {
      activeVideoElements.current.delete(videoEl);
    }
  }, []);

  // Sync all registered video elements whenever mediaStream updates
  useEffect(() => {
    mediaStreamRef.current = mediaStream;
    if (mediaStream) {
      activeVideoElements.current.forEach((el) => {
        if (el) {
          if (el.srcObject !== mediaStream) {
            el.srcObject = mediaStream;
          }
          el.play().catch(() => {});
        }
      });
    }
  }, [mediaStream]);

  // Request or re-verify camera stream
  async function getCameraAccess() {
    try {
      // If stream already exists with active tracks, re-use and rebind
      if (mediaStreamRef.current) {
        const tracks = mediaStreamRef.current.getVideoTracks();
        if (tracks.length > 0 && tracks[0].readyState === 'live') {
          setCameraEnabled(true);
          activeVideoElements.current.forEach((el) => {
            if (el) {
              if (el.srcObject !== mediaStreamRef.current) {
                el.srcObject = mediaStreamRef.current;
              }
              el.play().catch(() => {});
            }
          });
          return mediaStreamRef.current;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      mediaStreamRef.current = stream;
      setMediaStream(stream);
      setCameraEnabled(true);

      activeVideoElements.current.forEach((el) => {
        if (el) {
          el.srcObject = stream;
          el.play().catch(() => {});
        }
      });
      return stream;
    } catch (_err) {
      if (onError) onError('Camera access denied. Please grant camera permission.');
      return null;
    }
  }

  return {
    cameraEnabled,
    mediaStream,
    mediaStreamRef,
    attachStreamToVideo,
    detachVideo,
    getCameraAccess,
  };
}
