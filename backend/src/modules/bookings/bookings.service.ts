import { prisma } from '../../common/prisma';

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

  return prisma.roomBooking.update({
    where: { id: bookingId },
    data: { status: 'cancelled' },
    include: { roomType: true, payment: true },
  });
}

export async function completeRoomBooking(bookingId: string) {
  const booking = await prisma.roomBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.status !== 'confirmed') throw new Error('Only confirmed bookings can be completed');

  return prisma.roomBooking.update({
    where: { id: bookingId },
    data: { status: 'completed' },
    include: { roomType: true, payment: true },
  });
}
