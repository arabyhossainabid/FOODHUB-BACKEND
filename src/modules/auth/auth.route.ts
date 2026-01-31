import express from 'express';
import passport from 'passport';
import { AuthController } from './auth.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', auth(), AuthController.getMe);

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
