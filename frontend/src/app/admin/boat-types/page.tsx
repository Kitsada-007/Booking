'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface BoatType {
  id: string;
  name: string;
  capacity: number;
  seats: number;
  price: number;
  durationMinutes: number;
  boatCount: number;
}

interface PaginatedResponse {
  data: BoatType[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export default function AdminBoatTypesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<BoatType[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const goToPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const result = await apiClient.get<PaginatedResponse>(`/boat-types?page=${page}&pageSize=20`);
      setItems(result.data);
      setPagination(result.pagination);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const init = async () => {
      const result = await apiClient.get<PaginatedResponse>('/boat-types?page=1&pageSize=20');
      setItems(result.data);
      setPagination(result.pagination);
      setLoading(false);
    };
    init();
  }, []);

  if (!user || user.role !== 'admin') return <div className="p-8 text-center text-zinc-500">Access denied</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Boat Types</h1>
        <Link href="/admin/boat-types/create" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Create boat type</Link>
      </div>

      {loading ? <p className="text-zinc-400">Loading...</p> : (
        <>
          <div className="overflow-hidden rounded border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Capacity</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Seats</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Duration</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Boats</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((bt) => (
                  <tr key={bt.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{bt.name}</td>
                    <td className="px-4 py-3">{bt.capacity}</td>
                    <td className="px-4 py-3">{bt.seats}</td>
                    <td className="px-4 py-3">฿{bt.price.toLocaleString()}</td>
                    <td className="px-4 py-3">{bt.durationMinutes} min</td>
                    <td className="px-4 py-3">{bt.boatCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/boat-types/${bt.id}/edit`} className="text-sm text-zinc-600 hover:text-zinc-900">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <button disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)} className="rounded px-3 py-1 hover:bg-zinc-100 disabled:opacity-30">Prev</button>
              <span className="text-zinc-500">Page {pagination.page} of {pagination.totalPages}</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)} className="rounded px-3 py-1 hover:bg-zinc-100 disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
