'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
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
  return (
    <div className="bg-zinc-50/50 min-h-screen py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Suspense fallback={<div className="text-zinc-400">Loading search...</div>}>
          <BoatsContent />
        </Suspense>
      </div>
    </div>
  );
}

function BoatsContent() {
  const searchParams = useSearchParams();
  const [boatTypes, setBoatTypes] = useState<BoatType[]>([]);
  const [date, setDate] = useState(searchParams?.get('date') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      try {
        const result = await apiClient.get<PaginatedResponse>(`/boat-types?${params}`);
        setBoatTypes(result.data);
      } catch {
        setError('Failed to load boat tours');
        setBoatTypes([]);
      }
      setLoading(false);
    };
    load();
  }, [date]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Island Boat Excursions</h1>
        <p className="text-zinc-500 mt-1">Explore Krabi&apos;s beautiful islands, snorkeling spots, and sunset views.</p>
      </div>


      {/* Date Search Widget */}
      <div className="bg-white rounded-2xl border border-zinc-200/60 p-4 shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="sm:col-span-2">
          <label htmlFor="boatDateFilter" className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Select Travel Date</label>
          <input
            id="boatDateFilter"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input input-bordered w-full font-medium"
          />
        </div>
        <div>
          <button
            onClick={() => setDate(date)}
            className="btn btn-primary w-full shadow hover:shadow-md transition duration-150"
          >
            Check Boat Availability
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

      {/* Tours Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading boat tours">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-[380px] bg-white border border-zinc-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : boatTypes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col items-center justify-center">
          <svg className="h-12 w-12 text-zinc-400 mb-3 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21V3m0 3L5 10h7m0-7l7 7h-7m-7 4h14" />
          </svg>
          <h3 className="text-lg font-bold text-zinc-800">No boat excursions available</h3>
          <p className="text-zinc-500 text-sm mt-1">Try selecting a different date or checking back later.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boatTypes.map((bt) => {
            const displayOriginal = bt.price * 1.25;

            return (
              <div
                key={bt.id}
                className="group bg-white rounded-2xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Image */}
                <div>
                  {bt.images[0] && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={bt.images[0]}
                        alt={bt.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 badge badge-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border-none">
                        ★ TOP CHOICE
                      </div>
                      <div className="absolute bottom-3 right-3 badge badge-neutral bg-zinc-950/80 text-white text-xs font-semibold px-2 py-3 rounded backdrop-blur flex items-center gap-1 border-none">
                        <svg className="h-3.5 w-3.5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{bt.durationMinutes} mins</span>
                      </div>
                    </div>
                  )}

                  {/* Body Details */}
                  <div className="p-5">
                    <h2 className="text-lg font-extrabold text-zinc-900 group-hover:text-blue-600 transition">
                      {bt.name}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 font-semibold">
                      Capacity: {bt.capacity} max · {bt.seats} private seats
                    </p>

                    {/* Time Slots grid if date is selected */}
                    {date && bt.timeSlots && bt.timeSlots.length > 0 && (
                      <div className="mt-4">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-2">Available Time Slots</span>
                        <div className="flex flex-wrap gap-1.5">
                          {bt.timeSlots.map((ts) => (
                            <span
                              key={ts.id}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                                ts.available > 0
                                  ? 'bg-blue-50/50 text-blue-600 border-blue-100 hover:bg-blue-50'
                                  : 'bg-zinc-50 text-zinc-400 border-zinc-100 cursor-not-allowed'
                              }`}
                              title={ts.available > 0 ? `${ts.available} spots left` : 'Fully booked'}
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {ts.startTime} - {ts.endTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="p-5 border-t border-zinc-100 flex items-end justify-between bg-zinc-50/30">
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Total Price</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-zinc-400 line-through">
                        ฿{displayOriginal.toLocaleString()}
                      </span>
                      <span className="text-xl font-black text-zinc-900">
                        ฿{bt.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <Link
                      href={`/boats/${bt.id}`}
                      className="btn btn-outline border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 rounded-xl transition text-center px-3 py-2 h-auto min-h-0"
                    >
                      Details
                    </Link>
                    <Link
                      href={`/book/boats?boatTypeId=${bt.id}`}
                      className="btn btn-primary text-white font-bold rounded-xl text-xs shadow hover:shadow-md transition text-center px-4 py-2 h-auto min-h-0 border-none"
                    >
                      Book Tour
                    </Link>
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
