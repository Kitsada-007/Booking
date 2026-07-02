import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../common/middleware/validate';
import { authRateLimiter } from '../../common/middleware/rate-limiter';
import { register, login, refreshTokens, forgotPassword, resetPassword, googleLogin } from './auth.service';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(9),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/google', authRateLimiter, async (req, res) => {
  try {
    const { googleToken } = req.body;
    if (!googleToken || typeof googleToken !== 'string') {
      res.status(400).json({ error: 'Google token is required', code: 'VALIDATION_ERROR' });
      return;
    }
    const result = await googleLogin(googleToken);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google login failed';
    if (message === 'Invalid Google token') {
      res.status(401).json({ error: message, code: 'UNAUTHORIZED' });
      return;
    }
    res.status(500).json({ error: 'Google login failed', code: 'INTERNAL_ERROR' });
  }
});

router.post('/register', authRateLimiter, validate(registerSchema), async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    if (message === 'Email already in use') {
      res.status(409).json({ error: message, code: 'CONFLICT' });
      return;
    }
    res.status(500).json({ error: 'Registration failed', code: 'INTERNAL_ERROR' });
  }
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post('/forgot-password', authRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required', code: 'VALIDATION_ERROR' });
      return;
    }
    const result = await forgotPassword(email);
    res.json({ message: result });
  } catch {
    res.status(500).json({ error: 'Failed to send OTP', code: 'INTERNAL_ERROR' });
  }
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});

router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), async (req, res) => {
  try {
    const result = await resetPassword(req.body);
    res.json({ message: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reset failed';
    if (message === 'Invalid or expired OTP') {
      res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
      return;
    }
    res.status(500).json({ error: 'Password reset failed', code: 'INTERNAL_ERROR' });
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res) => {
  try {
    const result = await refreshTokens(req.body.refreshToken);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refresh failed';
    if (message === 'Invalid refresh token' || message === 'User not found') {
      res.status(401).json({ error: message, code: 'UNAUTHORIZED' });
      return;
    }
    res.status(500).json({ error: 'Refresh failed', code: 'INTERNAL_ERROR' });
  }
});

router.post('/login', authRateLimiter, validate(loginSchema), async (req, res) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    if (message === 'Invalid email or password' || message === 'Account is inactive') {
      res.status(401).json({ error: message, code: 'UNAUTHORIZED' });
      return;
    }
    res.status(500).json({ error: 'Login failed', code: 'INTERNAL_ERROR' });
  }
});

export default router;
