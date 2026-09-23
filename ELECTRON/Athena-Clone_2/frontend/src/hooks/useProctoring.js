import { useState, useEffect } from 'react';

export function useProctoring(mediaStreamRef, onError) {
  const [timer, setTimer] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    let removeTimer = () => {};
    let removeSnap = () => {};
    let removeBlur = () => {};

    // 1. Listen for timer tick from Electron main process
    if (window.athena?.registerListenerForTimerTickFromMain) {
      removeTimer = window.athena.registerListenerForTimerTickFromMain((time) => {
        setTimer(Math.floor(Number(time)));
      });
    }

    // 2. Listen for window blur / swipe attempt warning from Electron
    if (window.athena?.registerListenerForBlurWarning) {
      removeBlur = window.athena.registerListenerForBlurWarning(() => {
        if (onError) {
          onError('⚠️ Notice: Exam window must remain active. Swiping or switching apps is restricted.');
        }
      });
    }

    // 3. Listen for camera snapshot trigger from Electron main process
    if (window.athena?.registerListenerForCameraSnapFromMain) {
      removeSnap = window.athena.registerListenerForCameraSnapFromMain(async () => {
        const stream = mediaStreamRef.current;
        if (!stream) return;
        try {
          const track = stream.getVideoTracks()[0];
          if (!track || track.readyState !== 'live') return;

          let buffer = null;

          // Strategy A: ImageCapture API
          try {
            const imageCapture = new ImageCapture(track);
            const blob = await imageCapture.takePhoto();
            buffer = await blob.arrayBuffer();
          } catch (_err) {
            // Driver/AVCapture busy: fallback immediately to canvas frame grab
          }

          // Strategy B: Canvas frame grab fallback (100% reliable, zero native driver conflicts)
          if (!buffer) {
            const videoEl =
              document.querySelector('.exam-pip-feed') ||
              document.querySelector('.preview-video-feed') ||
              document.querySelector('video');
            if (videoEl && videoEl.videoWidth > 0) {
              const canvas = document.createElement('canvas');
              canvas.width = videoEl.videoWidth;
              canvas.height = videoEl.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
              const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
              if (blob) {
                buffer = await blob.arrayBuffer();
              }
            }
          }

          if (buffer) {
            window.athena?.storeCameraSnapImageOnDisk?.(buffer);
          }
        } catch (err) {
          console.error('Camera capture error:', err);
        }
      });
    }

    return () => {
      removeTimer();
      removeSnap();
      removeBlur();
    };
  }, [mediaStreamRef, onError]);

  async function enableFullScreen() {
    try {
      // Enter native Electron kiosk mode & lock on all workspaces
      if (window.athena?.enterFullScreen) {
        await window.athena.enterFullScreen();
      }
      // Enter web fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      setFullScreen(true);
    } catch (_err) {
      if (onError) onError('Unable to activate full screen mode.');
    }
  }

  async function exitFullScreen() {
    try {
      if (window.athena?.exitFullScreen) {
        await window.athena.exitFullScreen();
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
      setFullScreen(false);
    } catch (_err) {
      // Ignore exit error
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
    exitFullScreen,
    showRules,
    formatTime,
  };
}
