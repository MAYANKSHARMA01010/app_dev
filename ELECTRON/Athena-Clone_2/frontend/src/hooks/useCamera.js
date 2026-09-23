import { useState, useRef, useEffect } from 'react';

export function useCamera(onError) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    mediaStreamRef.current = mediaStream;
    if (videoRef.current && mediaStream && videoRef.current.srcObject !== mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  async function getCameraAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
    } catch (_err) {
      if (onError) onError('Camera access denied. Please grant camera permission.');
    }
  }

  return {
    cameraEnabled,
    mediaStream,
    mediaStreamRef,
    videoRef,
    getCameraAccess,
  };
}
