import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import {
  createRoomBooking,
  listMyRoomBookings,
  getRoomBooking,
  cancelRoomBooking,
  completeRoomBooking,
} from './bookings.service';

const router = Router();

// ─── Create room booking (member) ───
const createRoomSchema = z.object({
  roomTypeId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  quantity: z.number().int().positive(),
  guestCount: z.number().int().positive(),
  packageId: z.string().optional(),
  paymentMethod: z.enum(['gateway', 'bank_transfer']),
});

router.post(
  '/rooms',
  requireAuth,
  requireRole('member'),
  validate(createRoomSchema),
  async (req, res) => {
    try {
      const result = await createRoomBooking(req.user!.userId, req.body);
      res.status(201).json(result);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Booking failed';
      if (msg === 'Room type not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
      if (msg === 'Not enough rooms available' || msg === 'Invalid dates' || msg === 'No rooms available for this type') {
        res.status(400).json({ error: msg, code: 'VALIDATION_ERROR' }); return;
      }
      res.status(500).json({ error: 'Failed to create booking', code: 'INTERNAL_ERROR' });
    }
  }
);

// ─── List my room bookings ───
router.get('/rooms', requireAuth, requireRole('member'), async (req, res) => {
  try {
    const result = await listMyRoomBookings(req.user!.userId, {
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      page: Number(req.query.page) || undefined,
      pageSize: Number(req.query.pageSize) || undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to list bookings', code: 'INTERNAL_ERROR' });
  }
});

// ─── Get room booking detail ───
router.get('/rooms/:id', requireAuth, requireRole('member'), async (req, res) => {
  try {
    const booking = await getRoomBooking(req.user!.userId, req.params.id as string);
    res.json(booking);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Not found';
    if (msg === 'Booking not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to get booking', code: 'INTERNAL_ERROR' });
  }
});

// ─── Cancel room booking (member) ───
router.patch('/rooms/:id/cancel', requireAuth, requireRole('member'), async (req, res) => {
  try {
    const booking = await cancelRoomBooking(req.user!.userId, req.params.id as string);
    res.json(booking);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Cancel failed';
    if (msg === 'Booking not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    if (msg === 'Booking cannot be cancelled') { res.status(400).json({ error: msg, code: 'VALIDATION_ERROR' }); return; }
    res.status(500).json({ error: 'Failed to cancel booking', code: 'INTERNAL_ERROR' });
  }
});

// ─── Complete room booking (staff) ───
// ─── Complete room booking (staff) ───
router.patch('/rooms/:id/complete', requireAuth, requireRole('admin', 'room_staff'), async (req, res) => {
  try {
    const booking = await completeRoomBooking(req.params.id as string);
    res.json(booking);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Complete failed';
    if (msg === 'Booking not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    if (msg === 'Only confirmed bookings can be completed') { res.status(400).json({ error: msg, code: 'VALIDATION_ERROR' }); return; }
    res.status(500).json({ error: msg, code: 'INTERNAL_ERROR' });
  }
});

export default router;
