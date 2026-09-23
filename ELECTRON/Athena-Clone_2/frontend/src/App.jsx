import { useState } from 'react';
import api from './services/api';
import { useCamera } from './hooks/useCamera';
import { useProctoring } from './hooks/useProctoring';
import SetupScreen from './components/setup/SetupScreen';
import ExamScreen from './components/exam/ExamScreen';
import ResultsScreen from './components/results/ResultsScreen';
import './App.css';

function App() {
  const [stage, setStage] = useState('setup'); // 'setup' | 'exam' | 'result'

  // Candidate credentials
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Custom hardware & desktop hooks
  const {
    cameraEnabled,
    mediaStreamRef,
    attachStreamToVideo,
    detachVideo,
    getCameraAccess,
  } = useCamera(setError);

  const {
    timer,
    fullScreen,
    enableFullScreen,
    showRules,
    formatTime,
  } = useProctoring(mediaStreamRef, setError);

  // Exam session data
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [sessionProgress, setSessionProgress] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  // 1. Start Exam
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

      // Start Proctoring Timers and Captures
      window.athena?.startTimerOnMain?.();
    } catch (err) {
      setError(err.message || 'Failed to start exam. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }

  // 2. Select Question
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

  // 3. Select Option (A, B, C, D)
  function handleSelectOption(opt) {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: opt,
    }));
  }

  // 4. Submit Answer for current question
  async function handleSubmitAnswer() {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const chosenOption =
      selectedAnswers[currentQ.id] !== undefined
        ? selectedAnswers[currentQ.id]
        : submittedAnswers[currentQ.id]?.selectedOption;

    if (chosenOption === undefined) {
      setError('Please select an option before saving.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const answerRes = await api.submitAnswer(sessionId, currentQ.id, chosenOption);

      setSubmittedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: {
          selectedOption: chosenOption,
          isCorrect: answerRes.isCorrect,
          correctAnswer: answerRes.correctAnswer,
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

  // 5. Submit Whole Exam
  async function handleSubmitExam() {
    if (!window.confirm('Are you sure you want to finish and submit the exam?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.submitExam(sessionId);
      setFinalResult(res.result);

      window.athena?.stopTimerOnMain?.();

      const session = await api.getSession(sessionId);
      setSessionProgress(session);

      setStage('result');
    } catch (err) {
      setError(err.message || 'Failed to submit exam.');
    } finally {
      setLoading(false);
    }
  }

  // 6. Retake Exam (Give another paper)
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

  return (
    <div className="page-container">
      {/* Persistent hidden background video ensuring camera stream stays alive across all stages */}
      <video
        ref={(el) => {
          if (el) attachStreamToVideo(el);
          else detachVideo(el);
        }}
        autoPlay
        playsInline
        muted
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {error && <div className="error-banner">{error}</div>}

      {stage === 'setup' && (
        <SetupScreen
          userName={userName}
          setUserName={setUserName}
          userId={userId}
          setUserId={setUserId}
          cameraEnabled={cameraEnabled}
          onGetCameraAccess={getCameraAccess}
          fullScreen={fullScreen}
          onEnableFullScreen={enableFullScreen}
          attachStreamToVideo={attachStreamToVideo}
          detachVideo={detachVideo}
          onStartExam={handleStartExam}
          onShowRules={showRules}
          loading={loading}
        />
      )}

      {stage === 'exam' && (
        <ExamScreen
          userName={userName}
          userId={userId}
          timerDisplay={formatTime(timer)}
          questions={questions}
          currentIndex={currentIndex}
          selectedAnswers={selectedAnswers}
          submittedAnswers={submittedAnswers}
          onSelectOption={handleSelectOption}
          onSelectQuestion={handleSelectQuestion}
          onPrevious={() => handleSelectQuestion(currentIndex - 1)}
          onNext={() => handleSelectQuestion(currentIndex + 1)}
          onSubmitAnswer={handleSubmitAnswer}
          onSubmitExam={handleSubmitExam}
          onShowRules={showRules}
          loading={loading}
        />
      )}

      {stage === 'result' && (
        <ResultsScreen
          userName={userName}
          userId={userId}
          questions={questions}
          finalResult={finalResult}
          sessionProgress={sessionProgress}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}

export default App;