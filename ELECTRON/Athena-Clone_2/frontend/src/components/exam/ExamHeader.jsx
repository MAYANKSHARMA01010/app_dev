export default function ExamHeader({
  userName,
  userId,
  timerDisplay,
  attemptedCount,
  totalQuestions,
  onShowRules,
  mediaStream,
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
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
          Attempted: {attemptedCount} / {totalQuestions}
        </span>
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
          onClick={onShowRules}
        >
          Rules
        </button>
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
  );
}
