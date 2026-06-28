'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface EditPageProps { params: Promise<{ id: string }> }

export default function EditBoatTypePage(props: EditPageProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { id } = await props.params;
        const data = await apiClient.get<Record<string, unknown>>(`/boat-types/${id}`);
        setName(data.name as string);
        setCapacity(String(data.capacity));
        setSeats(String(data.seats));
        setPrice(String(data.price));
        setDurationMinutes(String(data.durationMinutes));
      } catch { setError('Failed to load boat type'); }
      finally { setLoading(false); }
    })();
  }, [props.params]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { id } = await props.params;
      await apiClient.patch(`/boat-types/${id}`, {
        name, capacity: Number(capacity), seats: Number(seats),
        price: Number(price), durationMinutes: Number(durationMinutes),
      });
      router.push('/admin/boat-types');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update boat type'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="mx-auto max-w-lg px-4 py-8 text-zinc-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Boat Type</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Capacity</label>
            <input type="number" required min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Seats</label>
            <input type="number" required min={1} value={seats} onChange={(e) => setSeats(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Price (฿)</label>
            <input type="number" required min={1} value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Duration (min)</label>
            <input type="number" required min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={() => router.push('/admin/boat-types')} className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
