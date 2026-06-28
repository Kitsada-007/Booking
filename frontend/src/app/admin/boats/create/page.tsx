'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function CreateBoatPage() {
  const router = useRouter();
  const [boatNumber, setBoatNumber] = useState('');
  const [boatTypeId, setBoatTypeId] = useState('');
  const [boatTypes, setBoatTypes] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await apiClient.get<{ data: { id: string; name: string }[] }>('/boat-types');
      setBoatTypes(result.data);
    })();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiClient.post('/boats', { boatNumber, boatTypeId });
      router.push('/admin/boats');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create boat'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Create Boat</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm font-medium">Boat number</label>
          <input required value={boatNumber} onChange={(e) => setBoatNumber(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium">Boat type</label>
          <select required value={boatTypeId} onChange={(e) => setBoatTypeId(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Select a type</option>
            {boatTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create boat'}
          </button>
          <button type="button" onClick={() => router.push('/admin/boats')} className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
