'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface BoatBooking {
  id: string;
  date: string;
  boatCount: number;
  guestCount: number;
  totalPrice: number;
  status: string;
  boatType: { name: string };
  timeSlot: { startTime: string; endTime: string };
  user: { id: string; firstName: string; lastName: string; email: string };
  payment?: { method: string; status: string };
}

interface PaginatedResponse {
  data: BoatBooking[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-blue-50 text-blue-700',
};

export default function StaffBoatBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BoatBooking[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [queryKey, setQueryKey] = useState(0);
  const [page, setPage] = useState(1);

  const canAccess = user && (user.role === 'admin' || user.role === 'boat_staff');

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!canAccess) { setLoading(false); return; }
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (search) params.set('search', search);
      params.set('page', String(page));
      try {
        const result = await apiClient.get<PaginatedResponse>(`/staff/boat-bookings?${params}`);
        setBookings(result.data);
        setPagination({ page: result.pagination.page, totalPages: result.pagination.totalPages });
      } catch { setBookings([]); }
      setLoading(false);
    };
    load();
  }, [canAccess, status, dateFrom, dateTo, search, page, queryKey]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setQueryKey((k) => k + 1);
  }

  function goToPage(p: number) {
    setPage(p);
    setLoading(true);
  }

  if (!user) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <Link href="/login?redirect=/staff/boat/bookings" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Sign in</Link>
    </div>;
  }

  if (!canAccess) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
      <p className="text-zinc-500">You do not have permission to view this page.</p>
    </div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Boat Bookings</h1>

      <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Search member</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or booking ID" className="rounded border border-zinc-300 px-3 py-2 text-sm w-48" />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Filter</button>
      </form>

      {loading ? <p className="text-zinc-400">Loading...</p> : bookings.length === 0 ? (
        <p className="text-zinc-500">No bookings found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">Member</th>
                  <th className="pb-2 pr-4 font-medium">Boat</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Time</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-100">
                    <td className="py-3 pr-4">{b.user.firstName} {b.user.lastName}</td>
                    <td className="py-3 pr-4">{b.boatType.name}</td>
                    <td className="py-3 pr-4">{new Date(b.date).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">{b.timeSlot.startTime} — {b.timeSlot.endTime}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColors[b.status] || ''}`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">฿{b.totalPrice.toLocaleString()}</td>
                    <td className="py-3">
                      <Link href={`/staff/boat/bookings/${b.id}`} className="text-zinc-600 hover:text-zinc-900 text-xs">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`rounded px-3 py-1 text-sm ${p === pagination.page ? 'bg-zinc-900 text-white' : 'border border-zinc-300 hover:bg-zinc-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
