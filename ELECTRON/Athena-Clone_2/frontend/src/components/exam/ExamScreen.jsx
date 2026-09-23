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
  mediaStream,
  loading,
}) {
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const isCurrentAnswered = !!submittedAnswers[currentQ.id];
  const hasSelection = selectedAnswers[currentQ.id] !== undefined;

  return (
    <>
      <ExamHeader
        userName={userName}
        userId={userId}
        timerDisplay={timerDisplay}
        attemptedCount={Object.keys(submittedAnswers).length}
        totalQuestions={questions.length}
        onShowRules={onShowRules}
        mediaStream={mediaStream}
      />

      <div className="card-container">
        <QuestionCard
          question={currentQ}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          isAnswered={isCurrentAnswered}
          selectedAnswer={selectedAnswers[currentQ.id]}
          onSelectOption={onSelectOption}
        />

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

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-finish"
          onClick={onSubmitExam}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Finish & Submit Exam'}
        </button>
      </div>
    </>
  );
}
