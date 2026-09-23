export default function ResultsScreen({
  userName,
  userId,
  questions,
  finalResult,
  sessionProgress,
  onRetake,
}) {
  const scorePercent =
    questions.length > 0
      ? Math.round(((finalResult?.correct ?? 0) / questions.length) * 100)
      : 0;

  return (
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
          <div className="stat-number">{scorePercent}%</div>
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

      <button className="btn btn-action-primary" onClick={onRetake}>
        Take Another Exam
      </button>
    </div>
  );
}
