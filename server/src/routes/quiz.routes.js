import express from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';

import {
  getQuizByModuleController,
  getQuizHistoryController,
  startQuizController,
  submitQuizController,
  getQuizResultController,
} from '../controllers/quiz.controller.js';

const router = express.Router();

// Semua endpoint Quiz wajib menggunakan autentikasi.
router.use(authMiddleware);

// Mengambil Quiz berdasarkan module ID.
router.get(
  '/module/:moduleId',
  getQuizByModuleController
);

// Mengambil riwayat pengerjaan Quiz pengguna.
router.get(
  '/module/:moduleId/status',
  getQuizHistoryController
);

// Memulai atau melanjutkan Quiz.
router.post(
  '/module/:moduleId/start',
  startQuizController
);

// Mengumpulkan jawaban Quiz.
router.post(
  '/:attemptId/submit',
  submitQuizController
);

// Mengambil hasil Quiz.
router.get(
  '/:attemptId/result',
  getQuizResultController
);

export default router;