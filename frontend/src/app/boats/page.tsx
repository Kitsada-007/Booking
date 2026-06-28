'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  booked: number;
  available: number;
}

interface BoatType {
  id: string;
  name: string;
  capacity: number;
  seats: number;
  price: number;
  durationMinutes: number;
  images: string[];
  boatCount: number;
  timeSlots: TimeSlot[];
}

interface PaginatedResponse {
  data: BoatType[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export default function BoatsPage() {
  const [boatTypes, setBoatTypes] = useState<BoatType[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setError('');
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      try {
        const result = await apiClient.get<PaginatedResponse>(`/boat-types?${params}`);
        setBoatTypes(result.data);
      } catch { setError('Failed to load boat tours'); setBoatTypes([]); }
      setLoading(false);
    };
    load();
  }, [date]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Boat Tours</h1>
      <p className="mb-6 text-zinc-500">Explore our fleet and book your ride</p>

      <div className="mb-8">
        <label htmlFor="boatDateFilter" className="block text-sm font-medium mb-1">Check availability</label>
        <input id="boatDateFilter" type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm" />
      </div>

      {error && <div className="mb-4 rounded bg-zinc-100 p-3 text-sm text-zinc-700">{error}</div>}

      {loading ? <p className="text-zinc-400">Loading...</p> : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boatTypes.map((bt) => (
            <Link key={bt.id} href={`/boats/${bt.id}`} className="group block rounded border border-zinc-200 p-5 hover:border-zinc-400 transition">
              <h2 className="text-lg font-semibold group-hover:text-zinc-900">{bt.name}</h2>
              <p className="mt-1 text-2xl font-bold">฿{bt.price.toLocaleString()}</p>
              <p className="mt-1 text-sm text-zinc-500">{bt.capacity} guests · {bt.seats} seats · {bt.durationMinutes} min</p>
              {bt.timeSlots && date && (
                <div className="mt-3 space-y-1">
                  {bt.timeSlots.map((ts) => (
                    <p key={ts.id} className={`text-xs ${ts.available > 0 ? 'text-zinc-700' : 'text-zinc-400'}`}>
                      {ts.startTime} — {ts.endTime}: {ts.available > 0 ? `${ts.available} spots` : 'Full'}
                    </p>
                  ))}
                </div>
              )}
            </Link>
          ))}
          {!loading && boatTypes.length === 0 && (
            <p className="col-span-full text-zinc-500">No boat tours available.</p>
          )}
        </div>
      )}
    </div>
  );
}
