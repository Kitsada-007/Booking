import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import { getPayment, uploadSlip, verifyPayment } from './payments.service';

const router = Router();

// ─── Get payment info ───
router.get('/:bookingId', requireAuth, async (req, res) => {
  try {
    const bookingType = (req.query.bookingType as string) as 'room' | 'boat';
    if (!bookingType || !['room', 'boat'].includes(bookingType)) {
      res.status(400).json({ error: 'bookingType query param required (room or boat)', code: 'VALIDATION_ERROR' });
      return;
    }
    const payment = await getPayment(
      req.user!.userId,
      req.user!.role,
      req.params.bookingId as string,
      bookingType
    );
    res.json(payment);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Not found';
    if (msg === 'Payment not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to get payment', code: 'INTERNAL_ERROR' });
  }
});

// ─── Upload payment slip ───
const uploadSlipSchema = z.object({
  bookingId: z.string().min(1),
  bookingType: z.enum(['room', 'boat']),
  slipUrl: z.string().min(1),
});

router.post('/slip', requireAuth, validate(uploadSlipSchema), async (req, res) => {
  try {
    const payment = await uploadSlip(req.user!.userId, req.body);
    res.json({ message: 'Slip uploaded, pending verification', payment });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Upload failed';
    if (msg === 'Payment not found' || msg === 'Booking not found') {
      res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return;
    }
    res.status(500).json({ error: 'Failed to upload slip', code: 'INTERNAL_ERROR' });
  }
});

// ─── Verify payment (staff) ───
const verifySchema = z.object({
  verified: z.boolean(),
});

router.patch('/:id/verify', requireAuth, requireRole('admin', 'room_staff', 'boat_staff'), validate(verifySchema), async (req, res) => {
  try {
    const payment = await verifyPayment(req.params.id as string, req.body.verified, req.user!.userId);
    res.json(payment);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Verification failed';
    if (msg === 'Payment not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to verify payment', code: 'INTERNAL_ERROR' });
  }
});

export default router;
