
import express from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';

import {
  getLabExerciseController,
  startLabController,
  submitLabController,
} from '../controllers/lab.controller.js';

const router = express.Router();

// Semua endpoint Lab wajib menggunakan autentikasi.
router.use(authMiddleware);

// Mengambil detail Lab.
router.get('/:labId', getLabExerciseController);

// Memulai atau melanjutkan Lab.
router.post('/:labId/start', startLabController);

// Mengirim kode untuk divalidasi backend.
router.post('/:labId/submit', submitLabController);

export default router;
