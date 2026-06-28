import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import { listRooms, createRoom, updateRoom, deleteRoom } from './rooms.service';

const router = Router();

// ─── Admin: list rooms ───
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const rooms = await listRooms({
      roomTypeId: typeof req.query.roomTypeId === 'string' ? req.query.roomTypeId : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
    });
    res.json(rooms);
  } catch {
    res.status(500).json({ error: 'Failed to list rooms', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: create room ───
const createSchema = z.object({
  roomNumber: z.string().min(1).max(50),
  roomTypeId: z.string().min(1),
  description: z.string().optional(),
});

router.post('/', requireAuth, requireRole('admin'), validate(createSchema), async (req, res) => {
  try {
    const room = await createRoom(req.body);
    res.status(201).json(room);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create room';
    if (message === 'Room type not found') {
      res.status(404).json({ error: message, code: 'NOT_FOUND' });
      return;
    }
    if (message === 'Room number already exists for this room type') {
      res.status(409).json({ error: message, code: 'CONFLICT' });
      return;
    }
    res.status(500).json({ error: 'Failed to create room', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: update room ───
const updateSchema = z.object({
  roomNumber: z.string().min(1).max(50).optional(),
  roomTypeId: z.string().min(1).optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  description: z.string().optional(),
});

router.patch('/:id', requireAuth, requireRole('admin'), validate(updateSchema), async (req, res) => {
  try {
    const room = await updateRoom(req.params.id as string, req.body);
    res.json(room);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update room';
    if (message === 'Room not found') {
      res.status(404).json({ error: message, code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Failed to update room', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: delete room ───
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await deleteRoom(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete room';
    if (message === 'Room not found') {
      res.status(404).json({ error: message, code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete room', code: 'INTERNAL_ERROR' });
  }
});

export default router;
