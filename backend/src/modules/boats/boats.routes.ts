import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import { listBoats, createBoat, updateBoat, deleteBoat } from './boats.service';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const boats = await listBoats({
      boatTypeId: typeof req.query.boatTypeId === 'string' ? req.query.boatTypeId : undefined,
    });
    res.json(boats);
  } catch {
    res.status(500).json({ error: 'Failed to list boats', code: 'INTERNAL_ERROR' });
  }
});

const createSchema = z.object({
  boatNumber: z.string().min(1).max(50),
  boatTypeId: z.string().min(1),
});

router.post('/', requireAuth, requireRole('admin'), validate(createSchema), async (req, res) => {
  try {
    const boat = await createBoat(req.body);
    res.status(201).json(boat);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create boat';
    if (msg === 'Boat type not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    if (msg === 'Boat number already exists for this boat type') { res.status(409).json({ error: msg, code: 'CONFLICT' }); return; }
    res.status(500).json({ error: 'Failed to create boat', code: 'INTERNAL_ERROR' });
  }
});

const updateSchema = z.object({
  boatNumber: z.string().min(1).max(50).optional(),
  boatTypeId: z.string().min(1).optional(),
});

router.patch('/:id', requireAuth, requireRole('admin'), validate(updateSchema), async (req, res) => {
  try {
    const boat = await updateBoat(req.params.id as string, req.body);
    res.json(boat);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update boat';
    if (msg === 'Boat not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to update boat', code: 'INTERNAL_ERROR' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await deleteBoat(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete boat';
    if (msg === 'Boat not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to delete boat', code: 'INTERNAL_ERROR' });
  }
});

export default router;
