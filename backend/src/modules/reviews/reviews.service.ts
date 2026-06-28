import { prisma } from '../../common/prisma';
import { z } from 'zod';

export const createReviewSchema = z.object({
  roomTypeId: z.string().min(1),
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function listReviews(roomTypeId: string, page = 1, pageSize = 20) {
  const [data, totalItems] = await Promise.all([
    prisma.review.findMany({
      where: { roomTypeId },
      include: { user: { select: { firstName: true, lastName: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where: { roomTypeId } }),
  ]);

  const aggregate = await prisma.review.aggregate({
    where: { roomTypeId },
    _avg: { rating: true },
  });

  return {
    data: data.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      userName: `${r.user.firstName} ${r.user.lastName}`,
      createdAt: r.createdAt,
    })),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
    summary: {
      averageRating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      totalReviews: totalItems,
    },
  };
}

export async function createReview(userId: string, input: z.infer<typeof createReviewSchema>) {
  const booking = await prisma.roomBooking.findUnique({ where: { id: input.bookingId } });
  if (!booking || booking.userId !== userId) throw new Error('Booking not found');
  if (booking.status !== 'completed') throw new Error('Booking must be completed to review');
  if (booking.roomTypeId !== input.roomTypeId) throw new Error('Room type mismatch');

  const review = await prisma.review.create({
    data: {
      userId,
      roomTypeId: input.roomTypeId,
      bookingId: input.bookingId,
      rating: input.rating,
      comment: input.comment,
    },
    include: { user: { select: { firstName: true, lastName: true } } },
  }).catch((error: { code?: string }) => {
    if (error.code === 'P2002') throw new Error('You have already reviewed this booking');
    throw error;
  });

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    userName: `${review.user.firstName} ${review.user.lastName}`,
    createdAt: review.createdAt,
  };
}
