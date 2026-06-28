'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { MapView } from '@/components/MapView';

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
  description: string;
  capacity: number;
  seats: number;
  price: number;
  durationMinutes: number;
  images: string[];
  boatCount: number;
  boats: { id: string; boatNumber: string }[];
  timeSlots: TimeSlot[];
}

export default function BoatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [boatType, setBoatType] = useState<BoatType | null>(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      try {
        const result = await apiClient.get<BoatType>(`/boat-types/${id}?${params}`);
        setBoatType(result);
      } catch { setError('Failed to load boat details'); setBoatType(null); }
      try {
        const s = await apiClient.get<{ latitude?: number; longitude?: number }>('/settings');
        if (s.latitude && s.longitude) setMapCoords({ lat: s.latitude, lng: s.longitude });
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [id, date]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-400">Loading...</div>;
  if (error) return <div className="mx-auto max-w-4xl px-4 py-16 text-center"><p className="text-red-600">{error}</p><Link href="/boats" className="mt-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">&larr; Back to boats</Link></div>;
  if (!boatType) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-500">Boat type not found</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/boats" className="text-sm text-zinc-500 hover:text-zinc-900">&larr; Back to boats</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div>
          {boatType.images.length > 0 && (
            <img src={boatType.images[0]} alt={boatType.name} className="w-full rounded-lg object-cover h-64" />
          )}
          <div className="mt-4 flex gap-2">
            {boatType.images.slice(1).map((img, i) => (
              <img key={i} src={img} alt="" className="h-16 w-24 rounded object-cover" />
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{boatType.name}</h1>
          <p className="mt-2 text-3xl font-bold">฿{boatType.price.toLocaleString()}</p>
          <div className="mt-4 space-y-2 text-sm text-zinc-600">
            <p>Capacity: {boatType.capacity} guests</p>
            <p>Seats: {boatType.seats}</p>
            <p>Duration: {boatType.durationMinutes} minutes</p>
            <p>Available boats: {boatType.boatCount}</p>
          </div>

          {boatType.description && <p className="mt-4 text-zinc-700">{boatType.description}</p>}

          <div className="mt-6">
            <label htmlFor="boatDetailDate" className="block text-sm font-medium mb-1">Select date</label>
            <input id="boatDetailDate" type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>

          {date && (
            <div className="mt-4 space-y-2">
              <h2 className="font-semibold">Available time slots</h2>
              {boatType.timeSlots.length === 0 ? (
                <p className="text-sm text-zinc-500">No time slots found.</p>
              ) : (
                boatType.timeSlots.map((ts) => (
                  <div key={ts.id} className={`flex items-center justify-between rounded border px-4 py-3 text-sm ${ts.available > 0 ? 'border-zinc-200' : 'border-red-200 bg-red-50'}`}>
                    <div>
                      <span className="font-mono">{ts.startTime} — {ts.endTime}</span>
                      <span className={`ml-3 ${ts.available > 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {ts.available > 0 ? `${ts.available} spots left` : 'Full'}
                      </span>
                    </div>
                    <Link
                      href={ts.available > 0 ? `/book/boats?boatTypeId=${boatType.id}&timeSlotId=${ts.id}&date=${date}` : '#'}
                      className={`rounded px-4 py-1.5 text-sm font-medium ${ts.available > 0 ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'cursor-not-allowed bg-zinc-300 text-zinc-500'}`}
                    >
                      {ts.available > 0 ? 'Book' : 'Full'}
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {mapCoords && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Location</h2>
          <MapView latitude={mapCoords.lat} longitude={mapCoords.lng} label="View on OpenStreetMap" height={250} />
        </div>
      )}
    </div>
  );
}
