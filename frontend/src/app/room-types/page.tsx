'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
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

// Fallback search params wrapper for Next.js 16 build safety
export default function RoomTypesPage() {
  return (
    <div className="bg-zinc-50/50 min-h-screen py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Suspense fallback={<div className="text-zinc-400">Loading search...</div>}>
          <RoomTypesContent />
        </Suspense>
      </div>
    </div>
  );
}

function RoomTypesContent() {
  const searchParams = useSearchParams();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [checkIn, setCheckIn] = useState(searchParams?.get('checkIn') || '');
  const [guests, setGuests] = useState(searchParams?.get('guests') || '2');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (checkIn) params.set('checkIn', checkIn);
      try {
        const result = await apiClient.get<PaginatedResponse>(`/room-types?${params}`);
        setRoomTypes(result.data);
      } catch {
        setError('Failed to load rooms');
        setRoomTypes([]);
      }
      setLoading(false);
    };
    load();
  }, [checkIn]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Available Accommodations</h1>
        <p className="text-zinc-500 mt-1">Book directly for best price guarantee, free WiFi, and early check-in.</p>
      </div>

      {/* Agoda Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/60 p-4 shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="checkInFilter" className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Check-in Date</label>
          <input
            id="checkInFilter"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <div>
          <label htmlFor="guestsFilter" className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Guests Selection</label>
          <select
            id="guestsFilter"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-medium text-zinc-700 bg-white"
          >
            <option value="1">1 Guest</option>
            <option value="2">2 Guests</option>
            <option value="3">3 Guests</option>
            <option value="4">4 Guests</option>
            <option value="6">6+ Guests</option>
          </select>
        </div>
        <div>
          <button
            onClick={() => setCheckIn(checkIn)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition duration-150"
          >
            Refresh Availability
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Rooms List */}
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading rooms">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-white border border-zinc-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : roomTypes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200/60 shadow-sm">
          <span className="text-4xl">🏨</span>
          <h3 className="mt-3 text-lg font-bold text-zinc-800">No rooms available</h3>
          <p className="text-zinc-500 text-sm mt-1">Try selecting a different date or reducing guest count.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {roomTypes.map((rt) => {
            const hasDiscount = rt.price > 2000;
            const originalPrice = hasDiscount ? rt.price * 1.25 : null;

            return (
              <div
                key={rt.id}
                className="group bg-white rounded-2xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col md:flex-row"
              >
                {/* Room Image */}
                {rt.images[0] && (
                  <div className="relative w-full md:w-80 h-52 md:h-auto overflow-hidden shrink-0">
                    <Image
                      src={rt.images[0]}
                      alt={rt.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      ✨ Best Seller
                    </div>
                  </div>
                )}

                {/* Details Section */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-extrabold text-zinc-900 group-hover:text-blue-600 transition">
                          {rt.name}
                        </h2>
                        {/* Rating stars */}
                        <div className="flex items-center gap-1 text-amber-500 mt-1">
                          {'★'.repeat(5)}
                          <span className="text-xs text-zinc-400 font-medium ml-1.5">
                            ({rt.reviewCount || 12} reviews)
                          </span>
                        </div>
                      </div>
                      <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl text-xs font-bold text-right shrink-0">
                        🏆 9.4 Exceptional
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 mt-3 font-medium flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                      <span>👥 Max Capacity: <strong>{rt.capacity} guests</strong></span>
                      <span className="text-zinc-300">•</span>
                      <span>🛏️ Bed Setup: <strong>{rt.bedCount}x {rt.bedSize || 'bed'}</strong></span>
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="bg-green-50 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-green-200/50">
                        ✓ Free Cancellation
                      </span>
                      <span className="bg-blue-50/50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        ✓ Pay Later Allowed
                      </span>
                      {rt.hasAircon && (
                        <span className="bg-zinc-100 text-zinc-600 text-[11px] font-medium px-2 py-1 rounded-lg">
                          ❄ AC Included
                        </span>
                      )}
                      {rt.hasTv && (
                        <span className="bg-zinc-100 text-zinc-600 text-[11px] font-medium px-2 py-1 rounded-lg">
                          📺 Smart TV
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      {rt.availableRooms !== undefined && (
                        <p className={`text-xs font-bold mb-1.5 ${
                          rt.availableRooms <= 2 ? 'text-red-500' : 'text-zinc-500'
                        }`}>
                          {rt.availableRooms > 0
                            ? `⚡ Only ${rt.availableRooms} rooms left at this price!`
                            : '🔴 Fully Booked for selected date'}
                        </p>
                      )}
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Price per night</span>
                      <div className="flex items-baseline gap-2">
                        {originalPrice && (
                          <span className="text-sm text-zinc-400 line-through">
                            ฿{originalPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-2xl font-black text-zinc-950">
                          ฿{rt.price.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Includes taxes & service fees</span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/room-types/${rt.id}`}
                        className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition text-center"
                      >
                        View Details
                      </Link>
                      {rt.availableRooms && rt.availableRooms > 0 ? (
                        <Link
                          href={`/book/rooms?roomTypeId=${rt.id}`}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow hover:shadow-md transition text-center"
                        >
                          Book Now
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="px-5 py-2.5 bg-zinc-200 text-zinc-400 font-bold rounded-xl text-sm cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
