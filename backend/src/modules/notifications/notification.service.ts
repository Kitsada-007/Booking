import { prisma } from '../../common/prisma';

const LINE_ENABLED = process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET;

export async function sendLineNotification(userId: string, message: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { lineId: true } });
  if (!user?.lineId) return;

  if (!LINE_ENABLED) {
    console.log(`[LINE MOCK] To ${user.lineId}: ${message}`);
    return;
  }

  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: user.lineId,
        messages: [{ type: 'text', text: message }],
      }),
    });
  } catch (error) {
    console.error('[LINE] Failed to send notification:', error);
  }
}

export async function notifyBookingCreated(userId: string, bookingType: 'room' | 'boat', details: { id: string; totalPrice: number }): Promise<void> {
  const label = bookingType === 'room' ? 'Room Booking' : 'Boat Booking';
  await sendLineNotification(
    userId,
    `[${label} Created]\nID: ${details.id.slice(-6).toUpperCase()}\nTotal: ฿${details.totalPrice.toLocaleString()}\nPlease complete payment to confirm.`
  );
}

export async function notifyBookingStatusChanged(userId: string, bookingType: 'room' | 'boat', details: { id: string; status: string }): Promise<void> {
  const label = bookingType === 'room' ? 'Room Booking' : 'Boat Booking';
  await sendLineNotification(
    userId,
    `[${label} Updated]\nID: ${details.id.slice(-6).toUpperCase()}\nStatus: ${details.status.replace(/_/g, ' ')}`
  );
}

export async function notifyReviewPrompt(userId: string, bookingType: 'room' | 'boat', bookingId: string): Promise<void> {
  const label = bookingType === 'room' ? 'room stay' : 'boat tour';
  await sendLineNotification(
    userId,
    `How was your ${label}? Leave a review for booking #${bookingId.slice(-6).toUpperCase()}!`
  );
}
