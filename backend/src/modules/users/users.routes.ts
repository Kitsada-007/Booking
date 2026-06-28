import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import {
  listUsers,
  createStaff,
  updateStaff,
  getProfile,
  updateProfile,
  changePassword,
} from './users.service';

const router = Router();

// ─── Admin: list staff users ───
router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const result = await listUsers({
        page: Number(req.query.page) || undefined,
        pageSize: Number(req.query.pageSize) || undefined,
        role: typeof req.query.role === 'string' ? req.query.role : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
      });
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Failed to list users', code: 'INTERNAL_ERROR' });
    }
  }
);

// ─── Admin: create staff ───
const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['room_staff', 'boat_staff']),
  status: z.enum(['active', 'inactive']),
});

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate(createStaffSchema),
  async (req, res) => {
    try {
      const user = await createStaff(req.body);
      res.status(201).json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      if (message === 'Email already in use') {
        res.status(409).json({ error: message, code: 'CONFLICT' });
        return;
      }
      res.status(500).json({ error: 'Failed to create user', code: 'INTERNAL_ERROR' });
    }
  }
);

// ─── Admin: update staff ───
const updateStaffSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  role: z.enum(['room_staff', 'boat_staff']).optional(),
});

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(updateStaffSchema),
  async (req, res) => {
    try {
      const user = await updateStaff(req.params.id as string, req.body);
      res.json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      if (message === 'User not found') {
        res.status(404).json({ error: message, code: 'NOT_FOUND' });
        return;
      }
      res.status(500).json({ error: 'Failed to update user', code: 'INTERNAL_ERROR' });
    }
  }
);

// ─── Me: get profile ───
router.get(
  '/me',
  requireAuth,
  async (req, res) => {
    try {
      const user = await getProfile(req.user!.userId);
      res.json(user);
    } catch {
      res.status(500).json({ error: 'Failed to get profile', code: 'INTERNAL_ERROR' });
    }
  }
);

// ─── Me: update profile ───
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  lineId: z.string().optional(),
  facebook: z.string().optional(),
  profileImage: z.string().optional(),
});

router.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  async (req, res) => {
    try {
      const user = await updateProfile(req.user!.userId, req.body);
      res.json(user);
    } catch {
      res.status(500).json({ error: 'Failed to update profile', code: 'INTERNAL_ERROR' });
    }
  }
);

// ─── Me: change password ───
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.patch(
  '/me/password',
  requireAuth,
  validate(changePasswordSchema),
  async (req, res) => {
    try {
      const message = await changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
      res.json({ message });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      if (message === 'Current password is incorrect') {
        res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
        return;
      }
      if (message === 'Cannot change password for this account') {
        res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
        return;
      }
      res.status(500).json({ error: 'Failed to change password', code: 'INTERNAL_ERROR' });
    }
  }
);

export default router;
