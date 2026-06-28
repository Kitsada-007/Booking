import { prisma } from '../../common/prisma';
import type { Prisma, BookingStatus } from '../../generated/prisma/client';
import { z } from 'zod';

type BookingWhere = Prisma.RoomBookingWhereInput;

export const statusUpdateSchema = z.object({
  status: z.enum(['checked_in', 'completed', 'cancelled']),
});

export async function listAllRoomBookings(params: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const where: BookingWhere = {};

  if (params.status) {
    where.status = params.status as BookingStatus;
  }

  if (params.dateFrom || params.dateTo) {
    const checkInFilter: Prisma.DateTimeFilter = {};
    if (params.dateFrom) checkInFilter.gte = new Date(params.dateFrom);
    if (params.dateTo) checkInFilter.lte = new Date(params.dateTo);
    where.checkIn = checkInFilter;
  }

  if (params.search) {
    where.OR = [
      { id: params.search },
      { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
      { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const [data, totalItems] = await Promise.all([
    prisma.roomBooking.findMany({
      where,
      include: {
        roomType: true,
        payment: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
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

const allowedTransitions: Record<string, string[]> = {
  pending_payment: ['cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['completed', 'cancelled'],
};

export async function updateRoomBookingStatus(bookingId: string, newStatus: string) {
  const booking = await prisma.roomBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');

  const allowed = allowedTransitions[booking.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${booking.status} to ${newStatus}`);
  }

  return prisma.roomBooking.update({
    where: { id: bookingId },
    data: { status: newStatus as BookingStatus },
    include: {
      roomType: true,
      payment: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

export async function getRoomBookingDetail(bookingId: string) {
  const booking = await prisma.roomBooking.findUnique({
    where: { id: bookingId },
    include: {
      roomType: true,
      payment: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  if (!booking) throw new Error('Booking not found');
  return booking;
}

export const reviewReplySchema = z.object({
  staffReply: z.string().min(1).max(500),
});

export async function respondToReview(reviewId: string, staffReply: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error('Review not found');

  return prisma.review.update({
    where: { id: reviewId },
    data: { staffReply },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function listReviewsByBooking(bookingId: string) {
  return prisma.review.findMany({
    where: { bookingId },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });
}

// ─── Boat staff ───

export const boatStatusUpdateSchema = z.object({
  status: z.enum(['completed', 'cancelled']),
});

export async function listAllBoatBookings(params: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const where: Record<string, unknown> = {};

  if (params.status) where.status = params.status;

  if (params.dateFrom || params.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (params.dateFrom) dateFilter.gte = new Date(params.dateFrom);
    if (params.dateTo) dateFilter.lte = new Date(params.dateTo);
    where.date = dateFilter;
  }

  if (params.search) {
    where.OR = [
      { id: params.search },
      { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
      { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const [data, totalItems] = await Promise.all([
    prisma.boatBooking.findMany({
      where: where as Prisma.BoatBookingWhereInput,
      include: {
        boatType: true,
        timeSlot: true,
        payment: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.boatBooking.count({ where: where as Prisma.BoatBookingWhereInput }),
  ]);

  return {
    data,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
}

export async function getBoatBookingDetail(bookingId: string) {
  const booking = await prisma.boatBooking.findUnique({
    where: { id: bookingId },
    include: {
      boatType: true,
      timeSlot: true,
      payment: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  if (!booking) throw new Error('Booking not found');
  return booking;
}

const boatAllowedTransitions: Record<string, string[]> = {
  pending_payment: ['cancelled'],
  confirmed: ['completed', 'cancelled'],
};

export async function updateBoatBookingStatus(bookingId: string, newStatus: string) {
  const booking = await prisma.boatBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');

  const allowed = boatAllowedTransitions[booking.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${booking.status} to ${newStatus}`);
  }

  return prisma.boatBooking.update({
    where: { id: bookingId },
    data: { status: newStatus as BookingStatus },
    include: {
      boatType: true,
      timeSlot: true,
      payment: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}
