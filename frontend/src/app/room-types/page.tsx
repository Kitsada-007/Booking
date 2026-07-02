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
          <label htmlFor="checkInFilter" className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Check-in Date</label>
          <input
            id="checkInFilter"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="input input-bordered w-full font-medium"
          />
        </div>
        <div>
          <label htmlFor="guestsFilter" className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Guests Selection</label>
          <select
            id="guestsFilter"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="select select-bordered w-full font-medium text-zinc-700 bg-white"
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
            className="btn btn-primary w-full shadow hover:shadow-md transition duration-150"
          >
            Refresh Availability
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6 shadow-sm text-sm">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
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
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col items-center justify-center">
          <svg className="h-12 w-12 text-zinc-400 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 9h.008v.008H9V9zm.008 3H9v.008h.008V12zm-.008 3h.008v.008H9V15zm3-6h.008v.008H12V9zm.008 3H12v.008h.008V12zm-.008 3h.008v.008H12V15zm3-6h.008v.008H15V9zm.008 3H15v.008h.008V12zm-.008 3h.008v.008H15V15z" />
          </svg>
          <h3 className="text-lg font-bold text-zinc-800">No rooms available</h3>
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
                    <div className="absolute top-3 left-3 badge badge-neutral text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider flex items-center gap-1 border-none bg-zinc-900/80">
                      <svg className="h-3 w-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      Best Seller
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
                      <div className="badge badge-info bg-blue-50 text-blue-700 border-none px-2.5 py-3 rounded-xl text-xs font-bold text-right shrink-0 flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-2.25a1.125 1.125 0 00-1.125 1.125v3.375m9 0h-9m9 0a3 3 0 01-3-3V7.875c0-.621-.504-1.125-1.125-1.125H6.75A1.125 1.125 0 005.625 7.875V15.75a3 3 0 01-3 3" />
                        </svg>
                        9.4 Exceptional
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 mt-3 font-medium flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 018.625 21c-3.294 0-6.216-1.409-8.218-3.648v-.109c0-1.11.285-2.16.786-3.07M7 7a4 4 0 100 8 4 4 0 000-8zm14-1a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
                        </svg>
                        Max Capacity: <strong>{rt.capacity} guests</strong>
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H3m0 0v6M3 12V6a2 2 0 012-2h4a2 2 0 012 2v6m0-6h6a2 2 0 012 2v4" />
                        </svg>
                        Bed Setup: <strong>{rt.bedCount}x {rt.bedSize || 'bed'}</strong>
                      </span>
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="badge badge-success bg-green-50 text-green-700 text-[11px] font-bold px-2.5 py-3 rounded-lg border border-green-200/50">
                        ✓ Free Cancellation
                      </span>
                      <span className="badge badge-info bg-blue-50/50 text-blue-700 text-[11px] font-bold px-2.5 py-3 rounded-lg border border-blue-200/50">
                        ✓ Pay Later Allowed
                      </span>
                      {rt.hasAircon && (
                        <span className="badge badge-neutral bg-zinc-100 text-zinc-600 text-[11px] font-medium px-2.5 py-3 rounded-lg flex items-center gap-1 border-none">
                          <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3m-3 12l-3-3m3 3l3-3M3 12h18M3 12l3-3m-3 3l3 3m12-3l-3-3m3 3l-3 3" />
                          </svg>
                          AC Included
                        </span>
                      )}
                      {rt.hasTv && (
                        <span className="badge badge-neutral bg-zinc-100 text-zinc-600 text-[11px] font-medium px-2.5 py-3 rounded-lg flex items-center gap-1 border-none">
                          <svg className="h-3 w-3 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect width="18" height="12" x="3" y="4" rx="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20h10M12 16v4" />
                          </svg>
                          Smart TV
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      {rt.availableRooms !== undefined && (
                        <div className="mb-1.5">
                          {rt.availableRooms > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500">
                              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v6.5h3.5a1 1 0 01.7 1.7l-7.5 7.5a1 1 0 01-1.48-.3 1 1 0 01-.22-.7V11.5H3.5a1 1 0 01-.7-1.7l7.5-7.5a1 1 0 011-.754z" clipRule="evenodd" />
                              </svg>
                              Only {rt.availableRooms} rooms left at this price!
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500">
                              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                              Fully Booked for selected date
                            </span>
                          )}
                        </div>
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
                        className="btn btn-outline border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition text-center px-4 py-2.5 rounded-xl text-sm font-semibold h-auto min-h-0"
                      >
                        View Details
                      </Link>
                      {rt.availableRooms && rt.availableRooms > 0 ? (
                        <Link
                          href={`/book/rooms?roomTypeId=${rt.id}`}
                          className="btn btn-primary text-white font-bold rounded-xl text-sm shadow hover:shadow-md transition text-center px-5 py-2.5 h-auto min-h-0 border-none"
                        >
                          Book Now
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="btn btn-disabled bg-zinc-200 text-zinc-400 font-bold rounded-xl text-sm cursor-not-allowed px-5 py-2.5 h-auto min-h-0"
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
