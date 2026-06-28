'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

type Tab = 'daily' | 'monthly' | 'availability';
interface DailyRow { date: string; bookings: number; cancelled: number; revenue: number }
interface MonthlyRow { month: string; bookings: number; cancelled: number; revenue: number }
interface AvailRow { date: string; boatType: string; startTime: string; endTime: string; max: number; booked: number; available: number }

function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }
function daysFromNow(n: number) { return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10); }

export default function BoatReportsPage() {
  const { user } = useAuth();
  const canAccess = user && (user.role === 'admin' || user.role === 'boat_staff');
  const [tab, setTab] = useState<Tab>('daily');

  const [dailyData, setDailyData] = useState<DailyRow[]>([]);
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo, setDateTo] = useState(today());

  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const [availData, setAvailData] = useState<AvailRow[]>([]);
  const [availFrom, setAvailFrom] = useState(today());
  const [availTo, setAvailTo] = useState(daysFromNow(7));

  const [loading, setLoading] = useState(false);

  async function loadDaily() {
    setLoading(true);
    try { const d = await apiClient.get<DailyRow[]>(`/reports/boats/daily?dateFrom=${dateFrom}&dateTo=${dateTo}`); setDailyData(d); }
    catch { setDailyData([]); }
    setLoading(false);
  }

  async function loadMonthly() {
    setLoading(true);
    try { const d = await apiClient.get<MonthlyRow[]>(`/reports/boats/monthly?year=${year}`); setMonthlyData(d); }
    catch { setMonthlyData([]); }
    setLoading(false);
  }

  async function loadAvailability() {
    setLoading(true);
    try { const d = await apiClient.get<AvailRow[]>(`/reports/boats/availability?dateFrom=${availFrom}&dateTo=${availTo}`); setAvailData(d); }
    catch { setAvailData([]); }
    setLoading(false);
  }

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!canAccess) return;
      if (tab === 'daily') await loadDaily();
      else if (tab === 'monthly') await loadMonthly();
      else await loadAvailability();
    };
    load();
  }, [canAccess, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || !canAccess) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-zinc-500">Access Denied</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Boat Reports</h1>
      <div role="tablist" aria-label="Report type" className="mb-6 flex gap-4 border-b border-zinc-200">
        {(['daily', 'monthly', 'availability'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} aria-controls={`${t}-panel`} onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500'}`}>{t}</button>
        ))}
      </div>

      {tab === 'daily' && (
        <div role="tabpanel" id="daily-panel" aria-label="Daily report">
          <div className="mb-4 flex gap-3 items-end">
            <div><label className="block text-xs font-medium mb-1">From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1">To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" /></div>
            <button onClick={loadDaily} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Load</button>
          </div>
          {renderDaily(dailyData, loading)}
        </div>
      )}

      {tab === 'monthly' && (
        <div role="tabpanel" id="monthly-panel" aria-label="Monthly report">
          <div className="mb-4 flex gap-3 items-end">
            <div><label className="block text-xs font-medium mb-1">Year</label><input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm w-24" /></div>
            <button onClick={loadMonthly} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Load</button>
          </div>
          {renderMonthly(monthlyData, loading)}
        </div>
      )}

      {tab === 'availability' && (
        <div role="tabpanel" id="availability-panel" aria-label="Availability report">
          <div className="mb-4 flex gap-3 items-end">
            <div><label className="block text-xs font-medium mb-1">From</label><input type="date" value={availFrom} onChange={(e) => setAvailFrom(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1">To</label><input type="date" value={availTo} onChange={(e) => setAvailTo(e.target.value)} className="rounded border border-zinc-300 px-3 py-2 text-sm" /></div>
            <button onClick={loadAvailability} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Load</button>
          </div>
          {renderAvailability(availData, loading)}
        </div>
      )}
    </div>
  );
}

function renderDaily(data: DailyRow[], loading: boolean) {
  if (loading) return <p className="text-zinc-400">Loading...</p>;
  if (data.length === 0) return <p className="text-zinc-500">No data.</p>;
  const totals = data.reduce((a, r) => ({ bookings: a.bookings + r.bookings, cancelled: a.cancelled + r.cancelled, revenue: a.revenue + r.revenue }), { bookings: 0, cancelled: 0, revenue: 0 });
  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <StatCard label="Bookings" value={String(totals.bookings)} />
        <StatCard label="Cancelled" value={String(totals.cancelled)} />
        <StatCard label="Revenue" value={`฿${totals.revenue.toLocaleString()}`} />
      </div>
      <Table headers={['Date', 'Bookings', 'Cancelled', 'Revenue']}>
        {data.map((r) => (
          <tr key={r.date} className="border-b border-zinc-100 text-sm">
            <td className="py-2 pr-4">{r.date}</td>
            <td className="py-2 pr-4">{r.bookings}</td>
            <td className="py-2 pr-4">{r.cancelled}</td>
            <td className="py-2 pr-4">฿{r.revenue.toLocaleString()}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function renderMonthly(data: MonthlyRow[], loading: boolean) {
  if (loading) return <p className="text-zinc-400">Loading...</p>;
  if (data.length === 0) return <p className="text-zinc-500">No data.</p>;
  const totals = data.reduce((a, r) => ({ bookings: a.bookings + r.bookings, cancelled: a.cancelled + r.cancelled, revenue: a.revenue + r.revenue }), { bookings: 0, cancelled: 0, revenue: 0 });
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

function renderAvailability(data: AvailRow[], loading: boolean) {
  if (loading) return <p className="text-zinc-400">Loading...</p>;
  if (data.length === 0) return <p className="text-zinc-500">No data.</p>;

  const slotKeys = [...new Set(data.map((r) => `${r.boatType} ${r.startTime}-${r.endTime}`))];
  const dateKeys = [...new Set(data.map((r) => r.date))];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500">
            <th className="pb-2 pr-4 font-medium">Date</th>
            {slotKeys.map((sk) => <th key={sk} className="pb-2 pr-4 font-medium text-xs">{sk}</th>)}
          </tr>
        </thead>
        <tbody>
          {dateKeys.map((date) => (
            <tr key={date} className="border-b border-zinc-100">
              <td className="py-2 pr-4">{date}</td>
              {slotKeys.map((sk) => {
                const [boatType, times] = [sk.slice(0, sk.indexOf(' ')), sk.slice(sk.indexOf(' ') + 1)];
                const [st, et] = times.split('-');
                const row = data.find((r) => r.date === date && r.boatType === boatType && r.startTime === st && r.endTime === et);
                return (
                  <td key={sk} className="py-2 pr-4">
                    {row ? (
                      <span className={row.available === 0 ? 'text-red-600 font-medium' : row.available < row.max / 2 ? 'text-yellow-600' : 'text-green-600'}>
                        {row.booked}/{row.max}
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
  return (<div className="rounded border border-zinc-200 p-3 text-center"><span className="block text-xs text-zinc-500">{label}</span><span className="text-lg font-bold">{value}</span></div>);
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-zinc-200 text-left text-zinc-500">{headers.map((h) => <th key={h} className="pb-2 pr-4 font-medium">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
