'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface RoomBooking {
  id: string; type: 'room';
  checkIn: string; checkOut: string;
  quantity: number; totalPrice: number; status: string;
  roomType: { id: string; name: string };
  payment?: { method: string; status: string };
}

interface BoatBooking {
  id: string; type: 'boat';
  date: string; boatCount: number; guestCount: number;
  totalPrice: number; status: string;
  boatType: { id: string; name: string };
  timeSlot: { startTime: string; endTime: string };
  payment?: { method: string; status: string };
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
  const [tab, setTab] = useState<'room' | 'boat'>('room');
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
  const [boatBookings, setBoatBookings] = useState<BoatBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!user) { setLoading(false); return; }
      try {
        const [rooms, boats] = await Promise.all([
          apiClient.get<{ data: RoomBooking[] }>('/bookings/rooms').then((r) => r.data).catch(() => []),
          apiClient.get<{ data: BoatBooking[] }>('/bookings/boats').then((r) => r.data).catch(() => []),
        ]);
        setRoomBookings(rooms);
        setBoatBookings(boats);
      } catch { /* ignore */ }
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

  const bookings = tab === 'room' ? roomBookings : boatBookings;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      <div className="mb-6 flex gap-4 border-b border-zinc-200">
        <button onClick={() => setTab('room')} className={`pb-2 text-sm font-medium ${tab === 'room' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500'}`}>Rooms</button>
        <button onClick={() => setTab('boat')} className={`pb-2 text-sm font-medium ${tab === 'boat' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500'}`}>Boats</button>
      </div>

      {loading ? <p className="text-zinc-400">Loading...</p> : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">No {tab} bookings yet</p>
          <Link href={tab === 'room' ? '/rooms' : '/boats'} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            Browse {tab === 'room' ? 'rooms' : 'boats'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="rounded border border-zinc-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  {b.type === 'room' ? (
                    <>
                      <h2 className="font-semibold">{b.roomType.name}</h2>
                      <p className="text-sm text-zinc-500 mt-1">
                        {new Date(b.checkIn).toLocaleDateString()} — {new Date(b.checkOut).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-zinc-500">{b.quantity} room(s)</p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-semibold">{b.boatType.name}</h2>
                      <p className="text-sm text-zinc-500 mt-1">{new Date(b.date).toLocaleDateString()} · {b.timeSlot.startTime} — {b.timeSlot.endTime}</p>
                      <p className="text-sm text-zinc-500">{b.boatCount} boat(s) · {b.guestCount} guest(s)</p>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColors[b.status] || ''}`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                  <p className="mt-1 text-sm font-medium">฿{b.totalPrice.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/my-bookings/${b.id}?type=${b.type}`} className="text-sm text-zinc-600 hover:text-zinc-900">View details</Link>
                {b.status === 'pending_payment' && (
                  <button onClick={async () => {
                    if (confirm('Cancel this booking?')) {
                      try {
                        await apiClient.patch(`/bookings/${b.type === 'room' ? 'rooms' : 'boats'}/${b.id}/cancel`, {});
                        if (b.type === 'room') {
                          setRoomBookings(roomBookings.map((bb) => bb.id === b.id ? { ...bb, status: 'cancelled' } : bb));
                        } else {
                          setBoatBookings(boatBookings.map((bb) => bb.id === b.id ? { ...bb, status: 'cancelled' } : bb));
                        }
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
