'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface RoomType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  bedSize?: string;
  bedCount: number;
  hasAircon: boolean;
  hasTv: boolean;
  description?: string;
  images: string[];
  roomCount: number;
  reviewCount: number;
  availableRooms?: number;
}

interface PaginatedResponse {
  data: RoomType[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setError('');
      const params = new URLSearchParams();
      if (checkIn) params.set('checkIn', checkIn);
      try {
        const result = await apiClient.get<PaginatedResponse>(`/room-types?${params}`);
        setRoomTypes(result.data);
      } catch { setError('Failed to load rooms'); setRoomTypes([]); }
      setLoading(false);
    };
    load();
  }, [checkIn]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Our Rooms</h1>
      <p className="mb-6 text-zinc-500">Choose your perfect stay</p>

      <div className="mb-8">
        <label htmlFor="roomDateFilter" className="block text-sm font-medium mb-1">Check availability</label>
        <input id="roomDateFilter" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm" />
      </div>

      {error && <div className="mb-4 rounded bg-zinc-100 p-3 text-sm text-zinc-700">{error}</div>}

      {loading ? <p className="text-zinc-400">Loading...</p> : roomTypes.length === 0 ? (
        <p className="text-zinc-500">No rooms available.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roomTypes.map((rt) => (
            <Link key={rt.id} href={`/room-types/${rt.id}`} className="group block rounded border border-zinc-200 p-5 hover:border-zinc-400 transition">
              <h2 className="text-lg font-semibold group-hover:text-zinc-900">{rt.name}</h2>
              <p className="mt-1 text-2xl font-bold">฿{rt.price.toLocaleString()}</p>
              <p className="mt-1 text-sm text-zinc-500">{rt.capacity} guests · {rt.bedCount}x {rt.bedSize || 'bed'}</p>
              <div className="mt-3 flex gap-3 text-xs text-zinc-500">
                {rt.hasAircon && <span>AC</span>}
                {rt.hasTv && <span>TV</span>}
              </div>
              {rt.availableRooms !== undefined && (
                <p className="mt-2 text-sm font-medium text-zinc-700">
                  {rt.availableRooms > 0 ? `${rt.availableRooms} rooms available` : 'Sold out'}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
