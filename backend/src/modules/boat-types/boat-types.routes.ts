import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import {
  listBoatTypes,
  getBoatType,
  createBoatType,
  updateBoatType,
  deleteBoatType,
} from './boat-types.service';

const router = Router();

// ─── Public: list ───
router.get('/', async (req, res) => {
  try {
    const result = await listBoatTypes({
      page: Number(req.query.page) || undefined,
      pageSize: Number(req.query.pageSize) || undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to list boat types', code: 'INTERNAL_ERROR' });
  }
});

// ─── Public: get ───
router.get('/:id', async (req, res) => {
  try {
    const boatType = await getBoatType(req.params.id as string);
    res.json(boatType);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Not found';
    if (msg === 'Boat type not found') {
      res.status(404).json({ error: msg, code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Failed to get boat type', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: create ───
const createSchema = z.object({
  name: z.string().min(1).max(200),
  capacity: z.number().int().positive(),
  seats: z.number().int().positive(),
  price: z.number().positive(),
  durationMinutes: z.number().int().positive(),
  images: z.array(z.string()).max(2).optional(),
});

router.post('/', requireAuth, requireRole('admin'), validate(createSchema), async (req, res) => {
  try {
    const boatType = await createBoatType(req.body);
    res.status(201).json(boatType);
  } catch {
    res.status(500).json({ error: 'Failed to create boat type', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: update ───
const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  capacity: z.number().int().positive().optional(),
  seats: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  durationMinutes: z.number().int().positive().optional(),
  images: z.array(z.string()).max(2).optional(),
});

router.patch('/:id', requireAuth, requireRole('admin'), validate(updateSchema), async (req, res) => {
  try {
    const boatType = await updateBoatType(req.params.id as string, req.body);
    res.json(boatType);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    if (msg === 'Boat type not found') {
      res.status(404).json({ error: msg, code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Failed to update boat type', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: delete ───
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await deleteBoatType(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Delete failed';
    if (msg === 'Boat type not found') {
      res.status(404).json({ error: msg, code: 'NOT_FOUND' });
      return;
    }
    if (msg === 'Cannot delete boat type with existing boats') {
      res.status(409).json({ error: msg, code: 'CONFLICT' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete boat type', code: 'INTERNAL_ERROR' });
  }
});

export default router;
