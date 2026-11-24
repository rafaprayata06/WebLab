import express from 'express';

import {
  getOnboardingStatus,
  completeOnboarding,
} from '../controllers/onboarding.controller.js';

import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/status', authMiddleware, getOnboardingStatus);

router.patch('/complete', authMiddleware, completeOnboarding);

export default router;