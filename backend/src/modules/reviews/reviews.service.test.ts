import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  review: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
  },
  roomBooking: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../../common/prisma', () => ({
  prisma: mockPrisma,
}));

const { listReviews, createReview } = await import('./reviews.service');

describe('ReviewsService.listReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated reviews with summary', async () => {
    const roomTypeId = 'rt-1';
    const mockReviews = [
      {
        id: 'r-1',
        rating: 5,
        comment: 'Great!',
        createdAt: new Date('2026-06-01'),
        user: { firstName: 'Alice', lastName: 'Smith' },
      },
      {
        id: 'r-2',
        rating: 4,
        comment: null,
        createdAt: new Date('2026-06-02'),
        user: { firstName: 'Bob', lastName: 'Jones' },
      },
    ];

    mockPrisma.review.findMany.mockResolvedValue(mockReviews);
    mockPrisma.review.count.mockResolvedValue(2);
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } });

    const result = await listReviews(roomTypeId, 1, 20);

    expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
      where: { roomTypeId },
      include: { user: { select: { firstName: true, lastName: true } } },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    expect(result).toEqual({
      data: [
        { id: 'r-1', rating: 5, comment: 'Great!', userName: 'Alice Smith', createdAt: mockReviews[0].createdAt },
        { id: 'r-2', rating: 4, comment: null, userName: 'Bob Jones', createdAt: mockReviews[1].createdAt },
      ],
      pagination: { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 },
      summary: { averageRating: 4.5, totalReviews: 2 },
    });
  });

  it('returns zero summary when no reviews exist', async () => {
    mockPrisma.review.findMany.mockResolvedValue([]);
    mockPrisma.review.count.mockResolvedValue(0);
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } });

    const result = await listReviews('rt-1', 1, 20);

    expect(result.summary).toEqual({ averageRating: 0, totalReviews: 0 });
    expect(result.data).toEqual([]);
  });
});

describe('ReviewsService.createReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const userId = 'user-1';
  const input = {
    roomTypeId: 'rt-1',
    bookingId: 'booking-1',
    rating: 5,
    comment: 'Amazing stay!',
  };

  it('creates a review for a completed booking', async () => {
    mockPrisma.roomBooking.findUnique.mockResolvedValue({
      id: 'booking-1',
      userId: 'user-1',
      status: 'completed',
      roomTypeId: 'rt-1',
    });
    mockPrisma.review.create.mockResolvedValue({
      id: 'rev-1',
      rating: 5,
      comment: 'Amazing stay!',
      createdAt: new Date('2026-06-15'),
      user: { firstName: 'Alice', lastName: 'Smith' },
    });

    const result = await createReview(userId, input);

    expect(mockPrisma.review.create).toHaveBeenCalledWith({
      data: {
        userId,
        roomTypeId: 'rt-1',
        bookingId: 'booking-1',
        rating: 5,
        comment: 'Amazing stay!',
      },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    expect(result).toEqual({
      id: 'rev-1',
      rating: 5,
      comment: 'Amazing stay!',
      userName: 'Alice Smith',
      createdAt: expect.any(Date),
    });
  });

  it('throws if booking not found or not owned by user', async () => {
    mockPrisma.roomBooking.findUnique.mockResolvedValue(null);
    await expect(createReview(userId, input)).rejects.toThrow('Booking not found');
  });

  it('throws if booking is not completed', async () => {
    mockPrisma.roomBooking.findUnique.mockResolvedValue({
      id: 'booking-1',
      userId: 'user-1',
      status: 'confirmed',
      roomTypeId: 'rt-1',
    });
    await expect(createReview(userId, input)).rejects.toThrow('Booking must be completed to review');
  });

  it('throws if room type mismatches', async () => {
    mockPrisma.roomBooking.findUnique.mockResolvedValue({
      id: 'booking-1',
      userId: 'user-1',
      status: 'completed',
      roomTypeId: 'rt-other',
    });
    await expect(createReview(userId, input)).rejects.toThrow('Room type mismatch');
  });

  it('throws if P2002 unique constraint fires (race condition or duplicate)', async () => {
    mockPrisma.roomBooking.findUnique.mockResolvedValue({
      id: 'booking-1',
      userId: 'user-1',
      status: 'completed',
      roomTypeId: 'rt-1',
    });
    mockPrisma.review.create.mockRejectedValue({ code: 'P2002' });
    await expect(createReview(userId, input)).rejects.toThrow('You have already reviewed this booking');
  });
});
