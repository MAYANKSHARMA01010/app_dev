import CandidateCard from './CandidateCard';

export default function SetupScreen({
  userName,
  setUserName,
  userId,
  setUserId,
  cameraEnabled,
  onGetCameraAccess,
  fullScreen,
  onEnableFullScreen,
  attachStreamToVideo,
  detachVideo,
  onStartExam,
  onShowRules,
  loading,
}) {
  const isFormComplete = userName.trim().length > 0 && userId.trim().length > 0;

  return (
    <>
      <div className="header-section">
        <h1>Hi {userName.trim() ? userName.trim() : 'Candidate'}!</h1>
        <p>Kindly enter your details and allow permissions to start the test:</p>
      </div>

      <CandidateCard
        userName={userName}
        setUserName={setUserName}
        userId={userId}
        setUserId={setUserId}
      />

      <div className="card-container">
        {/* Section 1: Configure Heimdall */}
        <div className="permission-item">
          <div className="icon-box">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#111827"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </div>
          <div className="permission-content">
            <h3>Configure Heimdall</h3>
            <p>Kindly configure our proctoring app to attempt quiz/contests.</p>
            <div className="action-row">
              <button
                className={`btn btn-black ${cameraEnabled ? 'connected' : ''}`}
                disabled={cameraEnabled}
                onClick={onGetCameraAccess}
              >
                {cameraEnabled ? 'Connected ✓' : 'Connect with Heimdall'}
              </button>

              {cameraEnabled && (
                <div className="camera-badge-container">
                  <video
                    ref={(el) => {
                      if (el) attachStreamToVideo?.(el);
                      else detachVideo?.(el);
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="preview-video-feed"
                  />
                  <span className="live-tag">LIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Section 2: Switch to full screen */}
        <div className="permission-item">
          <div className="icon-box">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#111827"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </div>
          <div className="permission-content">
            <h3>Switch to full screen</h3>
            <p>Kindly close all tabs and switch to full screen</p>
            <button
              className={`btn btn-grey ${fullScreen ? 'enabled' : ''}`}
              disabled={fullScreen}
              onClick={onEnableFullScreen}
            >
              {fullScreen ? 'Full Screen Enabled ✓' : 'Give Full Screen Permissions'}
            </button>
          </div>
        </div>
      </div>

      <div className="bottom-actions">
        <button
          className="btn btn-go-test"
          disabled={!cameraEnabled || !fullScreen || !isFormComplete || loading}
          onClick={onStartExam}
          title={!isFormComplete ? 'Please fill your name and student ID' : ''}
        >
          {loading ? 'Starting...' : 'Go To Test'}
        </button>
        <button className="btn btn-help" onClick={onShowRules}>
          Need Help?
        </button>
      </div>
    </>
  );
}
