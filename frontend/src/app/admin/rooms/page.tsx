'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomType: { id: string; name: string };
  status: string;
  description?: string;
}

export default function AdminRoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams();
      if (roomTypeFilter) params.set('roomTypeId', roomTypeFilter);
      if (statusFilter) params.set('status', statusFilter);

      try {
        const result = await apiClient.get<Room[]>(`/rooms?${params}`);
        setRooms(result);
      } catch {
        setRooms([]);
      }
      setLoading(false);
    };
    load();
  }, [roomTypeFilter, statusFilter]);

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-zinc-500">Access denied</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <Link href="/admin/rooms/create" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Create room
        </Link>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          placeholder="Filter by room type ID"
          value={roomTypeFilter}
          onChange={(e) => setRoomTypeFilter(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-zinc-300 px-3 py-1.5 text-sm">
          <option value="">All status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {loading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : rooms.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">No rooms found.</p>
      ) : (
        <div className="overflow-hidden rounded border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Room #</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Type</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{r.roomNumber}</td>
                  <td className="px-4 py-3">{r.roomType.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      r.status === 'available' ? 'bg-zinc-100 text-zinc-700' :
                      r.status === 'occupied' ? 'bg-zinc-200 text-zinc-800' :
                      'bg-zinc-100 text-zinc-500'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/rooms/${r.id}/edit`} className="text-sm text-zinc-600 hover:text-zinc-900">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
