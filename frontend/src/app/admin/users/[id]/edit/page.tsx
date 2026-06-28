'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { User } from '@/lib/auth-context';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage(props: EditPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'room_staff' | 'boat_staff'>('room_staff');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { id } = await props.params;
        const users = await apiClient.get<{ data: User[] }>(`/users`);
        const found = users.data.find((u: User) => u.id === id);
        if (found) {
          setUser(found);
          setRole(found.role as 'room_staff' | 'boat_staff');
          setStatus(found.status as 'active' | 'inactive');
        }
      } catch {
        setError('Failed to load user');
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
      await apiClient.patch(`/users/${id}`, { role, status });
      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-8 text-zinc-400">Loading...</div>;
  }

  if (!user) {
    return <div className="mx-auto max-w-md px-4 py-8 text-zinc-500">User not found</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Staff User</h1>
      <p className="mb-4 text-sm text-zinc-500">{user.email}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded bg-zinc-100 p-3 text-sm text-zinc-700">{error}</div>
        )}

        <div>
          <label htmlFor="role" className="block text-sm font-medium">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'room_staff' | 'boat_staff')}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            <option value="room_staff">Room Staff</option>
            <option value="boat_staff">Boat Staff</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
