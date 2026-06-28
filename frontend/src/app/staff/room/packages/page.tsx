'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface RoomType { id: string; name: string }
interface PackageItem {
  id: string;
  name: string;
  roomTypeId: string;
  roomQuantity: number;
  price: number;
  startDate: string;
  endDate: string;
  details?: string;
  isActive: boolean;
  roomType: RoomType;
}

export default function StaffPackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canAccess = user && (user.role === 'admin' || user.role === 'room_staff');

  const [name, setName] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomQuantity, setRoomQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [details, setDetails] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!canAccess) { setLoading(false); return; }
      const [pkgData, rtData] = await Promise.all([
        apiClient.get<{ data: PackageItem[] }>('/packages').then((r) => r.data).catch(() => []),
        apiClient.get<{ data: RoomType[] }>('/room-types').then((r) => r.data).catch(() => []),
      ]);
      setPackages(pkgData);
      setRoomTypes(rtData);
      setLoading(false);
    };
    load();
  }, [canAccess]);

  function resetForm() {
    setName(''); setRoomTypeId(''); setRoomQuantity('1'); setPrice('');
    setStartDate(''); setEndDate(''); setDetails(''); setIsActive(true);
    setEditingId(null); setShowForm(false);
  }

  function editItem(pkg: PackageItem) {
    setName(pkg.name); setRoomTypeId(pkg.roomTypeId);
    setRoomQuantity(String(pkg.roomQuantity)); setPrice(String(pkg.price));
    setStartDate(pkg.startDate.slice(0, 10)); setEndDate(pkg.endDate.slice(0, 10));
    setDetails(pkg.details || ''); setIsActive(pkg.isActive);
    setEditingId(pkg.id); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { name, roomTypeId, roomQuantity: Number(roomQuantity), price: Number(price), startDate, endDate, details: details || undefined, isActive };
    try {
      if (editingId) {
        const updated = await apiClient.patch<PackageItem>(`/packages/${editingId}`, body);
        setPackages(packages.map((p) => p.id === editingId ? updated : p));
      } else {
        const created = await apiClient.post<PackageItem>('/packages', body);
        setPackages([...packages, created]);
      }
      resetForm();
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this package?')) return;
    try {
      await apiClient.delete(`/packages/${id}`);
      setPackages(packages.filter((p) => p.id !== id));
    } catch { /* ignore */ }
  }

  if (!user) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-500">Sign in required</div>;
  if (!canAccess) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-500">Access denied</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Room Packages</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Add package
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded border border-zinc-200 p-4 space-y-3">
          <h2 className="font-semibold text-sm">{editingId ? 'Edit' : 'New'} package</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Room type</label>
              <select required value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm">
                <option value="">Select...</option>
                {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Room quantity</label>
              <input type="number" required min={1} value={roomQuantity} onChange={(e) => setRoomQuantity(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Price (฿)</label>
              <input type="number" required min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Start date</label>
              <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End date</label>
              <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Details</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="rounded border border-zinc-300 px-4 py-2 text-xs hover:bg-zinc-50">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-zinc-400">Loading...</p> : packages.length === 0 ? (
        <p className="text-zinc-500">No packages yet.</p>
      ) : (
        <div className="space-y-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex items-center justify-between rounded border border-zinc-200 px-4 py-3 text-sm">
              <div className="flex gap-4 items-center">
                <span className="font-medium">{pkg.name}</span>
                <span className="text-zinc-500">{pkg.roomType.name}</span>
                <span className="text-zinc-500">฿{pkg.price.toLocaleString()}</span>
                <span className="text-xs text-zinc-400">{new Date(pkg.startDate).toLocaleDateString()} — {new Date(pkg.endDate).toLocaleDateString()}</span>
                {!pkg.isActive && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">Inactive</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => editItem(pkg)} className="text-xs text-zinc-600 hover:text-zinc-900">Edit</button>
                <button onClick={() => handleDelete(pkg.id)} className="text-xs text-zinc-500 hover:text-zinc-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
