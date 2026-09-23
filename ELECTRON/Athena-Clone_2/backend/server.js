const app = require('./src/app');
const { PORT } = require('./src/config/config');

app.listen(PORT, () => {
  console.log(`Exam backend running at http://localhost:${PORT}`);
});
