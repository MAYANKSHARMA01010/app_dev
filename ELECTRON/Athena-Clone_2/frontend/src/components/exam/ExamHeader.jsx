export default function ExamHeader({
  userName,
  userId,
  timerDisplay,
  attemptedCount,
  totalQuestions,
  onShowRules,
}) {
  return (
    <div className="exam-header">
      <div className="exam-brand">
        <span className="brand-badge">Athena Assessment</span>
        <span className="candidate-pill">
          {userName} ({userId})
        </span>
        <span className="timer-box">⏱️ {timerDisplay}</span>
      </div>
      <div className="exam-right-panel">
        <span className="attempted-counter">
          Attempted: <strong>{attemptedCount}</strong> / {totalQuestions}
        </span>
        <button
          className="btn btn-secondary btn-rules"
          onClick={onShowRules}
        >
          Exam Rules
        </button>
      </div>
    </div>
  );
}
