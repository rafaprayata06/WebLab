
import express from 'express';
import cors from 'cors';
import pool from './config/database.js';

import authRoutes from './routes/auth.routes.js';
import learningRoutes from './routes/learning.routes.js';
import labRoutes from './routes/lab.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WebLab API is running!',
  });
});

// Database Test
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.status(200).json({
      success: true,
      message: 'PostgreSQL connected successfully!',
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).json({
      success: false,
      message: 'PostgreSQL connection failed!',
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/onboarding', onboardingRoutes);

export default app;
