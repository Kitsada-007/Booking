'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface PackageUsage {
  id: string;
  name: string;
  roomType: string;
  totalBookings: number;
  totalRevenue: number;
  peakMonth: string | null;
}

export default function AdminPackageReportsPage() {
  const { user } = useAuth();
  const canAccess = user && (user.role === 'admin' || user.role === 'room_staff');
  const [data, setData] = useState<PackageUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!canAccess) { setLoading(false); return; }
      try {
        const d = await apiClient.get<PackageUsage[]>('/reports/packages');
        setData(d);
      } catch { setData([]); }
      setLoading(false);
    };
    load();
  }, [canAccess]);

  if (!user || !canAccess) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-500">Access Denied</div>;

  const totals = data.reduce((a, r) => ({ bookings: a.bookings + r.totalBookings, revenue: a.revenue + r.totalRevenue }), { bookings: 0, revenue: 0 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Package Usage Report</h1>

      {loading ? <p className="text-zinc-400">Loading...</p> : data.length === 0 ? (
        <p className="text-zinc-500">No package data yet.</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded border border-zinc-200 p-3 text-center">
              <span className="block text-xs text-zinc-500">Total Package Bookings</span>
              <span className="text-lg font-bold">{totals.bookings}</span>
            </div>
            <div className="rounded border border-zinc-200 p-3 text-center">
              <span className="block text-xs text-zinc-500">Total Revenue</span>
              <span className="text-lg font-bold">฿{totals.revenue.toLocaleString()}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">Package</th>
                  <th className="pb-2 pr-4 font-medium">Room Type</th>
                  <th className="pb-2 pr-4 font-medium">Bookings</th>
                  <th className="pb-2 pr-4 font-medium">Revenue</th>
                  <th className="pb-2 font-medium">Peak Month</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100">
                    <td className="py-2 pr-4 font-medium">{p.name}</td>
                    <td className="py-2 pr-4">{p.roomType}</td>
                    <td className="py-2 pr-4">{p.totalBookings}</td>
                    <td className="py-2 pr-4">฿{p.totalRevenue.toLocaleString()}</td>
                    <td className="py-2">{p.peakMonth || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
