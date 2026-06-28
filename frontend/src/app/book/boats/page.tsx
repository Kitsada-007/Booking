'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface BoatType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  durationMinutes: number;
  timeSlots?: { id: string; startTime: string; endTime: string; available: number }[];
}

function BookBoatForm() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [boatTypes, setBoatTypes] = useState<BoatType[]>([]);
  const [boatTypeId, setBoatTypeId] = useState(searchParams.get('boatTypeId') || '');
  const [timeSlotId, setTimeSlotId] = useState(searchParams.get('timeSlotId') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [boatCount, setBoatCount] = useState('1');
  const [guestCount, setGuestCount] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'gateway' | 'bank_transfer'>('gateway');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ booking: Record<string, unknown>; payment: Record<string, unknown> } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<{ data: BoatType[] }>('/boat-types');
        setBoatTypes(data.data);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!date || !boatTypeId) return;
    (async () => {
      try {
        const data = await apiClient.get<{ data: BoatType[] }>(`/boat-types?date=${date}`);
        setBoatTypes(data.data);
      } catch { /* ignore */ }
    })();
  }, [date, boatTypeId]);

  const selectedBoatType = boatTypes.find((bt) => bt.id === boatTypeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await apiClient.post<{ booking: Record<string, unknown>; payment: Record<string, unknown> }>('/bookings/boats', {
        boatTypeId, timeSlotId, date,
        boatCount: Number(boatCount),
        guestCount: Number(guestCount),
        paymentMethod,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign in to book</h1>
        <Link href={`/login?redirect=/book/boats${searchParams.get('boatTypeId') ? `?boatTypeId=${searchParams.get('boatTypeId')}` : ''}`}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Sign in
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Boat Booking Confirmed!</h1>
        <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800 mb-6">
          Your boat booking has been created. Complete your payment to confirm.
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="text-zinc-500">Amount:</span> ฿{(result.payment.amount as number).toLocaleString()}</p>
          <p><span className="text-zinc-500">Method:</span> {result.payment.method as string === 'gateway' ? 'Credit Card' : 'Bank Transfer'}</p>
          {result.payment.method === 'gateway' && (
            <a href={result.payment.redirectUrl as string} className="mt-4 inline-block rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
              Pay now
            </a>
          )}
          {result.payment.method === 'bank_transfer' && (
            <div className="mt-4 space-y-2">
              <p className="font-medium">Transfer to one of these accounts:</p>
              {(result.payment.bankAccounts as Array<{ bankName: string; accountName: string; accountNumber: string }>).map((acc, i) => (
                <div key={i} className="rounded border border-zinc-200 p-3 text-sm">
                  <p className="font-medium">{acc.bankName}</p>
                  <p>{acc.accountName}</p>
                  <p className="font-mono">{acc.accountNumber}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <Link href="/my-bookings" className="mt-6 inline-block text-sm text-zinc-600 hover:text-zinc-900">
          View my bookings &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Book a Boat</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div>
          <label htmlFor="boatTypeId" className="block text-sm font-medium">Boat type</label>
          <select id="boatTypeId" required value={boatTypeId} onChange={(e) => { setBoatTypeId(e.target.value); setTimeSlotId(''); }} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Select a boat type</option>
            {boatTypes.map((bt) => (
              <option key={bt.id} value={bt.id}>{bt.name} — ฿{bt.price.toLocaleString()}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="boatDate" className="block text-sm font-medium">Date</label>
          <input id="boatDate" type="date" required value={date} onChange={(e) => { setDate(e.target.value); setTimeSlotId(''); }}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label htmlFor="timeSlotId" className="block text-sm font-medium">Time slot</label>
          <select id="timeSlotId" required value={timeSlotId} onChange={(e) => setTimeSlotId(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Select a time slot</option>
            {selectedBoatType?.timeSlots?.filter((ts) => ts.available > 0).map((ts) => (
              <option key={ts.id} value={ts.id}>{ts.startTime} — {ts.endTime} ({ts.available} spots)</option>
            ))}
          </select>
          {selectedBoatType?.timeSlots?.filter((ts) => ts.available <= 0).length === selectedBoatType?.timeSlots?.length && (
            <p className="mt-1 text-xs text-red-600">All time slots are full for this date.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="boatCount" className="block text-sm font-medium">Boats</label>
            <input id="boatCount" type="number" required min={1} value={boatCount} onChange={(e) => setBoatCount(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="boatGuestCount" className="block text-sm font-medium">Guests</label>
            <input id="boatGuestCount" type="number" required min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label htmlFor="boatPaymentMethod" className="block text-sm font-medium">Payment method</label>
          <select id="boatPaymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'gateway' | 'bank_transfer')}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm">
            <option value="gateway">Credit Card (Gateway)</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full rounded bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
          {submitting ? 'Booking...' : 'Book now'}
        </button>
      </form>
    </div>
  );
}

export default function BookBoatPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-8 text-zinc-400">Loading...</div>}>
      <BookBoatForm />
    </Suspense>
  );
}
