import { useEffect, useRef, useState } from 'react';
import './App.css';
import { api } from './api';

function App() {
  const [stage, setStage] = useState('setup');

  // Candidate information (user entered, no hardcoding)
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  // Permissions & Hardware
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const mediaStreamRef = useRef(null);
  const [timer, setTimer] = useState(0);
  const videoRef = useRef(null);

  // Exam session
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [sessionProgress, setSessionProgress] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep mediaStreamRef in sync with state
  useEffect(() => {
    mediaStreamRef.current = mediaStream;
    if (videoRef.current && mediaStream && videoRef.current.srcObject !== mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, cameraEnabled, stage]);

  // Capture proctoring snapshot using active stream
  async function saveVideoScreenShots() {
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
  }

  // Register Electron IPC listeners on mount
  useEffect(() => {
    let removeTimer = () => {};
    let removeSnap = () => {};

    if (window.athena?.registerListenerForTimerTickFromMain) {
      removeTimer = window.athena.registerListenerForTimerTickFromMain((time) => {
        setTimer(Math.floor(Number(time)));
      });
    }

    if (window.athena?.registerListenerForCameraSnapFromMain) {
      removeSnap = window.athena.registerListenerForCameraSnapFromMain(saveVideoScreenShots);
    }

    return () => {
      removeTimer();
      removeSnap();
    };
  }, []);

  // Connect camera and show live feed
  async function getCameraAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
      setError(null);
    } catch (_err) {
      setError('Camera access denied. Please grant camera permission.');
    }
  }

  // Request fullscreen
  async function enableFullScreen() {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setFullScreen(true);
      setError(null);
    } catch (_err) {
      setError('Unable to activate full screen mode.');
    }
  }

  // Athena rules
  function showRules() {
    if (window.athena?.showRules) {
      window.athena.showRules();
    } else {
      alert("Athena Exam Rules:\n1. Stay on exam screen.\n2. Camera must remain enabled.\n3. Do not leave the exam.\n4. Click Submit Exam when finished.");
    }
  }

  // Start exam with user-entered name and ID
  async function handleStartExam() {
    if (!userName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!userId.trim()) {
      setError('Please enter your Student ID.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startRes = await api.startExam(userName.trim(), userId.trim());
      const questionList = await api.getQuestions();

      setSessionId(startRes.sessionId);
      setQuestions(questionList);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setSubmittedAnswers({});
      setStage('exam');

      window.athena?.startTimerOnMain?.();
    } catch (err) {
      setError(err.message || 'Failed to start exam. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }

  // Select question
  async function handleSelectQuestion(index) {
    setCurrentIndex(index);
    const targetQ = questions[index];
    if (targetQ?.id) {
      try {
        const freshQ = await api.getQuestion(targetQ.id);
        setQuestions((prev) =>
          prev.map((q) => (q.id === freshQ.id ? { ...q, ...freshQ } : q))
        );
      } catch (err) {
        console.error('Failed to fetch question detail:', err);
      }
    }
  }

  // Submit answer
  async function handleSubmitAnswer() {
    const currentQ = questions[currentIndex];
    const selectedOption = selectedAnswers[currentQ.id];

    if (selectedOption === undefined) {
      setError('Please select an option first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.submitAnswer(sessionId, currentQ.id, selectedOption);
      setSubmittedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: {
          selectedAnswer: selectedOption,
          isCorrect: res.isCorrect,
        },
      }));

      const session = await api.getSession(sessionId);
      setSessionProgress(session);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setLoading(false);
    }
  }

  // Submit whole exam
  async function handleSubmitExam() {
    if (!window.confirm('Are you sure you want to finish and submit the exam?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.submitExam(sessionId);
      setFinalResult(res.result);

      const session = await api.getSession(sessionId);
      setSessionProgress(session);

      setStage('result');
    } catch (err) {
      setError(err.message || 'Failed to submit exam.');
    } finally {
      setLoading(false);
    }
  }

  // Retake exam
  function handleRetake() {
    setStage('setup');
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setSessionProgress(null);
    setFinalResult(null);
    setError(null);
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const isCurrentAnswered = currentQ ? !!submittedAnswers[currentQ.id] : false;
  const isFormComplete = userName.trim().length > 0 && userId.trim().length > 0;

  return (
    <div className="page-container">
      {error && <div className="error-banner">{error}</div>}

      {/* ================= 1. SETUP & PERMISSIONS SCREEN ================= */}
      {stage === 'setup' && (
        <>
          <div className="header-section">
            <h1>Hi {userName.trim() ? userName.trim() : 'Candidate'}!</h1>
            <p>Kindly enter your details and allow permissions to start the test:</p>
          </div>

          {/* User inputs: Name and Student ID */}
          <div className="candidate-card">
            <div className="input-group">
              <label>Candidate Name</label>
              <input
                type="text"
                className="minimal-input"
                placeholder="Enter your full name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Student ID</label>
              <input
                type="text"
                className="minimal-input"
                placeholder="Enter your student ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          </div>

          {/* Permissions Card */}
          <div className="card-container">
            {/* Section 1: Configure Heimdall */}
            <div className="permission-item">
              <div className="icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    onClick={getCameraAccess}
                  >
                    {cameraEnabled ? 'Connected ✓' : 'Connect with Heimdall'}
                  </button>

                  {/* Show live camera preview once connected */}
                  {cameraEnabled && (
                    <div className="camera-badge-container">
                      <video
                        ref={videoRef}
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              </div>
              <div className="permission-content">
                <h3>Switch to full screen</h3>
                <p>Kindly close all tabs and switch to full screen</p>
                <button
                  className={`btn btn-grey ${fullScreen ? 'enabled' : ''}`}
                  disabled={fullScreen}
                  onClick={enableFullScreen}
                >
                  {fullScreen ? 'Full Screen Enabled ✓' : 'Give Full Screen Permissions'}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="bottom-actions">
            <button
              className="btn btn-go-test"
              disabled={!cameraEnabled || !fullScreen || !isFormComplete || loading}
              onClick={handleStartExam}
              title={!isFormComplete ? 'Please fill your name and student ID' : ''}
            >
              {loading ? 'Starting...' : 'Go To Test'}
            </button>
            <button className="btn btn-help" onClick={showRules}>
              Need Help?
            </button>
          </div>
        </>
      )}

      {/* ================= 2. ACTIVE EXAM VIEW ================= */}
      {stage === 'exam' && currentQ && (
        <>
          <div className="exam-header">
            <div className="exam-brand">
              <span className="brand-badge">Athena Assessment</span>
              <span className="candidate-pill">{userName} ({userId})</span>
              <span className="timer-box">⏱️ {formatTime(timer)}</span>
            </div>
            <div className="exam-right-panel">
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
                Attempted: {Object.keys(submittedAnswers).length} / {questions.length}
              </span>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={showRules}>
                Rules
              </button>
              {/* Proctoring camera feed in exam view */}
              <div className="exam-proctor-pip" title="Live proctoring active">
                <video
                  ref={(el) => {
                    if (el && mediaStream && el.srcObject !== mediaStream) {
                      el.srcObject = mediaStream;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="exam-pip-feed"
                />
              </div>
            </div>
          </div>

          <div className="card-container">
            <div className="question-top-bar">
              <span className="q-label">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {isCurrentAnswered && (
                <span className="saved-badge">
                  Answer Saved ✓
                </span>
              )}
            </div>

            <h2 className="q-title">{currentQ.question}</h2>

            <div className="options-container">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === idx;
                return (
                  <div
                    key={idx}
                    className={`option-btn ${isSelected ? 'selected' : ''} ${
                      isCurrentAnswered ? 'locked' : ''
                    }`}
                    onClick={() => {
                      if (!isCurrentAnswered) {
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: idx,
                        }));
                      }
                    }}
                  >
                    <div className="option-letter">{String.fromCharCode(65 + idx)}</div>
                    <div className="option-label">{option}</div>
                  </div>
                );
              })}
            </div>

            <div className="exam-footer">
              <button
                className="btn btn-secondary"
                disabled={currentIndex === 0}
                onClick={() => handleSelectQuestion(currentIndex - 1)}
              >
                Previous
              </button>

              <div className="palette-row">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    className={`palette-chip ${currentIndex === i ? 'active' : ''} ${
                      submittedAnswers[q.id] ? 'answered' : ''
                    }`}
                    onClick={() => handleSelectQuestion(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {!isCurrentAnswered ? (
                <button
                  className="btn btn-action-primary"
                  disabled={selectedAnswers[currentQ.id] === undefined || loading}
                  onClick={handleSubmitAnswer}
                >
                  {loading ? 'Saving...' : 'Submit Answer'}
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => handleSelectQuestion(currentIndex + 1)}
                >
                  Next
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-finish" onClick={handleSubmitExam} disabled={loading}>
              {loading ? 'Submitting...' : 'Finish & Submit Exam'}
            </button>
          </div>
        </>
      )}

      {/* ================= 3. EXAM RESULTS VIEW ================= */}
      {stage === 'result' && (
        <div className="card-container result-box">
          <h2>Exam Completed!</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            Candidate: <strong>{userName}</strong> ({userId})
          </p>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{questions.length}</div>
              <div className="stat-title">Total Questions</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{finalResult?.attempted ?? 0}</div>
              <div className="stat-title">Attempted</div>
            </div>
            <div className="stat-item correct">
              <div className="stat-number">{finalResult?.correct ?? 0}</div>
              <div className="stat-title">Correct</div>
            </div>
            <div className="stat-item score">
              <div className="stat-number">
                {questions.length > 0
                  ? Math.round(((finalResult?.correct ?? 0) / questions.length) * 100)
                  : 0}
                %
              </div>
              <div className="stat-title">Score</div>
            </div>
          </div>

          <div className="review-card">
            {questions.map((q, idx) => {
              const ans = sessionProgress?.answers?.find((a) => a.questionId === q.id);
              return (
                <div key={q.id} className="review-row">
                  <div className="review-question">
                    {idx + 1}. {q.question}
                  </div>
                  <div className="review-answer-status">
                    {ans ? (
                      <>
                        Selected: <strong>{q.options[ans.selectedAnswer]}</strong> •{' '}
                        <span
                          style={{
                            color: ans.isCorrect ? '#16a34a' : '#dc2626',
                            fontWeight: 700,
                          }}
                        >
                          {ans.isCorrect ? '✓ Correct' : '✗ Wrong'}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Not attempted</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn btn-action-primary" onClick={handleRetake}>
            Take Another Exam
          </button>
        </div>
      )}
    </div>
  );
}

export default App;