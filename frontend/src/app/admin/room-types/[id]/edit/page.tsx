'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditRoomTypePage(props: EditPageProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [bedSize, setBedSize] = useState('');
  const [bedCount, setBedCount] = useState('1');
  const [hasAircon, setHasAircon] = useState(true);
  const [hasTv, setHasTv] = useState(true);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { id } = await props.params;
        const data = await apiClient.get<Record<string, unknown>>(`/room-types/${id}`);
        setName(data.name as string);
        setPrice(String(data.price));
        setCapacity(String(data.capacity));
        setBedSize((data.bedSize as string) || '');
        setBedCount(String(data.bedCount ?? 1));
        setHasAircon(data.hasAircon as boolean);
        setHasTv(data.hasTv as boolean);
        setDescription((data.description as string) || '');
      } catch {
        setError('Failed to load room type');
      } finally {
        setLoading(false);
      }
    })();
  }, [props.params]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { id } = await props.params;
      await apiClient.patch(`/room-types/${id}`, {
        name,
        price: Number(price),
        capacity: Number(capacity),
        bedSize: bedSize || undefined,
        bedCount: Number(bedCount),
        hasAircon,
        hasTv,
        description: description || undefined,
      });
      router.push('/admin/room-types');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update room type');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-lg px-4 py-8 text-zinc-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Room Type</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-zinc-100 p-3 text-sm text-zinc-700">{error}</div>}

        <div>
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium">Price (฿)</label>
            <input id="price" type="number" required min={1} value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium">Capacity</label>
            <input id="capacity" type="number" required min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bedSize" className="block text-sm font-medium">Bed size</label>
            <input id="bedSize" value={bedSize} onChange={(e) => setBedSize(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="bedCount" className="block text-sm font-medium">Bed count</label>
            <input id="bedCount" type="number" min={1} value={bedCount} onChange={(e) => setBedCount(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasAircon} onChange={(e) => setHasAircon(e.target.checked)} className="rounded" />
            Air conditioning
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasTv} onChange={(e) => setHasTv(e.target.checked)} className="rounded" />
            TV
          </label>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">Description</label>
          <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={() => router.push('/admin/room-types')} className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
