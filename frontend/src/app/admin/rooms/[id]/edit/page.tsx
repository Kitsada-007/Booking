'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditRoomPage(props: EditPageProps) {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [status, setStatus] = useState('available');
  const [roomTypes, setRoomTypes] = useState<{ id: string; name: string }[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const roomTypesRes = await apiClient.get<{ data: { id: string; name: string }[] }>('/room-types');
        setRoomTypes(roomTypesRes.data);

        const { id } = await props.params;
        const rooms = await apiClient.get<{ id: string; roomNumber: string; roomTypeId: string; roomType: { id: string; name: string }; status: string; description?: string }[]>('/rooms');
        const found = rooms.find((r: { id: string }) => r.id === id);
        if (found) {
          setRoomNumber(found.roomNumber);
          setRoomTypeId(found.roomTypeId);
          setStatus(found.status);
          setDescription(found.description || '');
        }
      } catch {
        setError('Failed to load room');
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
      await apiClient.patch(`/rooms/${id}`, {
        roomNumber,
        roomTypeId,
        status,
        description: description || undefined,
      });
      router.push('/admin/rooms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update room');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-md px-4 py-8 text-zinc-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Room</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-zinc-100 p-3 text-sm text-zinc-700">{error}</div>}

        <div>
          <label htmlFor="roomNumber" className="block text-sm font-medium">Room number</label>
          <input id="roomNumber" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </div>

        <div>
          <label htmlFor="roomTypeId" className="block text-sm font-medium">Room type</label>
          <select id="roomTypeId" required value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none">
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none">
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">Description</label>
          <textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={() => router.push('/admin/rooms')} className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
