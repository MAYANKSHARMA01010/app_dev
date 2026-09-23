import { useState, useEffect } from 'react';

export function useProctoring(mediaStreamRef, onError) {
  const [timer, setTimer] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    let removeTimer = () => {};
    let removeSnap = () => {};

    // Listen for timer tick from Electron main process
    if (window.athena?.registerListenerForTimerTickFromMain) {
      removeTimer = window.athena.registerListenerForTimerTickFromMain((time) => {
        setTimer(Math.floor(Number(time)));
      });
    }

    // Listen for camera snapshot trigger from Electron main process
    if (window.athena?.registerListenerForCameraSnapFromMain) {
      removeSnap = window.athena.registerListenerForCameraSnapFromMain(async () => {
        const stream = mediaStreamRef.current;
        if (!stream) return;
        try {
          const track = stream.getVideoTracks()[0];
          if (!track) return;
          const imageCapture = new ImageCapture(track);
          const blob = await imageCapture.takePhoto();
          const buffer = await blob.arrayBuffer();
          window.athena?.storeCameraSnapImageOnDisk?.(buffer);
        } catch (err) {
          console.error('Camera capture error:', err);
        }
      });
    }

    return () => {
      removeTimer();
      removeSnap();
    };
  }, [mediaStreamRef]);

  async function enableFullScreen() {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setFullScreen(true);
    } catch (_err) {
      if (onError) onError('Unable to activate full screen mode.');
    }
  }

  function showRules() {
    if (window.athena?.showRules) {
      window.athena.showRules();
    } else {
      alert(
        'Athena Exam Rules:\n1. Stay on exam screen.\n2. Camera must remain enabled.\n3. Do not leave the exam.\n4. Click Submit Exam when finished.'
      );
    }
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return {
    timer,
    fullScreen,
    enableFullScreen,
    showRules,
    formatTime,
  };
}
