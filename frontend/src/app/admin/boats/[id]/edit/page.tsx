'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface EditPageProps { params: Promise<{ id: string }> }

export default function EditBoatPage(props: EditPageProps) {
  const router = useRouter();
  const [boatNumber, setBoatNumber] = useState('');
  const [boatTypeId, setBoatTypeId] = useState('');
  const [boatTypes, setBoatTypes] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const types = await apiClient.get<{ data: { id: string; name: string }[] }>('/boat-types');
        setBoatTypes(types.data);
        const { id } = await props.params;
        const boats = await apiClient.get<{ id: string; boatNumber: string; boatTypeId: string; boatType: { id: string; name: string } }[]>('/boats');
        const found = boats.find((b: { id: string }) => b.id === id);
        if (found) { setBoatNumber(found.boatNumber); setBoatTypeId(found.boatTypeId); }
      } catch { setError('Failed to load boat'); }
      finally { setLoading(false); }
    })();
  }, [props.params]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { id } = await props.params;
      await apiClient.patch(`/boats/${id}`, { boatNumber, boatTypeId });
      router.push('/admin/boats');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update boat'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="mx-auto max-w-md px-4 py-8 text-zinc-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Boat</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm font-medium">Boat number</label>
          <input required value={boatNumber} onChange={(e) => setBoatNumber(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium">Boat type</label>
          <select required value={boatTypeId} onChange={(e) => setBoatTypeId(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm">
            {boatTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={() => router.push('/admin/boats')} className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
