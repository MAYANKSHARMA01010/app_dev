import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to return data directly and format error messages
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  checkHealth: () => client.get('/'),
  startExam: (name, userId) => client.post('/exam/start', { name, userId }),
  getQuestions: () => client.get('/exam/mcq'),
  getQuestion: (id) => client.get(`/exam/mcq/${id}`),
  submitAnswer: (sessionId, questionId, selectedAnswer) =>
    client.post('/exam/answer', { sessionId, questionId, selectedAnswer }),
  getSession: (sessionId) => client.get(`/exam/session/${sessionId}`),
  submitExam: (sessionId) => client.post('/exam/submit', { sessionId }),
};
