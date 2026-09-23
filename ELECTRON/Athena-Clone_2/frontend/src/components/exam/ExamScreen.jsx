import ExamHeader from './ExamHeader';
import QuestionCard from './QuestionCard';
import QuestionPalette from './QuestionPalette';

export default function ExamScreen({
  userName,
  userId,
  timerDisplay,
  questions,
  currentIndex,
  selectedAnswers,
  submittedAnswers,
  onSelectOption,
  onSelectQuestion,
  onPrevious,
  onNext,
  onSubmitAnswer,
  onSubmitExam,
  onShowRules,
  loading,
}) {
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const isCurrentAnswered = !!submittedAnswers[currentQ.id];
  const activeSelection =
    selectedAnswers[currentQ.id] !== undefined
      ? selectedAnswers[currentQ.id]
      : submittedAnswers[currentQ.id]?.selectedOption;

  const hasSelection = activeSelection !== undefined;

  return (
    <div className="exam-screen-container">
      <ExamHeader
        userName={userName}
        userId={userId}
        timerDisplay={timerDisplay}
        attemptedCount={Object.keys(submittedAnswers).length}
        totalQuestions={questions.length}
        onShowRules={onShowRules}
      />

      <div className="card-container exam-paper-card">
        <QuestionCard
          question={currentQ}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          isAnswered={isCurrentAnswered}
          selectedAnswer={activeSelection}
          onSelectOption={onSelectOption}
        />

        <div className="divider" style={{ margin: '24px 0 20px 0' }} />

        <QuestionPalette
          questions={questions}
          currentIndex={currentIndex}
          submittedAnswers={submittedAnswers}
          onSelectQuestion={onSelectQuestion}
          onPrevious={onPrevious}
          onNext={onNext}
          onSubmitAnswer={onSubmitAnswer}
          isCurrentAnswered={isCurrentAnswered}
          hasSelection={hasSelection}
          loading={loading}
        />
      </div>

      <div className="exam-finish-bar">
        <button
          className="btn btn-finish"
          onClick={onSubmitExam}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Finish & Submit Exam'}
        </button>
      </div>
    </div>
  );
}
