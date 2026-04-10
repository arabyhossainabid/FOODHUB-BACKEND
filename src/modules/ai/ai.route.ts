import express from 'express';
import { AiController } from './ai.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { apiLimiter } from '../../middlewares/rateLimit';

const router = express.Router();

// General Chatbot (Authenticated users)
router.post('/chat', apiLimiter, AiController.chat);

// Meal Description Generator (Providers and Admins only)
router.post('/generate-description', auth(Role.PROVIDER, Role.ADMIN), AiController.generateMealDescription);

export const AiRoutes = router;
