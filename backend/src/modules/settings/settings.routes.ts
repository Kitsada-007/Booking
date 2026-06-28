import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import {
  listBankAccounts,
  createBankAccount,
  deleteBankAccount,
  getSettings,
  updateSettings,
} from './settings.service';

const router = Router();

// ─── Public: get resort settings ───
router.get('/', async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Failed to get settings', code: 'INTERNAL_ERROR' });
  }
});

// ─── Staff/Admin: update settings ───
const updateSettingsSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  facebook: z.string().optional(),
  line: z.string().optional(),
  businessHours: z.string().optional(),
  terms: z.string().optional(),
  boatOpenTime: z.string().optional(),
  boatCloseTime: z.string().optional(),
});

router.patch(
  '/',
  requireAuth,
  requireRole('admin', 'room_staff', 'boat_staff'),
  validate(updateSettingsSchema),
  async (req, res) => {
    try {
      const settings = await updateSettings(req.body);
      res.json(settings);
    } catch {
      res.status(500).json({ error: 'Failed to update settings', code: 'INTERNAL_ERROR' });
    }
  }
);

// ─── Admin: list bank accounts ───
router.get('/bank-accounts', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const accounts = await listBankAccounts();
    res.json(accounts);
  } catch {
    res.status(500).json({ error: 'Failed to list bank accounts', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: create bank account ───
const createBankSchema = z.object({
  bankName: z.string().min(1).max(100),
  accountName: z.string().min(1).max(200),
  accountNumber: z.string().min(1).max(50),
});

router.post('/bank-accounts', requireAuth, requireRole('admin'), validate(createBankSchema), async (req, res) => {
  try {
    const account = await createBankAccount(req.body);
    res.status(201).json(account);
  } catch {
    res.status(500).json({ error: 'Failed to create bank account', code: 'INTERNAL_ERROR' });
  }
});

// ─── Admin: delete bank account ───
router.delete('/bank-accounts/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await deleteBankAccount(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Delete failed';
    if (msg === 'Bank account not found') {
      res.status(404).json({ error: msg, code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete bank account', code: 'INTERNAL_ERROR' });
  }
});

export default router;
