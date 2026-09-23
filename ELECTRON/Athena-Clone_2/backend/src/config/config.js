const path = require('path');

const PORT = process.env.PORT || 3000;
const dataDir = path.resolve(__dirname, '..', '..', 'data');

module.exports = {
  PORT,
  questionsPath: path.join(dataDir, 'questions.json'),
  sessionsPath: path.join(dataDir, 'sessions.json'),
};
