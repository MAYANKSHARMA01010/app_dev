export default function QuestionPalette({
  questions,
  currentIndex,
  submittedAnswers,
  onSelectQuestion,
  onPrevious,
  onNext,
  onSubmitAnswer,
  isCurrentAnswered,
  hasSelection,
  loading,
}) {
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="exam-footer">
      <button
        className="btn btn-secondary"
        disabled={currentIndex === 0}
        onClick={onPrevious}
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
            onClick={() => onSelectQuestion(i)}
            title={`Question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="footer-right-actions">
        {hasSelection && (
          <button
            className="btn btn-action-primary"
            disabled={loading}
            onClick={onSubmitAnswer}
          >
            {loading
              ? 'Saving...'
              : isCurrentAnswered
              ? 'Update Answer'
              : isLastQuestion
              ? 'Save Answer'
              : 'Save & Next'}
          </button>
        )}

        {!isLastQuestion && (
          <button
            className="btn btn-secondary"
            onClick={onNext}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
