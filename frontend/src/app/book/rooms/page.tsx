'use client';

import { Suspense, useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface RoomType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  availableRooms?: number;
}

function BookForm() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomTypeId, setRoomTypeId] = useState(searchParams.get('roomTypeId') || '');
  const packageId = searchParams.get('packageId') || undefined;
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [guestCount, setGuestCount] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'gateway' | 'bank_transfer'>('gateway');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ booking: Record<string, unknown>; payment: Record<string, unknown> } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<{ data: RoomType[] }>('/room-types');
        setRoomTypes(data.data);
      } catch { /* ignore */ }
    })();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        roomTypeId, checkIn, checkOut,
        quantity: Number(quantity),
        guestCount: Number(guestCount),
        paymentMethod,
      };
      if (packageId) body.packageId = packageId;
      const data = await apiClient.post<{ booking: Record<string, unknown>; payment: Record<string, unknown> }>('/bookings/rooms', body);
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
        <Link href={`/login?redirect=/book/rooms${searchParams.get('roomTypeId') ? `?roomTypeId=${searchParams.get('roomTypeId')}` : ''}`}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Sign in
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Booking Confirmed!</h1>
        <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800 mb-6">
          Your booking has been created. Complete your payment to confirm.
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
      <h1 className="text-2xl font-bold mb-6">Book a Room</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div>
          <label className="block text-sm font-medium">Room type</label>
          <select required value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Select a room type</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>{rt.name} — ฿{rt.price.toLocaleString()}/night</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Check-in</label>
            <input type="date" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Check-out</label>
            <input type="date" required value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Rooms</label>
            <input type="number" required min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Guests</label>
            <input type="number" required min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Payment method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'gateway' | 'bank_transfer')} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm">
            <option value="gateway">Credit Card (Gateway)</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <button type="submit" disabled={submitting} className="w-full rounded bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
          {submitting ? 'Booking...' : 'Book now'}
        </button>
      </form>
    </div>
  );
}

export default function BookRoomPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-8 text-zinc-400">Loading...</div>}>
      <BookForm />
    </Suspense>
  );
}
