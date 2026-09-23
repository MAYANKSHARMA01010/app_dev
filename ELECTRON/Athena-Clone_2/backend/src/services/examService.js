const fs = require('fs');
const { questionsPath, sessionsPath } = require('../config/config');

function readQuestions() {
  return JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
}

function readSessions() {
  return JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
}

function saveSessions(sessions) {
  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
}

function makeSessionId() {
  return `session-${Date.now()}`;
}

function formatQuestionForStudent(question) {
  return {
    id: question.id,
    question: question.question,
    options: question.options,
  };
}

const examService = {
  startSession({ userId, name }) {
    const sessions = readSessions();
    const session = {
      sessionId: makeSessionId(),
      userId,
      name,
      startedAt: new Date().toISOString(),
      submittedAt: null,
      status: 'in-progress',
      attempted: 0,
      correct: 0,
      wrong: 0,
      answers: [],
    };

    sessions.push(session);
    saveSessions(sessions);
    return session;
  },

  getAllStudentQuestions() {
    const questions = readQuestions();
    return questions.map(formatQuestionForStudent);
  },

  getStudentQuestionById(id) {
    const questions = readQuestions();
    const question = questions.find((item) => item.id === Number(id));
    if (!question) return null;
    return formatQuestionForStudent(question);
  },

  recordAnswer({ sessionId, questionId, selectedAnswer }) {
    const questions = readQuestions();
    const sessions = readSessions();

    const question = questions.find((item) => item.id === Number(questionId));
    if (!question) {
      const err = new Error('Question not found');
      err.status = 404;
      throw err;
    }

    const session = sessions.find((item) => item.sessionId === sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.status = 404;
      throw err;
    }

    if (session.status !== 'in-progress') {
      const err = new Error('Exam is already submitted');
      err.status = 400;
      throw err;
    }

    const alreadyAnswered = session.answers.find(
      (answer) => answer.questionId === Number(questionId)
    );
    if (alreadyAnswered) {
      const err = new Error('Question already answered');
      err.status = 400;
      throw err;
    }

    const isCorrect = Number(selectedAnswer) === question.correctAnswer;

    session.answers.push({
      questionId: question.id,
      selectedAnswer: Number(selectedAnswer),
      isCorrect,
      answeredAt: new Date().toISOString(),
    });

    session.attempted += 1;
    if (isCorrect) {
      session.correct += 1;
    } else {
      session.wrong += 1;
    }

    saveSessions(sessions);

    return {
      isCorrect,
      attempted: session.attempted,
      correct: session.correct,
      wrong: session.wrong,
    };
  },

  getSessionById(sessionId) {
    const sessions = readSessions();
    return sessions.find((item) => item.sessionId === sessionId) || null;
  },

  submitSession(sessionId) {
    const sessions = readSessions();
    const session = sessions.find((item) => item.sessionId === sessionId);

    if (!session) {
      const err = new Error('Session not found');
      err.status = 404;
      throw err;
    }

    session.status = 'submitted';
    session.submittedAt = new Date().toISOString();
    saveSessions(sessions);

    return {
      attempted: session.attempted,
      correct: session.correct,
      wrong: session.wrong,
    };
  },
};

module.exports = examService;
