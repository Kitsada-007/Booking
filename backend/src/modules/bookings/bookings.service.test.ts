import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  roomType: { findUnique: vi.fn() },
  room: { count: vi.fn() },
  roomBooking: {
    aggregate: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  payment: { create: vi.fn() },
  bankAccount: { findMany: vi.fn() },
  boatType: { findUnique: vi.fn() },
  timeSlot: { findUnique: vi.fn() },
  boatBooking: {
    aggregate: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../common/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../notifications/notification.service', () => ({
  notifyBookingCreated: vi.fn(),
  notifyBookingStatusChanged: vi.fn(),
  notifyReviewPrompt: vi.fn(),
}));

const {
  createRoomBooking,
  listMyRoomBookings,
  getRoomBooking,
  cancelRoomBooking,
  completeRoomBooking,
  createBoatBooking,
  listMyBoatBookings,
  getMyBoatBooking,
  cancelMyBoatBooking,
  completeBoatBooking,
} = await import('./bookings.service');

const mockRoomType = {
  id: 'rt-1',
  name: 'Deluxe Room',
  price: 1500,
  capacity: 2,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockBooking = {
  id: 'b-1',
  userId: 'user-1',
  roomTypeId: 'rt-1',
  checkIn: new Date('2026-07-01'),
  checkOut: new Date('2026-07-03'),
  quantity: 1,
  guestCount: 2,
  totalPrice: 3000,
  status: 'pending_payment' as const,
  packageId: null,
  createdAt: new Date('2026-06-30'),
  updatedAt: new Date('2026-06-30'),
  roomType: mockRoomType,
  payment: null,
};

const mockPayment = {
  id: 'p-1',
  roomBookingId: 'b-1',
  boatBookingId: null,
  amount: 3000,
  method: 'gateway' as const,
  status: 'pending' as const,
  slipUrl: null,
  verifiedBy: null,
  verifiedAt: null,
  createdAt: new Date('2026-06-30'),
};

const mockBankAccounts = [
  { id: 'ba-1', bankName: 'SCB', accountName: 'Resort Co', accountNumber: '123-4-56789-0', isActive: true },
];

const mockTimeSlot = {
  id: 'ts-1',
  startTime: '09:00',
  endTime: '12:00',
  maxBookings: 5,
  boatTypeId: 'bt-1',
};

const mockBoatType = {
  id: 'bt-1',
  name: 'Speed Boat',
  capacity: 10,
  seats: 8,
  price: 3000,
  durationMinutes: 180,
  images: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockBoatBooking = {
  id: 'bb-1',
  userId: 'user-1',
  boatTypeId: 'bt-1',
  timeSlotId: 'ts-1',
  date: new Date('2026-07-05'),
  boatCount: 1,
  guestCount: 4,
  totalPrice: 3000,
  status: 'pending_payment' as const,
  createdAt: new Date('2026-06-30'),
  updatedAt: new Date('2026-06-30'),
  boatType: mockBoatType,
  timeSlot: mockTimeSlot,
  payment: null,
};

const mockBoatPayment = {
  id: 'p-2',
  roomBookingId: null,
  boatBookingId: 'bb-1',
  amount: 3000,
  method: 'gateway' as const,
  status: 'pending' as const,
  slipUrl: null,
  verifiedBy: null,
  verifiedAt: null,
  createdAt: new Date('2026-06-30'),
};

// ──────────────────────────────────────────────────
// Room booking tests
// ──────────────────────────────────────────────────

describe('BookingsService.createRoomBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput = {
    roomTypeId: 'rt-1',
    checkIn: '2026-07-01',
    checkOut: '2026-07-03',
    quantity: 1,
    guestCount: 2,
    paymentMethod: 'gateway' as const,
  };

  it('creates a room booking with gateway payment', async () => {
    mockPrisma.roomType.findUnique.mockResolvedValue(mockRoomType);
    mockPrisma.room.count.mockResolvedValue(5);
    mockPrisma.roomBooking.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
    mockPrisma.roomBooking.create.mockResolvedValue(mockBooking);
    mockPrisma.payment.create.mockResolvedValue(mockPayment);

    const result = await createRoomBooking('user-1', validInput);

    expect(mockPrisma.roomType.findUnique).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
    expect(mockPrisma.room.count).toHaveBeenCalledWith({ where: { roomTypeId: 'rt-1', status: 'available' } });
    expect(mockPrisma.roomBooking.aggregate).toHaveBeenCalledWith({
      where: {
        roomTypeId: 'rt-1',
        status: { in: ['pending_payment', 'confirmed'] },
        checkIn: { lt: mockBooking.checkOut },
        checkOut: { gt: mockBooking.checkIn },
      },
      _sum: { quantity: true },
    });
    expect(mockPrisma.roomBooking.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        roomTypeId: 'rt-1',
        checkIn: mockBooking.checkIn,
        checkOut: mockBooking.checkOut,
        quantity: 1,
        guestCount: 2,
        totalPrice: 3000,
        status: 'pending_payment',
        packageId: undefined,
      },
      include: { roomType: true, payment: true },
    });
    expect(mockPrisma.payment.create).toHaveBeenCalledWith({
      data: {
        roomBookingId: 'b-1',
        amount: 3000,
        method: 'gateway',
        status: 'pending',
      },
    });

    expect(result.booking).toEqual({ ...mockBooking, payment: undefined });
    expect(result.payment).toEqual({ ...mockPayment, redirectUrl: `https://mock-gateway.example.com/pay/p-1` });
  });

  it('creates a room booking with bank transfer and returns bank accounts', async () => {
    mockPrisma.roomType.findUnique.mockResolvedValue(mockRoomType);
    mockPrisma.room.count.mockResolvedValue(5);
    mockPrisma.roomBooking.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
    mockPrisma.roomBooking.create.mockResolvedValue(mockBooking);
    mockPrisma.payment.create.mockResolvedValue(mockPayment);
    mockPrisma.bankAccount.findMany.mockResolvedValue(mockBankAccounts);

    const result = await createRoomBooking('user-1', { ...validInput, paymentMethod: 'bank_transfer' });

    expect(mockPrisma.bankAccount.findMany).toHaveBeenCalledWith({ where: { isActive: true } });
    expect(result.payment).toEqual({ ...mockPayment, bankAccounts: mockBankAccounts });
  });

  it('throws if room type not found', async () => {
    mockPrisma.roomType.findUnique.mockResolvedValue(null);
    await expect(createRoomBooking('user-1', validInput)).rejects.toThrow('Room type not found');
  });

  it('throws if dates are invalid', async () => {
    mockPrisma.roomType.findUnique.mockResolvedValue(mockRoomType);
    await expect(
      createRoomBooking('user-1', { ...validInput, checkIn: 'invalid', checkOut: '2026-07-03' })
    ).rejects.toThrow('Invalid dates');
  });

  it('throws if checkIn >= checkOut', async () => {
    mockPrisma.roomType.findUnique.mockResolvedValue(mockRoomType);
    await expect(
      createRoomBooking('user-1', { ...validInput, checkIn: '2026-07-05', checkOut: '2026-07-03' })
    ).rejects.toThrow('Invalid dates');
  });

  it('throws if no rooms available for this type', async () => {
    mockPrisma.roomType.findUnique.mockResolvedValue(mockRoomType);
    mockPrisma.room.count.mockResolvedValue(0);
    await expect(createRoomBooking('user-1', validInput)).rejects.toThrow('No rooms available for this type');
  });

  it('throws if not enough rooms available', async () => {
    mockPrisma.roomType.findUnique.mockResolvedValue(mockRoomType);
    mockPrisma.room.count.mockResolvedValue(2);
    mockPrisma.roomBooking.aggregate.mockResolvedValue({ _sum: { quantity: 2 } });
    await expect(
      createRoomBooking('user-1', { ...validInput, quantity: 2 })
    ).rejects.toThrow('Not enough rooms available');
  });
});

describe('BookingsService.listMyRoomBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated room bookings', async () => {
    const mockBookings = [{ ...mockBooking, payment: mockPayment }];
    mockPrisma.roomBooking.findMany.mockResolvedValue(mockBookings);
    mockPrisma.roomBooking.count.mockResolvedValue(1);

    const result = await listMyRoomBookings('user-1', { page: 1, pageSize: 20 });

    expect(mockPrisma.roomBooking.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { roomType: true, payment: true },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual({
      data: mockBookings,
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
  });

  it('filters by status', async () => {
    mockPrisma.roomBooking.findMany.mockResolvedValue([]);
    mockPrisma.roomBooking.count.mockResolvedValue(0);

    await listMyRoomBookings('user-1', { status: 'confirmed' });

    expect(mockPrisma.roomBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', status: 'confirmed' } })
    );
  });

  it('applies default pagination', async () => {
    mockPrisma.roomBooking.findMany.mockResolvedValue([]);
    mockPrisma.roomBooking.count.mockResolvedValue(0);

    await listMyRoomBookings('user-1', {});

    expect(mockPrisma.roomBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });
});

describe('BookingsService.getRoomBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a room booking owned by the user', async () => {
    mockPrisma.roomBooking.findFirst.mockResolvedValue({ ...mockBooking, payment: mockPayment });

    const result = await getRoomBooking('user-1', 'b-1');

    expect(mockPrisma.roomBooking.findFirst).toHaveBeenCalledWith({
      where: { id: 'b-1', userId: 'user-1' },
      include: { roomType: true, payment: true },
    });
    expect(result).toEqual({ ...mockBooking, payment: mockPayment });
  });

  it('throws if booking not found', async () => {
    mockPrisma.roomBooking.findFirst.mockResolvedValue(null);
    await expect(getRoomBooking('user-1', 'b-1')).rejects.toThrow('Booking not found');
  });
});

describe('BookingsService.cancelRoomBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels a pending_payment room booking', async () => {
    mockPrisma.roomBooking.findFirst.mockResolvedValue(mockBooking);
    mockPrisma.roomBooking.update.mockResolvedValue({ ...mockBooking, status: 'cancelled', payment: mockPayment });

    const result = await cancelRoomBooking('user-1', 'b-1');

    expect(mockPrisma.roomBooking.update).toHaveBeenCalledWith({
      where: { id: 'b-1' },
      data: { status: 'cancelled' },
      include: { roomType: true, payment: true },
    });
    expect(result.status).toBe('cancelled');
  });

  it('throws if booking not found', async () => {
    mockPrisma.roomBooking.findFirst.mockResolvedValue(null);
    await expect(cancelRoomBooking('user-1', 'b-1')).rejects.toThrow('Booking not found');
  });

  it('throws if booking is not pending_payment', async () => {
    mockPrisma.roomBooking.findFirst.mockResolvedValue({ ...mockBooking, status: 'confirmed' });
    await expect(cancelRoomBooking('user-1', 'b-1')).rejects.toThrow('Booking cannot be cancelled');
  });
});

describe('BookingsService.completeRoomBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes a confirmed room booking', async () => {
    mockPrisma.roomBooking.findUnique.mockResolvedValue({ ...mockBooking, status: 'confirmed' });
    mockPrisma.roomBooking.update.mockResolvedValue({ ...mockBooking, status: 'completed', payment: mockPayment });

    const result = await completeRoomBooking('b-1');

    expect(mockPrisma.roomBooking.update).toHaveBeenCalledWith({
      where: { id: 'b-1' },
      data: { status: 'completed' },
      include: { roomType: true, payment: true },
    });
    expect(result.status).toBe('completed');
  });

  it('throws if booking not found', async () => {
    mockPrisma.roomBooking.findUnique.mockResolvedValue(null);
    await expect(completeRoomBooking('b-1')).rejects.toThrow('Booking not found');
  });

  it('throws if booking is not confirmed', async () => {
    mockPrisma.roomBooking.findUnique.mockResolvedValue({ ...mockBooking, status: 'pending_payment' });
    await expect(completeRoomBooking('b-1')).rejects.toThrow('Only confirmed bookings can be completed');
  });
});

// ──────────────────────────────────────────────────
// Boat booking tests
// ──────────────────────────────────────────────────

describe('BookingsService.createBoatBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput = {
    boatTypeId: 'bt-1',
    timeSlotId: 'ts-1',
    date: '2026-07-05',
    boatCount: 1,
    guestCount: 4,
    paymentMethod: 'gateway' as const,
  };

  it('creates a boat booking with gateway payment', async () => {
    mockPrisma.boatType.findUnique.mockResolvedValue(mockBoatType);
    mockPrisma.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
    mockPrisma.boatBooking.aggregate.mockResolvedValue({ _sum: { boatCount: 0 } });
    mockPrisma.boatBooking.create.mockResolvedValue(mockBoatBooking);
    mockPrisma.payment.create.mockResolvedValue(mockBoatPayment);

    const result = await createBoatBooking('user-1', validInput);

    expect(mockPrisma.boatType.findUnique).toHaveBeenCalledWith({ where: { id: 'bt-1' } });
    expect(mockPrisma.timeSlot.findUnique).toHaveBeenCalledWith({ where: { id: 'ts-1' } });
    expect(mockPrisma.boatBooking.aggregate).toHaveBeenCalledWith({
      where: {
        timeSlotId: 'ts-1',
        date: mockBoatBooking.date,
        status: { in: ['pending_payment', 'confirmed'] },
      },
      _sum: { boatCount: true },
    });
    expect(mockPrisma.boatBooking.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        boatTypeId: 'bt-1',
        timeSlotId: 'ts-1',
        date: mockBoatBooking.date,
        boatCount: 1,
        guestCount: 4,
        totalPrice: 3000,
        status: 'pending_payment',
      },
      include: { boatType: true, timeSlot: true, payment: true },
    });
    expect(mockPrisma.payment.create).toHaveBeenCalledWith({
      data: {
        boatBookingId: 'bb-1',
        amount: 3000,
        method: 'gateway',
        status: 'pending',
      },
    });

    expect(result.booking).toEqual({ ...mockBoatBooking, payment: undefined });
    expect(result.payment).toEqual({
      ...mockBoatPayment,
      redirectUrl: `https://mock-gateway.example.com/pay/p-2`,
    });
  });

  it('creates a boat booking with bank transfer and returns bank accounts', async () => {
    mockPrisma.boatType.findUnique.mockResolvedValue(mockBoatType);
    mockPrisma.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
    mockPrisma.boatBooking.aggregate.mockResolvedValue({ _sum: { boatCount: 0 } });
    mockPrisma.boatBooking.create.mockResolvedValue(mockBoatBooking);
    mockPrisma.payment.create.mockResolvedValue(mockBoatPayment);
    mockPrisma.bankAccount.findMany.mockResolvedValue(mockBankAccounts);

    const result = await createBoatBooking('user-1', { ...validInput, paymentMethod: 'bank_transfer' });

    expect(mockPrisma.bankAccount.findMany).toHaveBeenCalledWith({ where: { isActive: true } });
    expect(result.payment).toEqual({ ...mockBoatPayment, bankAccounts: mockBankAccounts });
  });

  it('throws if boat type not found', async () => {
    mockPrisma.boatType.findUnique.mockResolvedValue(null);
    await expect(createBoatBooking('user-1', validInput)).rejects.toThrow('Boat type not found');
  });

  it('throws if time slot not found', async () => {
    mockPrisma.boatType.findUnique.mockResolvedValue(mockBoatType);
    mockPrisma.timeSlot.findUnique.mockResolvedValue(null);
    await expect(createBoatBooking('user-1', validInput)).rejects.toThrow('Time slot not found');
  });

  it('throws if time slot belongs to different boat type', async () => {
    mockPrisma.boatType.findUnique.mockResolvedValue(mockBoatType);
    mockPrisma.timeSlot.findUnique.mockResolvedValue({ ...mockTimeSlot, boatTypeId: 'bt-other' });
    await expect(createBoatBooking('user-1', validInput)).rejects.toThrow('Time slot not found');
  });

  it('throws if date is invalid', async () => {
    mockPrisma.boatType.findUnique.mockResolvedValue(mockBoatType);
    mockPrisma.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
    await expect(
      createBoatBooking('user-1', { ...validInput, date: 'not-a-date' })
    ).rejects.toThrow('Invalid date');
  });

  it('throws if not enough capacity available', async () => {
    mockPrisma.boatType.findUnique.mockResolvedValue(mockBoatType);
    mockPrisma.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
    mockPrisma.boatBooking.aggregate.mockResolvedValue({ _sum: { boatCount: 5 } });
    await expect(createBoatBooking('user-1', validInput)).rejects.toThrow('Not enough capacity available');
  });
});

describe('BookingsService.listMyBoatBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated boat bookings', async () => {
    const mockBookings = [{ ...mockBoatBooking, payment: mockBoatPayment }];
    mockPrisma.boatBooking.findMany.mockResolvedValue(mockBookings);
    mockPrisma.boatBooking.count.mockResolvedValue(1);

    const result = await listMyBoatBookings('user-1', { page: 1, pageSize: 10 });

    expect(mockPrisma.boatBooking.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { boatType: true, timeSlot: true, payment: true },
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual({
      data: mockBookings,
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('filters by status', async () => {
    mockPrisma.boatBooking.findMany.mockResolvedValue([]);
    mockPrisma.boatBooking.count.mockResolvedValue(0);

    await listMyBoatBookings('user-1', { status: 'confirmed' });

    expect(mockPrisma.boatBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', status: 'confirmed' } })
    );
  });
});

describe('BookingsService.getMyBoatBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a boat booking owned by the user', async () => {
    mockPrisma.boatBooking.findFirst.mockResolvedValue({ ...mockBoatBooking, payment: mockBoatPayment });

    const result = await getMyBoatBooking('user-1', 'bb-1');

    expect(mockPrisma.boatBooking.findFirst).toHaveBeenCalledWith({
      where: { id: 'bb-1', userId: 'user-1' },
      include: { boatType: true, timeSlot: true, payment: true },
    });
    expect(result).toEqual({ ...mockBoatBooking, payment: mockBoatPayment });
  });

  it('throws if booking not found', async () => {
    mockPrisma.boatBooking.findFirst.mockResolvedValue(null);
    await expect(getMyBoatBooking('user-1', 'bb-1')).rejects.toThrow('Booking not found');
  });
});

describe('BookingsService.cancelMyBoatBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels a pending_payment boat booking', async () => {
    mockPrisma.boatBooking.findFirst.mockResolvedValue(mockBoatBooking);
    mockPrisma.boatBooking.update.mockResolvedValue({ ...mockBoatBooking, status: 'cancelled', payment: mockBoatPayment });

    const result = await cancelMyBoatBooking('user-1', 'bb-1');

    expect(mockPrisma.boatBooking.update).toHaveBeenCalledWith({
      where: { id: 'bb-1' },
      data: { status: 'cancelled' },
      include: { boatType: true, timeSlot: true, payment: true },
    });
    expect(result.status).toBe('cancelled');
  });

  it('throws if booking not found', async () => {
    mockPrisma.boatBooking.findFirst.mockResolvedValue(null);
    await expect(cancelMyBoatBooking('user-1', 'bb-1')).rejects.toThrow('Booking not found');
  });

  it('throws if booking is not pending_payment', async () => {
    mockPrisma.boatBooking.findFirst.mockResolvedValue({ ...mockBoatBooking, status: 'confirmed' });
    await expect(cancelMyBoatBooking('user-1', 'bb-1')).rejects.toThrow('Booking cannot be cancelled');
  });
});

describe('BookingsService.completeBoatBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes a confirmed boat booking', async () => {
    mockPrisma.boatBooking.findUnique.mockResolvedValue({ ...mockBoatBooking, status: 'confirmed' });
    mockPrisma.boatBooking.update.mockResolvedValue({ ...mockBoatBooking, status: 'completed', payment: mockBoatPayment });

    const result = await completeBoatBooking('bb-1');

    expect(mockPrisma.boatBooking.update).toHaveBeenCalledWith({
      where: { id: 'bb-1' },
      data: { status: 'completed' },
      include: { boatType: true, timeSlot: true, payment: true },
    });
    expect(result.status).toBe('completed');
  });

  it('throws if booking not found', async () => {
    mockPrisma.boatBooking.findUnique.mockResolvedValue(null);
    await expect(completeBoatBooking('bb-1')).rejects.toThrow('Booking not found');
  });

  it('throws if booking is not confirmed', async () => {
    mockPrisma.boatBooking.findUnique.mockResolvedValue({ ...mockBoatBooking, status: 'pending_payment' });
    await expect(completeBoatBooking('bb-1')).rejects.toThrow('Only confirmed bookings can be completed');
  });
});
