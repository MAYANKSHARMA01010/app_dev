const express = require('express');
const router = express.Router();
const examRoutes = require('./examRoutes');

// Root health check endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Exam backend is running' });
});

// Exam endpoints mounted on /exam
router.use('/exam', examRoutes);

module.exports = router;
