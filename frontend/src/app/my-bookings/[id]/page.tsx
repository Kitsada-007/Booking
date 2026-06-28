'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { ReviewForm } from '@/components/ReviewForm';

interface DetailPageProps { params: Promise<{ id: string }> }

export default function BookingDetailPage(props: DetailPageProps) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewCreated, setReviewCreated] = useState(false);

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!user) { setLoading(false); return; }
      try {
        const { id } = await props.params;
        const data = await apiClient.get<Record<string, unknown>>(`/bookings/rooms/${id}`);
        setBooking(data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [user, props.params]);

  if (!user) return <div className="mx-auto max-w-lg px-4 py-16 text-center"><Link href="/login?redirect=/my-bookings" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Sign in</Link></div>;
  if (loading) return <div className="mx-auto max-w-lg px-4 py-8 text-zinc-400">Loading...</div>;
  if (!booking) return <div className="mx-auto max-w-lg px-4 py-8 text-red-600">Booking not found</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href="/my-bookings" className="text-sm text-zinc-500 hover:text-zinc-900">&larr; Back to bookings</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Booking Details</h1>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500">Status</span>
          <span className="font-medium capitalize">{(booking.status as string).replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500">Room type</span>
          <span className="font-medium">{(booking.roomType as Record<string, unknown>)?.name as string}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500">Check-in</span>
          <span>{new Date(booking.checkIn as string).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500">Check-out</span>
          <span>{new Date(booking.checkOut as string).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500">Rooms</span>
          <span>{booking.quantity as number}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500">Guests</span>
          <span>{booking.guestCount as number}</span>
        </div>
        <div className="flex justify-between py-2 text-base font-bold">
          <span>Total</span>
          <span>฿{(booking.totalPrice as number).toLocaleString()}</span>
        </div>
      </div>

      {booking.status === 'pending_payment' && (
        <button onClick={async () => {
          if (confirm('Cancel this booking?')) {
            try {
              await apiClient.patch(`/bookings/rooms/${booking.id as string}/cancel`, {});
              setBooking({ ...booking, status: 'cancelled' });
            } catch { /* ignore */ }
          }
        }} className="mt-6 rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
          Cancel booking
        </button>
      )}

      {booking.status === 'completed' && !reviewCreated && !showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="mt-6 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Leave a review
        </button>
      )}

      {showReviewForm && (
        <div className="mt-6 rounded border border-zinc-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Review your stay</h2>
          <ReviewForm
            roomTypeId={(booking.roomType as Record<string, unknown>)?.id as string}
            bookingId={booking.id as string}
            onSuccess={() => {
              setShowReviewForm(false);
              setReviewCreated(true);
            }}
          />
        </div>
      )}

      {reviewCreated && (
        <div className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Thank you! Your review has been submitted.
        </div>
      )}
    </div>
  );
}
