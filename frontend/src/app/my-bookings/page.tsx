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
  pending_payment: 'badge badge-neutral gap-1 border-none',
  confirmed: 'badge badge-info gap-1 text-white border-none',
  checked_in: 'badge badge-primary gap-1 border-none',
  cancelled: 'badge badge-ghost opacity-60 line-through gap-1 border-none',
  completed: 'badge badge-success text-white gap-1 border-none',
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
      <Link href="/login?redirect=/my-bookings" className="btn btn-primary">Sign in to view your bookings</Link>
    </div>;
  }

  const bookings = tab === 'room' ? roomBookings : boatBookings;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      <div role="tablist" aria-label="Booking type" className="tabs tabs-bordered mb-6">
        <button role="tab" aria-selected={tab === 'room'} aria-controls="room-bookings-panel" onClick={() => setTab('room')} className={`tab font-semibold ${tab === 'room' ? 'tab-active' : 'text-zinc-500'}`}>Rooms</button>
        <button role="tab" aria-selected={tab === 'boat'} aria-controls="boat-bookings-panel" onClick={() => setTab('boat')} className={`tab font-semibold ${tab === 'boat' ? 'tab-active' : 'text-zinc-500'}`}>Boats</button>
      </div>

      <div role="tabpanel" id={`${tab}-bookings-panel`} aria-label={`${tab} bookings`}>
      {loading ? <p className="text-zinc-400 animate-pulse">Loading...</p> : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">No {tab} bookings yet</p>
          <Link href={tab === 'room' ? '/room-types' : '/boats'} className="btn btn-primary">
            Browse {tab === 'room' ? 'rooms' : 'boats'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="card card-bordered bg-base-100 p-5 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  {b.type === 'room' ? (
                    <>
                      <h2 className="font-semibold text-lg text-zinc-900">{b.roomType.name}</h2>
                      <p className="text-sm text-zinc-500 mt-1">
                        {new Date(b.checkIn).toLocaleDateString()} — {new Date(b.checkOut).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-zinc-500">{b.quantity} room(s)</p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-semibold text-lg text-zinc-900">{b.boatType.name}</h2>
                      <p className="text-sm text-zinc-500 mt-1">{new Date(b.date).toLocaleDateString()} · {b.timeSlot.startTime} — {b.timeSlot.endTime}</p>
                      <p className="text-sm text-zinc-500">{b.boatCount} boat(s) · {b.guestCount} guest(s)</p>
                    </>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`inline-flex px-2.5 py-3 text-xs font-bold rounded-lg ${statusColors[b.status] || ''}`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-zinc-800">฿{b.totalPrice.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3 border-t border-zinc-100 pt-3">
                <Link href={`/my-bookings/${b.id}?type=${b.type}`} className="btn btn-ghost btn-xs text-zinc-500 hover:text-zinc-900 normal-case">View details</Link>
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
                  }} className="btn btn-ghost btn-xs text-red-500 hover:text-red-700 normal-case">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
