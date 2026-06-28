import { prisma } from '../../common/prisma';
import { notifyBookingCreated, notifyBookingStatusChanged, notifyReviewPrompt } from '../notifications/notification.service';

interface BookingCreateInput {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  quantity: number;
  guestCount: number;
  packageId?: string;
  paymentMethod: 'gateway' | 'bank_transfer';
}

interface BookingWithPayment {
  booking: Record<string, unknown>;
  payment: Record<string, unknown>;
}

function nights(checkIn: Date, checkOut: Date): number {
  return Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
}

export async function createRoomBooking(userId: string, input: BookingCreateInput): Promise<BookingWithPayment> {
  const roomType = await prisma.roomType.findUnique({ where: { id: input.roomTypeId } });
  if (!roomType) throw new Error('Room type not found');

  const checkInDate = new Date(input.checkIn);
  const checkOutDate = new Date(input.checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkInDate >= checkOutDate) {
    throw new Error('Invalid dates');
  }

  // Count rooms of this type
  const totalRooms = await prisma.room.count({ where: { roomTypeId: input.roomTypeId, status: 'available' } });
  if (totalRooms === 0) throw new Error('No rooms available for this type');

  // Count already booked rooms in the date range
  const bookedRooms = await prisma.roomBooking.aggregate({
    where: {
      roomTypeId: input.roomTypeId,
      status: { in: ['pending_payment', 'confirmed'] },
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    },
    _sum: { quantity: true },
  });

  const bookedCount = bookedRooms._sum.quantity ?? 0;
  const available = totalRooms - bookedCount;

  if (input.quantity > available) {
    throw new Error('Not enough rooms available');
  }

  const numNights = nights(checkInDate, checkOutDate);
  const totalPrice = roomType.price * input.quantity * numNights;

  const booking = await prisma.roomBooking.create({
    data: {
      userId,
      roomTypeId: input.roomTypeId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      quantity: input.quantity,
      guestCount: input.guestCount,
      totalPrice,
      status: 'pending_payment',
      packageId: input.packageId,
    },
    include: { roomType: true, payment: true },
  });

  // Create associated payment
  const payment = await prisma.payment.create({
    data: {
      roomBookingId: booking.id,
      amount: totalPrice,
      method: input.paymentMethod,
      status: 'pending',
    },
  });

  notifyBookingCreated(userId, 'room', { id: booking.id, totalPrice });

  return {
    booking: {
      ...booking,
      payment: undefined,
    },
    payment: {
      ...payment,
      ...(input.paymentMethod === 'bank_transfer'
        ? { bankAccounts: await prisma.bankAccount.findMany({ where: { isActive: true } }) }
        : { redirectUrl: `https://mock-gateway.example.com/pay/${payment.id}` }),
    },
  };
}

export async function listMyRoomBookings(userId: string, params: { status?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

  const where: Record<string, unknown> = { userId };
  if (params.status) where.status = params.status;

  const [data, totalItems] = await Promise.all([
    prisma.roomBooking.findMany({
      where,
      include: { roomType: true, payment: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.roomBooking.count({ where }),
  ]);

  return {
    data,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
}

export async function getRoomBooking(userId: string, bookingId: string) {
  const booking = await prisma.roomBooking.findFirst({
    where: { id: bookingId, userId },
    include: { roomType: true, payment: true },
  });

  if (!booking) throw new Error('Booking not found');
  return booking;
}

export async function cancelRoomBooking(userId: string, bookingId: string) {
  const booking = await prisma.roomBooking.findFirst({
    where: { id: bookingId, userId },
  });

  if (!booking) throw new Error('Booking not found');
  if (booking.status !== 'pending_payment') throw new Error('Booking cannot be cancelled');

  const updated = await prisma.roomBooking.update({
    where: { id: bookingId },
    data: { status: 'cancelled' },
    include: { roomType: true, payment: true },
  });

  notifyBookingStatusChanged(userId, 'room', { id: bookingId, status: 'cancelled' });
  return updated;
}

export async function completeRoomBooking(bookingId: string) {
  const booking = await prisma.roomBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.status !== 'confirmed') throw new Error('Only confirmed bookings can be completed');

  const updated = await prisma.roomBooking.update({
    where: { id: bookingId },
    data: { status: 'completed' },
    include: { roomType: true, payment: true },
  });

  notifyBookingStatusChanged(booking.userId, 'room', { id: bookingId, status: 'completed' });
  notifyReviewPrompt(booking.userId, 'room', bookingId);
  return updated;
}

// ─── Boat booking ───

interface BoatBookingCreateInput {
  boatTypeId: string;
  timeSlotId: string;
  date: string;
  boatCount: number;
  guestCount: number;
  paymentMethod: 'gateway' | 'bank_transfer';
}

export async function createBoatBooking(userId: string, input: BoatBookingCreateInput): Promise<BookingWithPayment> {
  const boatType = await prisma.boatType.findUnique({ where: { id: input.boatTypeId } });
  if (!boatType) throw new Error('Boat type not found');

  const timeSlot = await prisma.timeSlot.findUnique({ where: { id: input.timeSlotId } });
  if (!timeSlot || timeSlot.boatTypeId !== input.boatTypeId) throw new Error('Time slot not found');

  const bookingDate = new Date(input.date);
  if (isNaN(bookingDate.getTime())) throw new Error('Invalid date');

  // Count already booked boats for this slot + date
  const bookedAgg = await prisma.boatBooking.aggregate({
    where: {
      timeSlotId: input.timeSlotId,
      date: bookingDate,
      status: { in: ['pending_payment', 'confirmed'] },
    },
    _sum: { boatCount: true },
  });

  const bookedCount = bookedAgg._sum.boatCount ?? 0;
  const available = timeSlot.maxBookings - bookedCount;

  if (input.boatCount > available) throw new Error('Not enough capacity available');

  const totalPrice = boatType.price * input.boatCount;

  const booking = await prisma.boatBooking.create({
    data: {
      userId,
      boatTypeId: input.boatTypeId,
      timeSlotId: input.timeSlotId,
      date: bookingDate,
      boatCount: input.boatCount,
      guestCount: input.guestCount,
      totalPrice,
      status: 'pending_payment',
    },
    include: { boatType: true, timeSlot: true, payment: true },
  });

  const payment = await prisma.payment.create({
    data: {
      boatBookingId: booking.id,
      amount: totalPrice,
      method: input.paymentMethod,
      status: 'pending',
    },
  });

  notifyBookingCreated(userId, 'boat', { id: booking.id, totalPrice });

  return {
    booking: { ...booking, payment: undefined },
    payment: {
      ...payment,
      ...(input.paymentMethod === 'bank_transfer'
        ? { bankAccounts: await prisma.bankAccount.findMany({ where: { isActive: true } }) }
        : { redirectUrl: `https://mock-gateway.example.com/pay/${payment.id}` }),
    },
  };
}

export async function listMyBoatBookings(userId: string, params: { status?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

  const where: Record<string, unknown> = { userId };
  if (params.status) where.status = params.status;

  const [data, totalItems] = await Promise.all([
    prisma.boatBooking.findMany({
      where,
      include: { boatType: true, timeSlot: true, payment: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.boatBooking.count({ where }),
  ]);

  return {
    data,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
}

export async function getMyBoatBooking(userId: string, bookingId: string) {
  const booking = await prisma.boatBooking.findFirst({
    where: { id: bookingId, userId },
    include: { boatType: true, timeSlot: true, payment: true },
  });
  if (!booking) throw new Error('Booking not found');
  return booking;
}

export async function cancelMyBoatBooking(userId: string, bookingId: string) {
  const booking = await prisma.boatBooking.findFirst({ where: { id: bookingId, userId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.status !== 'pending_payment') throw new Error('Booking cannot be cancelled');

  const cancelled = await prisma.boatBooking.update({
    where: { id: bookingId },
    data: { status: 'cancelled' },
    include: { boatType: true, timeSlot: true, payment: true },
  });

  notifyBookingStatusChanged(userId, 'boat', { id: bookingId, status: 'cancelled' });
  return cancelled;
}

export async function completeBoatBooking(bookingId: string) {
  const booking = await prisma.boatBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.status !== 'confirmed') throw new Error('Only confirmed bookings can be completed');

  const updated = await prisma.boatBooking.update({
    where: { id: bookingId },
    data: { status: 'completed' },
    include: { boatType: true, timeSlot: true, payment: true },
  });

  notifyBookingStatusChanged(booking.userId, 'boat', { id: bookingId, status: 'completed' });
  notifyReviewPrompt(booking.userId, 'boat', bookingId);
  return updated;
}
