const examService = require('../services/examService');

const examController = {
  startExam(req, res) {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        message: 'userId and name are required',
      });
    }

    try {
      const session = examService.startSession({ userId, name });
      return res.status(201).json({
        message: 'Exam session started',
        sessionId: session.sessionId,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message || 'Failed to start exam' });
    }
  },

  getAllQuestions(req, res) {
    try {
      const questions = examService.getAllStudentQuestions();
      return res.json(questions);
    } catch (err) {
      return res.status(500).json({ message: err.message || 'Failed to fetch questions' });
    }
  },

  getQuestionById(req, res) {
    try {
      const question = examService.getStudentQuestionById(req.params.id);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      return res.json(question);
    } catch (err) {
      return res.status(500).json({ message: err.message || 'Failed to fetch question' });
    }
  },

  submitAnswer(req, res) {
    const { sessionId, questionId, selectedAnswer } = req.body;

    if (!sessionId || questionId === undefined || selectedAnswer === undefined) {
      return res.status(400).json({
        message: 'sessionId, questionId and selectedAnswer are required',
      });
    }

    try {
      const result = examService.recordAnswer({
        sessionId,
        questionId,
        selectedAnswer,
      });

      return res.json({
        message: 'Answer saved',
        ...result,
      });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ message: err.message });
    }
  },

  getSessionProgress(req, res) {
    try {
      const session = examService.getSessionById(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      return res.json(session);
    } catch (err) {
      return res.status(500).json({ message: err.message || 'Failed to fetch session' });
    }
  },

  submitExam(req, res) {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    try {
      const result = examService.submitSession(sessionId);
      return res.json({
        message: 'Exam submitted successfully',
        result,
      });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ message: err.message });
    }
  },
};

module.exports = examController;
