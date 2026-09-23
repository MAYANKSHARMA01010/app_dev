const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// Start exam session
router.post('/start', examController.startExam);

// Get all MCQs
router.get('/mcq', examController.getAllQuestions);

// Get one MCQ by ID
router.get('/mcq/:id', examController.getQuestionById);

// Submit one answer
router.post('/answer', examController.submitAnswer);

// Get session progress
router.get('/session/:sessionId', examController.getSessionProgress);

// Submit whole exam
router.post('/submit', examController.submitExam);

module.exports = router;
