
import express from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';

import {
  getModulesController,
  getModuleDetailController,
  startSubmoduleController,
  completeLessonController,
  getSubmoduleProgressController,
  updateReadingProgressController,
} from '../controllers/learning.controller.js';

const router = express.Router();

// Semua endpoint learning wajib menggunakan autentikasi.
router.use(authMiddleware);

// =========================================
// MODULE
// =========================================

// Mengambil seluruh modul beserta progres user.
router.get('/modules', getModulesController);

// Mengambil detail modul beserta submodul, materi, lab, dan progres.
router.get('/modules/:moduleId', getModuleDetailController);

// =========================================
// SUBMODULE PROGRESS
// =========================================

// Memulai atau melanjutkan submodul.
router.post(
  '/submodules/:submoduleId/start',
  startSubmoduleController
);

// Menandai materi sebagai selesai.
router.post(
  '/submodules/:submoduleId/complete-lesson',
  completeLessonController
);

// Mengambil progres submodul.
router.get(
  '/submodules/:submoduleId/progress',
  getSubmoduleProgressController
);

// Memperbarui progres membaca materi.
router.patch(
  '/submodules/:submoduleId/reading-progress',
  updateReadingProgressController
);

export default router;
