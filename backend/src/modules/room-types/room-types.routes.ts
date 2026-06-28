import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import {
  listRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from './room-types.service';

const router = Router();

// ─── Public: list room types ───
router.get('/', async (req, res) => {
  try {
      const result = await listRoomTypes({
        page: Number(req.query.page) || undefined,
        pageSize: Number(req.query.pageSize) || undefined,
        checkIn: typeof req.query.checkIn === 'string' ? req.query.checkIn : undefined,
      });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to list room types', code: 'INTERNAL_ERROR' });
  }
});

// ─── Public: get room type ───
router.get('/:id', async (req, res) => {
  try {
    const roomType = await getRoomType(req.params.id as string);
    res.json(roomType);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Not found';
    if (message === 'Room type not found') {
      res.status(404).json({ error: message, code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Failed to get room type', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: create room type ───
const createSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  capacity: z.number().int().positive(),
  bedSize: z.string().optional(),
  bedCount: z.number().int().positive().optional(),
  hasAircon: z.boolean().optional(),
  hasTv: z.boolean().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).max(5).optional(),
});

router.post('/', requireAuth, requireRole('admin'), validate(createSchema), async (req, res) => {
  try {
    const roomType = await createRoomType(req.body);
    res.status(201).json(roomType);
  } catch {
    res.status(500).json({ error: 'Failed to create room type', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: update room type ───
const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().positive().optional(),
  capacity: z.number().int().positive().optional(),
  bedSize: z.string().optional(),
  bedCount: z.number().int().positive().optional(),
  hasAircon: z.boolean().optional(),
  hasTv: z.boolean().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).max(5).optional(),
});

router.patch('/:id', requireAuth, requireRole('admin'), validate(updateSchema), async (req, res) => {
  try {
    const roomType = await updateRoomType(req.params.id as string, req.body);
    res.json(roomType);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    if (message === 'Room type not found') {
      res.status(404).json({ error: message, code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Failed to update room type', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: delete room type ───
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await deleteRoomType(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    if (message === 'Room type not found') {
      res.status(404).json({ error: message, code: 'NOT_FOUND' });
      return;
    }
    if (message === 'Cannot delete room type with existing rooms') {
      res.status(409).json({ error: message, code: 'CONFLICT' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete room type', code: 'INTERNAL_ERROR' });
  }
});

export default router;
