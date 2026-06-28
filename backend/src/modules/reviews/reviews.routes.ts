import { Router } from 'express';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import { listReviews, createReview, createReviewSchema } from './reviews.service';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const roomTypeId = typeof req.query.roomTypeId === 'string' ? req.query.roomTypeId : '';
    if (!roomTypeId) {
      res.status(400).json({ error: 'roomTypeId query param is required', code: 'VALIDATION_ERROR' });
      return;
    }
    const result = await listReviews(
      roomTypeId,
      Number(req.query.page) || 1,
      Number(req.query.pageSize) || 20
    );
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to list reviews', code: 'INTERNAL_ERROR' });
  }
});

router.post('/', requireAuth, requireRole('member'), validate(createReviewSchema), async (req, res) => {
  try {
    const review = await createReview(req.user!.userId, req.body);
    res.status(201).json(review);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Review failed';
    if (msg === 'Booking not found') { res.status(404).json({ error: msg, code: 'NOT_FOUND' }); return; }
    if (msg === 'Booking must be completed to review' || msg === 'Room type mismatch' || msg === 'You have already reviewed this booking') {
      res.status(400).json({ error: msg, code: 'VALIDATION_ERROR' }); return;
    }
    res.status(500).json({ error: 'Failed to create review', code: 'INTERNAL_ERROR' });
  }
});

export default router;
