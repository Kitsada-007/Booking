import { Router } from 'express';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import {
  getRoomDailyReport, getRoomMonthlyReport, getRoomOccupancyReport,
  getBoatDailyReport, getBoatMonthlyReport, getBoatAvailabilityReport,
  getPackageUsageReport,
} from './reports.service';

const router = Router();

// ─── Room reports ───

router.get('/rooms/daily', requireAuth, requireRole('admin', 'room_staff'), async (req, res) => {
  try {
    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : new Date().toISOString().slice(0, 10);
    const result = await getRoomDailyReport(dateFrom, dateTo);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to generate daily report', code: 'INTERNAL_ERROR' });
  }
});

router.get('/rooms/monthly', requireAuth, requireRole('admin', 'room_staff'), async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const result = await getRoomMonthlyReport(year);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to generate monthly report', code: 'INTERNAL_ERROR' });
  }
});

router.get('/rooms/occupancy', requireAuth, requireRole('admin', 'room_staff'), async (req, res) => {
  try {
    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : new Date().toISOString().slice(0, 10);
    const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const result = await getRoomOccupancyReport(dateFrom, dateTo);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to generate occupancy report', code: 'INTERNAL_ERROR' });
  }
});

// ─── Boat reports ───

router.get('/boats/daily', requireAuth, requireRole('admin', 'boat_staff'), async (req, res) => {
  try {
    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : new Date().toISOString().slice(0, 10);
    const result = await getBoatDailyReport(dateFrom, dateTo);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to generate boat daily report', code: 'INTERNAL_ERROR' });
  }
});

router.get('/boats/monthly', requireAuth, requireRole('admin', 'boat_staff'), async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const result = await getBoatMonthlyReport(year);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to generate boat monthly report', code: 'INTERNAL_ERROR' });
  }
});

router.get('/boats/availability', requireAuth, requireRole('admin', 'boat_staff'), async (req, res) => {
  try {
    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : new Date().toISOString().slice(0, 10);
    const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const result = await getBoatAvailabilityReport(dateFrom, dateTo);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to generate boat availability report', code: 'INTERNAL_ERROR' });
  }
});

// ─── Package reports ───

router.get('/packages', requireAuth, requireRole('admin', 'room_staff'), async (req, res) => {
  try {
    const result = await getPackageUsageReport();
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to generate package usage report', code: 'INTERNAL_ERROR' });
  }
});

export default router;
