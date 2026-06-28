'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { BookingStatusBadge } from '@/components/BookingStatusBadge';

interface DetailPageProps { params: Promise<{ id: string }> }

interface StaffReview {
  id: string;
  rating: number;
  comment?: string;
  staffReply?: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

export default function StaffBookingDetailPage(props: DetailPageProps) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!user || (user.role !== 'admin' && user.role !== 'room_staff')) { setLoading(false); return; }
      try {
        const { id } = await props.params;
        const [bookingData, reviewsData] = await Promise.all([
          apiClient.get<Record<string, unknown>>(`/staff/room-bookings/${id}`),
          apiClient.get<StaffReview[]>(`/staff/reviews?bookingId=${id}`).catch(() => []),
        ]);
        setBooking(bookingData);
        setReviews(reviewsData);
      } catch { setError('Booking not found'); }
      setLoading(false);
    };
    load();
  }, [user, props.params]);

  async function updateStatus(status: string) {
    if (!confirm(`Mark this booking as ${status.replace('_', ' ')}?`)) return;
    try {
      const updated = await apiClient.patch<Record<string, unknown>>(`/staff/room-bookings/${(await props.params).id}/status`, { status });
      setBooking(updated);
    } catch { setError('Failed to update status'); }
  }

  async function submitReply(reviewId: string, reply: string) {
    await apiClient.patch(`/staff/reviews/${reviewId}/reply`, { staffReply: reply });
    setReviews(reviews.map((r) => r.id === reviewId ? { ...r, staffReply: reply } : r));
  }

  const payment = booking?.payment as Record<string, unknown> | undefined;

  if (!user || (user.role !== 'admin' && user.role !== 'room_staff')) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">Access Denied</div>;
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8 text-zinc-400">Loading...</div>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-8 text-red-600">{error}</div>;
  if (!booking) return <div className="mx-auto max-w-3xl px-4 py-8 text-red-600">Booking not found</div>;

  const bUser = booking.user as Record<string, unknown> | undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/staff/room/bookings" className="text-sm text-zinc-500 hover:text-zinc-900">&larr; Back to bookings</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Booking #{String(booking.id as string).slice(-6).toUpperCase()}</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-500 mb-3">Booking Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Status</span><BookingStatusBadge status={booking.status as string} /></div>
            <div className="flex justify-between"><span className="text-zinc-500">Room type</span><span className="font-medium">{(booking.roomType as Record<string, unknown>)?.name as string}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Check-in</span><span>{new Date(booking.checkIn as string).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Check-out</span><span>{new Date(booking.checkOut as string).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Rooms</span><span>{booking.quantity as number}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Guests</span><span>{booking.guestCount as number}</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-zinc-100"><span>Total</span><span>฿{(booking.totalPrice as number).toLocaleString()}</span></div>
          </div>
        </div>

        {bUser && (
          <div className="rounded border border-zinc-200 p-4">
            <h2 className="text-sm font-semibold text-zinc-500 mb-3">Customer</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-zinc-500">Name</span><p className="font-medium">{bUser.firstName as string} {bUser.lastName as string}</p></div>
              <div><span className="text-zinc-500">Email</span><p className="font-medium">{bUser.email as string}</p></div>
              {!!bUser.phone && <div><span className="text-zinc-500">Phone</span><p className="font-medium">{bUser.phone as string}</p></div>}
            </div>
          </div>
        )}

        {!!payment && (
          <div className="rounded border border-zinc-200 p-4">
            <h2 className="text-sm font-semibold text-zinc-500 mb-3">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Method</span><span className="capitalize font-medium">{String(payment.method).replace('_', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className={`font-medium capitalize ${payment.status === 'verified' ? 'text-green-600' : payment.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>{payment.status as string}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span>฿{(payment.amount as number).toLocaleString()}</span></div>
              {!!payment.slipUrl && (
                <div><span className="text-zinc-500">Slip</span><br /><a href={payment.slipUrl as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">View slip</a></div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status actions */}
      <div className="mt-6 flex gap-3">
        {booking.status === 'confirmed' && (
          <button onClick={() => updateStatus('checked_in')} className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
            Check in
          </button>
        )}
        {booking.status === 'checked_in' && (
          <button onClick={() => updateStatus('completed')} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Check out
          </button>
        )}
        {(booking.status === 'pending_payment' || booking.status === 'confirmed' || booking.status === 'checked_in') && (
          <button onClick={() => updateStatus('cancelled')} className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            Cancel booking
          </button>
        )}
      </div>

      {/* Reviews section */}
      {reviews.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Guest Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onReply={submitReply} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, onReply }: { review: StaffReview; onReply: (id: string, reply: string) => Promise<void> }) {
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setReplying(true);
    try {
      await onReply(review.id, reply.trim());
      setDone(true);
    } catch { /* ignore */ }
    setReplying(false);
  }

  return (
    <div className="rounded border border-zinc-200 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{review.user.firstName} {review.user.lastName}</span>
        <span className="text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
      </div>
      {review.comment && <p className="mt-2 text-sm text-zinc-600">{review.comment}</p>}

      {review.staffReply && (
        <div className="mt-3 rounded bg-zinc-50 p-3 text-sm">
          <span className="font-medium text-zinc-500">Staff response:</span>
          <p className="mt-1 text-zinc-700">{review.staffReply}</p>
        </div>
      )}

      {!review.staffReply && !done && (
        <form onSubmit={handleSubmit} className="mt-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            maxLength={500}
            className="block w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <button type="submit" disabled={replying || !reply.trim()} className="mt-2 rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {replying ? 'Sending...' : 'Reply'}
          </button>
        </form>
      )}

      {done && <p className="mt-2 text-xs text-green-600">Reply submitted.</p>}
    </div>
  );
}
