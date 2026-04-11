import express from 'express';
import passport from 'passport';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { authLimiter } from '../../middlewares/rateLimit';
import auth from '../../middlewares/auth';

const router = express.Router();

const GOOGLE_OAUTH_ROLE_WHITELIST: Role[] = [
  Role.CUSTOMER,
  Role.PROVIDER,
  Role.MANAGER,
  Role.ORGANIZER,
];

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.get('/me', auth(), AuthController.getMe);
router.patch('/update-profile', auth(), AuthController.updateProfile);

// Google OAuth routes — pass desired signup role via ?role=MANAGER (echoed in OAuth state)
router.get('/google', (req, res, next) => {
  const raw = typeof req.query.role === 'string' ? req.query.role : undefined;
  const state =
    raw && GOOGLE_OAUTH_ROLE_WHITELIST.includes(raw as Role)
      ? raw
      : Role.CUSTOMER;
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/auth/google/failure'
  }),
  AuthController.googleAuthCallback
);

router.get('/google/failure', (req, res) => {
  res.status(401).json({
    success: false,
    statusCode: 401,
    message: 'Google authentication failed'
  });
});

export const AuthRoutes = router;
