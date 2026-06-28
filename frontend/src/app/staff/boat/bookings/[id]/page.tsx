'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { BookingStatusBadge } from '@/components/BookingStatusBadge';

interface DetailPageProps { params: Promise<{ id: string }> }

export default function StaffBoatBookingDetailPage(props: DetailPageProps) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!user || (user.role !== 'admin' && user.role !== 'boat_staff')) { setLoading(false); return; }
      try {
        const { id } = await props.params;
        const data = await apiClient.get<Record<string, unknown>>(`/staff/boat-bookings/${id}`);
        setBooking(data);
      } catch { setError('Booking not found'); }
      setLoading(false);
    };
    load();
  }, [user, props.params]);

  async function updateStatus(status: string) {
    if (!confirm(`Mark this booking as ${status.replace('_', ' ')}?`)) return;
    try {
      const updated = await apiClient.patch<Record<string, unknown>>(`/staff/boat-bookings/${(await props.params).id}/status`, { status });
      setBooking(updated);
    } catch { setError('Failed to update status'); }
  }

  const payment = booking?.payment as Record<string, unknown> | undefined;

  if (!user || (user.role !== 'admin' && user.role !== 'boat_staff')) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">Access Denied</div>;
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8 text-zinc-400">Loading...</div>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-8 text-red-600">{error}</div>;
  if (!booking) return <div className="mx-auto max-w-3xl px-4 py-8 text-red-600">Booking not found</div>;

  const bUser = booking.user as Record<string, unknown> | undefined;
  const bTimeSlot = booking.timeSlot as Record<string, unknown> | undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/staff/boat/bookings" className="text-sm text-zinc-500 hover:text-zinc-900">&larr; Back to bookings</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Booking #{String(booking.id as string).slice(-6).toUpperCase()}</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-500 mb-3">Booking Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Status</span><BookingStatusBadge status={booking.status as string} /></div>
            <div className="flex justify-between"><span className="text-zinc-500">Boat type</span><span className="font-medium">{(booking.boatType as Record<string, unknown>)?.name as string}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Date</span><span>{new Date(booking.date as string).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Time</span><span>{bTimeSlot?.startTime as string} — {bTimeSlot?.endTime as string}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Boats</span><span>{booking.boatCount as number}</span></div>
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
          <button onClick={() => updateStatus('completed')} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Mark completed
          </button>
        )}
        {(booking.status === 'pending_payment' || booking.status === 'confirmed') && (
          <button onClick={() => updateStatus('cancelled')} className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            Cancel booking
          </button>
        )}
      </div>
    </div>
  );
}
