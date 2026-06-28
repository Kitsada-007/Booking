import { prisma } from '../../common/prisma';

export async function getPayment(bookingId: string, bookingType: 'room' | 'boat') {
  const where = bookingType === 'room'
    ? { roomBookingId: bookingId }
    : { boatBookingId: bookingId };

  const payment = await prisma.payment.findFirst({ where });
  if (!payment) throw new Error('Payment not found');
  return payment;
}

export async function uploadSlip(
  userId: string,
  input: { bookingId: string; bookingType: 'room' | 'boat'; slipUrl: string }
) {
  const where = input.bookingType === 'room'
    ? { roomBookingId: input.bookingId }
    : { boatBookingId: input.bookingId };

  const payment = await prisma.payment.findFirst({ where });

  if (!payment) throw new Error('Payment not found');

  // Verify the booking belongs to this user
  if (input.bookingType === 'room') {
    const booking = await prisma.roomBooking.findUnique({ where: { id: input.bookingId } });
    if (!booking || booking.userId !== userId) throw new Error('Booking not found');
  } else {
    const booking = await prisma.boatBooking.findUnique({ where: { id: input.bookingId } });
    if (!booking || booking.userId !== userId) throw new Error('Booking not found');
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { slipUrl: input.slipUrl, status: 'pending' },
  });

  return updated;
}

export async function verifyPayment(paymentId: string, verified: boolean, verifiedBy: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error('Payment not found');

  const status = verified ? 'verified' : 'rejected';

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status, verifiedBy, verifiedAt: new Date() },
  });

  if (verified && payment.roomBookingId) {
    await prisma.roomBooking.update({
      where: { id: payment.roomBookingId },
      data: { status: 'confirmed' },
    });
  }

  if (verified && payment.boatBookingId) {
    await prisma.boatBooking.update({
      where: { id: payment.boatBookingId },
      data: { status: 'confirmed' },
    });
  }

  return updated;
}
