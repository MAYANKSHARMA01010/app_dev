export default function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  isAnswered,
  selectedAnswer,
  onSelectOption,
}) {
  return (
    <>
      <div className="question-top-bar">
        <span className="q-label">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        {isAnswered && <span className="saved-badge">Answer Saved ✓</span>}
      </div>

      <h2 className="q-title">{question.question}</h2>

      <div className="options-container">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          return (
            <div
              key={idx}
              className={`option-btn ${isSelected ? 'selected' : ''} ${
                isAnswered ? 'locked' : ''
              }`}
              onClick={() => {
                if (!isAnswered) {
                  onSelectOption(question.id, idx);
                }
              }}
            >
              <div className="option-letter">{String.fromCharCode(65 + idx)}</div>
              <div className="option-label">{option}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
