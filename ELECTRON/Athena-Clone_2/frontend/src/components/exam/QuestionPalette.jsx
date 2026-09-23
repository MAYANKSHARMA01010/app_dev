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
          >
            {i + 1}
          </button>
        ))}
      </div>

      {!isCurrentAnswered ? (
        <button
          className="btn btn-action-primary"
          disabled={!hasSelection || loading}
          onClick={onSubmitAnswer}
        >
          {loading ? 'Saving...' : 'Submit Answer'}
        </button>
      ) : (
        <button
          className="btn btn-secondary"
          disabled={currentIndex === questions.length - 1}
          onClick={onNext}
        >
          Next
        </button>
      )}
    </div>
  );
}
