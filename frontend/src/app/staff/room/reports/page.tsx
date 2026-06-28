'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

type Tab = 'daily' | 'monthly' | 'occupancy';

interface DailyRow { date: string; bookings: number; cancelled: number; revenue: number; pending: number; confirmed: number }
interface MonthlyRow { month: string; bookings: number; cancelled: number; revenue: number }
interface OccupancyRow { date: string; roomType: string; total: number; booked: number; available: number }

function today(): string { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number): string { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }
function daysFromNow(n: number): string { return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10); }

export default function RoomReportsPage() {
  const { user } = useAuth();
  const canAccess = user && (user.role === 'admin' || user.role === 'room_staff');
  const [tab, setTab] = useState<Tab>('daily');

  const [dailyData, setDailyData] = useState<DailyRow[]>([]);
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo, setDateTo] = useState(today());

  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const [occData, setOccData] = useState<OccupancyRow[]>([]);
  const [occFrom, setOccFrom] = useState(today());
  const [occTo, setOccTo] = useState(daysFromNow(30));

  const [loading, setLoading] = useState(false);

  async function loadDaily() {
    setLoading(true);
    try {
      const data = await apiClient.get<DailyRow[]>(`/reports/rooms/daily?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      setDailyData(data);
    } catch { setDailyData([]); }
    setLoading(false);
  }

  async function loadMonthly() {
    setLoading(true);
    try {
      const data = await apiClient.get<MonthlyRow[]>(`/reports/rooms/monthly?year=${year}`);
      setMonthlyData(data);
    } catch { setMonthlyData([]); }
    setLoading(false);
  }

  async function loadOccupancy() {
    setLoading(true);
    try {
      const data = await apiClient.get<OccupancyRow[]>(`/reports/rooms/occupancy?dateFrom=${occFrom}&dateTo=${occTo}`);
      setOccData(data);
    } catch { setOccData([]); }
    setLoading(false);
  }

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!canAccess) { return; }
      if (tab === 'daily') { await loadDaily(); return; }
      if (tab === 'monthly') { await loadMonthly(); return; }
      if (tab === 'occupancy') { await loadOccupancy(); }
    };
    load();
  }, [canAccess, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || !canAccess) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-zinc-500">Access Denied</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Room Reports</h1>

      <div role="tablist" aria-label="Report type" className="mb-6 flex gap-4 border-b border-zinc-200">
        {(['daily', 'monthly', 'occupancy'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} aria-controls={`${t}-panel`} onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'daily' && (
        <div role="tabpanel" id="daily-panel" aria-label="Daily report">
          <div className="mb-4 flex gap-3 items-end">
            <div><label className="block text-xs font-medium mb-1">From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1">To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" /></div>
            <button onClick={loadDaily} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Load</button>
          </div>
          {renderDailyTable(dailyData, loading)}
        </div>
      )}

      {tab === 'monthly' && (
        <div role="tabpanel" id="monthly-panel" aria-label="Monthly report">
          <div className="mb-4 flex gap-3 items-end">
            <div><label className="block text-xs font-medium mb-1">Year</label><input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm w-24" /></div>
            <button onClick={loadMonthly} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Load</button>
          </div>
          {renderMonthlyTable(monthlyData, loading)}
        </div>
      )}

      {tab === 'occupancy' && (
        <div role="tabpanel" id="occupancy-panel" aria-label="Occupancy report">
          <div className="mb-4 flex gap-3 items-end">
            <div><label className="block text-xs font-medium mb-1">From</label><input type="date" value={occFrom} onChange={(e) => setOccFrom(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1">To</label><input type="date" value={occTo} onChange={(e) => setOccTo(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" /></div>
            <button onClick={loadOccupancy} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Load</button>
          </div>
          {renderOccupancyTable(occData, loading)}
        </div>
      )}
    </div>
  );
}

function renderDailyTable(data: DailyRow[], loading: boolean) {
  if (loading) return <p className="text-zinc-400">Loading...</p>;
  if (data.length === 0) return <p className="text-zinc-500">No data.</p>;

  const totals = data.reduce((acc, r) => ({
    bookings: acc.bookings + r.bookings,
    cancelled: acc.cancelled + r.cancelled,
    revenue: acc.revenue + r.revenue,
    confirmed: acc.confirmed + r.confirmed,
    pending: acc.pending + r.pending,
  }), { bookings: 0, cancelled: 0, revenue: 0, confirmed: 0, pending: 0 });

  return (
    <>
      <div className="mb-4 grid grid-cols-5 gap-3 text-sm">
        <StatCard label="Bookings" value={String(totals.bookings)} />
        <StatCard label="Confirmed" value={String(totals.confirmed)} />
        <StatCard label="Cancelled" value={String(totals.cancelled)} />
        <StatCard label="Pending" value={String(totals.pending)} />
        <StatCard label="Revenue" value={`฿${totals.revenue.toLocaleString()}`} />
      </div>
      <Table headers={['Date', 'Bookings', 'Confirmed', 'Cancelled', 'Pending', 'Revenue']}>
        {data.map((r) => (
          <tr key={r.date} className="border-b border-zinc-100 text-sm">
            <td className="py-2 pr-4">{r.date}</td>
            <td className="py-2 pr-4">{r.bookings}</td>
            <td className="py-2 pr-4">{r.confirmed}</td>
            <td className="py-2 pr-4">{r.cancelled}</td>
            <td className="py-2 pr-4">{r.pending}</td>
            <td className="py-2 pr-4">฿{r.revenue.toLocaleString()}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function renderMonthlyTable(data: MonthlyRow[], loading: boolean) {
  if (loading) return <p className="text-zinc-400">Loading...</p>;
  if (data.length === 0) return <p className="text-zinc-500">No data.</p>;

  const totals = data.reduce((acc, r) => ({
    bookings: acc.bookings + r.bookings,
    cancelled: acc.cancelled + r.cancelled,
    revenue: acc.revenue + r.revenue,
  }), { bookings: 0, cancelled: 0, revenue: 0 });

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <StatCard label="Total Bookings" value={String(totals.bookings)} />
        <StatCard label="Cancelled" value={String(totals.cancelled)} />
        <StatCard label="Revenue" value={`฿${totals.revenue.toLocaleString()}`} />
      </div>
      <Table headers={['Month', 'Bookings', 'Cancelled', 'Revenue']}>
        {data.map((r) => (
          <tr key={r.month} className="border-b border-zinc-100 text-sm">
            <td className="py-2 pr-4">{r.month}</td>
            <td className="py-2 pr-4">{r.bookings}</td>
            <td className="py-2 pr-4">{r.cancelled}</td>
            <td className="py-2 pr-4">฿{r.revenue.toLocaleString()}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function renderOccupancyTable(data: OccupancyRow[], loading: boolean) {
  if (loading) return <p className="text-zinc-400">Loading...</p>;
  if (data.length === 0) return <p className="text-zinc-500">No data.</p>;

  const roomTypes = [...new Set(data.map((r) => r.roomType))];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500">
            <th className="pb-2 pr-4 font-medium">Date</th>
            {roomTypes.map((rt) => (
              <th key={rt} className="pb-2 pr-4 font-medium">{rt}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.filter((r, i, arr) => arr.findIndex((x) => x.date === r.date) === i).map((row) => (
            <tr key={row.date} className="border-b border-zinc-100">
              <td className="py-2 pr-4">{row.date}</td>
              {roomTypes.map((rt) => {
                const occ = data.find((r) => r.date === row.date && r.roomType === rt);
                return (
                  <td key={rt} className="py-2 pr-4">
                    {occ ? (
                      <span className={occ.available === 0 ? 'text-red-600 font-medium' : occ.available < occ.total / 2 ? 'text-yellow-600' : 'text-green-600'}>
                        {occ.booked}/{occ.total}
                      </span>
                    ) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-200 p-3 text-center">
      <span className="block text-xs text-zinc-500">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500">
            {headers.map((h) => <th key={h} className="pb-2 pr-4 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
