import { Router } from 'express';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import { listAllRoomBookings, getRoomBookingDetail, updateRoomBookingStatus, statusUpdateSchema, respondToReview, reviewReplySchema, listReviewsByBooking, listAllBoatBookings, getBoatBookingDetail, updateBoatBookingStatus, boatStatusUpdateSchema } from './staff.service';

const router = Router();

router.get('/room-bookings/:id', requireAuth, requireRole('admin', 'room_staff'), async (req, res) => {
  try {
    const booking = await getRoomBookingDetail(req.params.id as string);
    res.json(booking);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Not found';
    if (msg === 'Booking not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to get booking', code: 'INTERNAL_ERROR' });
  }
});

router.get('/room-bookings', requireAuth, requireRole('admin', 'room_staff'), async (req, res) => {
  try {
    const result = await listAllRoomBookings({
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      dateFrom: typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined,
      dateTo: typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      page: Number(req.query.page) || undefined,
      pageSize: Number(req.query.pageSize) || undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to list bookings', code: 'INTERNAL_ERROR' });
  }
});

router.patch('/room-bookings/:id/status', requireAuth, requireRole('admin', 'room_staff'), validate(statusUpdateSchema), async (req, res) => {
  try {
    const booking = await updateRoomBookingStatus(req.params.id as string, req.body.status);
    res.json(booking);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    if (msg === 'Booking not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    if (msg.startsWith('Cannot transition')) { res.status(400).json({ error: msg, code: 'VALIDATION_ERROR' }); return; }
    res.status(500).json({ error: 'Failed to update status', code: 'INTERNAL_ERROR' });
  }
});

router.get('/reviews', requireAuth, requireRole('admin', 'room_staff'), async (req, res) => {
  try {
    const bookingId = typeof req.query.bookingId === 'string' ? req.query.bookingId : '';
    if (!bookingId) { res.status(400).json({ error: 'bookingId query param required', code: 'VALIDATION_ERROR' }); return; }
    const reviews = await listReviewsByBooking(bookingId);
    res.json(reviews);
  } catch {
    res.status(500).json({ error: 'Failed to list reviews', code: 'INTERNAL_ERROR' });
  }
});

router.patch('/reviews/:id/reply', requireAuth, requireRole('admin', 'room_staff'), validate(reviewReplySchema), async (req, res) => {
  try {
    const review = await respondToReview(req.params.id as string, req.body.staffReply);
    res.json(review);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Reply failed';
    if (msg === 'Review not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to reply to review', code: 'INTERNAL_ERROR' });
  }
});

// ─── Boat bookings ───

router.get('/boat-bookings/:id', requireAuth, requireRole('admin', 'boat_staff'), async (req, res) => {
  try {
    const booking = await getBoatBookingDetail(req.params.id as string);
    res.json(booking);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Not found';
    if (msg === 'Booking not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    res.status(500).json({ error: 'Failed to get booking', code: 'INTERNAL_ERROR' });
  }
});

router.get('/boat-bookings', requireAuth, requireRole('admin', 'boat_staff'), async (req, res) => {
  try {
    const result = await listAllBoatBookings({
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      dateFrom: typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined,
      dateTo: typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      page: Number(req.query.page) || undefined,
      pageSize: Number(req.query.pageSize) || undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to list boat bookings', code: 'INTERNAL_ERROR' });
  }
});

router.patch('/boat-bookings/:id/status', requireAuth, requireRole('admin', 'boat_staff'), validate(boatStatusUpdateSchema), async (req, res) => {
  try {
    const booking = await updateBoatBookingStatus(req.params.id as string, req.body.status);
    res.json(booking);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    if (msg === 'Booking not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    if (msg.startsWith('Cannot transition')) { res.status(400).json({ error: msg, code: 'VALIDATION_ERROR' }); return; }
    res.status(500).json({ error: 'Failed to update status', code: 'INTERNAL_ERROR' });
  }
});

export default router;
