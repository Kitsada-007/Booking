'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface RoomBooking {
  id: string;
  checkIn: string;
  checkOut: string;
  quantity: number;
  totalPrice: number;
  status: string;
  roomType: { id: string; name: string };
  payment?: { method: string; status: string };
}

interface PaginatedResponse {
  data: RoomBooking[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  checked_in: 'bg-purple-50 text-purple-700',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-blue-50 text-blue-700',
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!user) {
        setBookings([]);
        setLoading(false);
        return;
      }
      try {
        const data = await apiClient.get<PaginatedResponse>('/bookings/rooms');
        setBookings(data.data);
      } catch { setBookings([]); }
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      <Link href="/login?redirect=/my-bookings" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Sign in to view your bookings</Link>
    </div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {loading ? <p className="text-zinc-400">Loading...</p> : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">No bookings yet</p>
          <Link href="/room-types" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Browse rooms</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="rounded border border-zinc-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{b.roomType.name}</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    {new Date(b.checkIn).toLocaleDateString()} — {new Date(b.checkOut).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-zinc-500">{b.quantity} room(s)</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColors[b.status] || ''}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                  <p className="mt-1 text-sm font-medium">฿{b.totalPrice.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/my-bookings/${b.id}`} className="text-sm text-zinc-600 hover:text-zinc-900">View details</Link>
                {b.status === 'pending_payment' && (
                  <button onClick={async () => {
                    if (confirm('Cancel this booking?')) {
                      try {
                        await apiClient.patch(`/bookings/rooms/${b.id}/cancel`, {});
                        setBookings(bookings.map((bb) => bb.id === b.id ? { ...bb, status: 'cancelled' } : bb));
                      } catch { /* ignore */ }
                    }
                  }} className="text-sm text-red-600 hover:text-red-800">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
