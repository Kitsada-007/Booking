'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface BoatType { id: string; name: string }
interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  boatTypeId: string;
  boatType: BoatType;
}

export default function BoatSchedulesPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [boatTypes, setBoatTypes] = useState<BoatType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const canAccess = user && (user.role === 'admin' || user.role === 'boat_staff');

  // Form state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxBookings, setMaxBookings] = useState('10');
  const [boatTypeId, setBoatTypeId] = useState('');

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!canAccess) { setLoading(false); return; }
      const [slotsData, typesData] = await Promise.all([
        apiClient.get<TimeSlot[]>('/schedules').catch(() => []),
        apiClient.get<{ data: BoatType[] }>('/boat-types').then((r) => r.data).catch(() => []),
      ]);
      setSlots(slotsData);
      setBoatTypes(typesData);
      setLoading(false);
    };
    load();
  }, [canAccess]);

  function resetForm() {
    setStartTime(''); setEndTime(''); setMaxBookings('10'); setBoatTypeId('');
    setEditingId(null); setShowForm(false);
  }

  function editSlot(slot: TimeSlot) {
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setMaxBookings(String(slot.maxBookings));
    setBoatTypeId(slot.boatTypeId);
    setEditingId(slot.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        const updated = await apiClient.patch<TimeSlot>(`/schedules/${editingId}`, { startTime, endTime, maxBookings: Number(maxBookings), boatTypeId });
        setSlots(slots.map((s) => s.id === editingId ? updated : s));
      } else {
        const created = await apiClient.post<TimeSlot>('/schedules', { startTime, endTime, maxBookings: Number(maxBookings), boatTypeId });
        setSlots([...slots, created]);
      }
      resetForm();
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this time slot?')) return;
    try {
      await apiClient.delete(`/schedules/${id}`);
      setSlots(slots.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  }

  const grouped = boatTypes.map((bt) => ({
    ...bt,
    slots: slots.filter((s) => s.boatTypeId === bt.id),
  }));

  if (!user) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-500">Sign in required</div>;
  if (!canAccess) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-500">Access denied</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Boat Schedules</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Add time slot
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded border border-zinc-200 p-4 space-y-3">
          <h2 className="font-semibold text-sm">{editingId ? 'Edit' : 'New'} time slot</h2>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Start</label>
              <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End</label>
              <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Max bookings</label>
              <input type="number" required min={1} value={maxBookings} onChange={(e) => setMaxBookings(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Boat type</label>
              <select required value={boatTypeId} onChange={(e) => setBoatTypeId(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm">
                <option value="">Select...</option>
                {boatTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="rounded border border-zinc-300 px-4 py-2 text-xs hover:bg-zinc-50">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-zinc-400">Loading...</p> : grouped.length === 0 ? (
        <p className="text-zinc-500">No boat types found. Create one first.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.id}>
              <h2 className="text-lg font-semibold mb-2">{group.name}</h2>
              {group.slots.length === 0 ? (
                <p className="text-sm text-zinc-400">No time slots for this boat type.</p>
              ) : (
                <div className="space-y-2">
                  {group.slots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between rounded border border-zinc-200 px-4 py-3 text-sm">
                      <div className="flex gap-6">
                        <span className="font-mono">{slot.startTime} — {slot.endTime}</span>
                        <span className="text-zinc-500">Max: {slot.maxBookings}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editSlot(slot)} className="text-xs text-zinc-600 hover:text-zinc-900">Edit</button>
                        <button onClick={() => handleDelete(slot.id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
