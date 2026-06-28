import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import {
  listTimeSlots,
  getTimeSlot,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
} from './schedules.service';

const router = Router();

const createSchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  maxBookings: z.number().int().positive(),
  boatTypeId: z.string().min(1),
});

const updateSchema = z.object({
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  maxBookings: z.number().int().positive().optional(),
  boatTypeId: z.string().min(1).optional(),
});

router.get('/', requireAuth, requireRole('admin', 'boat_staff'), async (req, res) => {
  try {
    const boatTypeId = typeof req.query.boatTypeId === 'string' ? req.query.boatTypeId : undefined;
    const slots = await listTimeSlots(boatTypeId);
    res.json(slots);
  } catch {
    res.status(500).json({ error: 'Failed to list time slots', code: 'INTERNAL_ERROR' });
  }
});

router.get('/:id', requireAuth, requireRole('admin', 'boat_staff'), async (req, res) => {
  try {
    const slot = await getTimeSlot(req.params.id as string);
    res.json(slot);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Not found';
    if (msg === 'Time slot not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to get time slot', code: 'INTERNAL_ERROR' });
  }
});

router.post('/', requireAuth, requireRole('admin', 'boat_staff'), validate(createSchema), async (req, res) => {
  try {
    const slot = await createTimeSlot(req.body);
    res.status(201).json(slot);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Create failed';
    if (msg === 'Boat type not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to create time slot', code: 'INTERNAL_ERROR' });
  }
});

router.patch('/:id', requireAuth, requireRole('admin', 'boat_staff'), validate(updateSchema), async (req, res) => {
  try {
    const slot = await updateTimeSlot(req.params.id as string, req.body);
    res.json(slot);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    if (msg === 'Time slot not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    if (msg === 'Boat type not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to update time slot', code: 'INTERNAL_ERROR' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin', 'boat_staff'), async (req, res) => {
  try {
    await deleteTimeSlot(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Delete failed';
    if (msg === 'Time slot not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to delete time slot', code: 'INTERNAL_ERROR' });
  }
});

export default router;
