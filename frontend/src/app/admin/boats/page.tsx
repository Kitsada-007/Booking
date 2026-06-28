'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface Boat {
  id: string;
  boatNumber: string;
  boatType: { id: string; name: string };
}

export default function AdminBoatsPage() {
  const { user } = useAuth();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await apiClient.get<Boat[]>('/boats');
        setBoats(result);
      } catch { setBoats([]); }
      setLoading(false);
    };
    load();
  }, []);

  if (!user || user.role !== 'admin') return <div className="p-8 text-center text-zinc-500">Access denied</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Boats</h1>
        <Link href="/admin/boats/create" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Create boat</Link>
      </div>
      {loading ? <p className="text-zinc-400">Loading...</p> : boats.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">No boats found.</p>
      ) : (
        <div className="overflow-hidden rounded border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Boat #</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Type</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {boats.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{b.boatNumber}</td>
                  <td className="px-4 py-3">{b.boatType.name}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/boats/${b.id}/edit`} className="text-sm text-zinc-600 hover:text-zinc-900">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
