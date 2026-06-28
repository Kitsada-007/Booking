import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import roomTypeRoutes from './modules/room-types/room-types.routes';
import roomRoutes from './modules/rooms/rooms.routes';
import boatTypeRoutes from './modules/boat-types/boat-types.routes';
import boatRoutes from './modules/boats/boats.routes';
import settingsRoutes from './modules/settings/settings.routes';
import bookingRoutes from './modules/bookings/bookings.routes';
import paymentRoutes from './modules/payments/payments.routes';
import reviewRoutes from './modules/reviews/reviews.routes';
import staffRoutes from './modules/staff/staff.routes';
import scheduleRoutes from './modules/schedules/schedules.routes';
import packageRoutes from './modules/packages/packages.routes';
import reportRoutes from './modules/reports/reports.routes';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/boat-types', boatTypeRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/reports', reportRoutes);

export default app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
