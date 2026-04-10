import express from 'express';
import passport from 'passport';
import { AuthController } from './auth.controller';
import { authLimiter } from '../../middlewares/rateLimit';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.get('/me', auth(), AuthController.getMe);
router.patch('/update-profile', auth(), AuthController.updateProfile);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

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
