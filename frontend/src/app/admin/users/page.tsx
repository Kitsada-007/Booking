'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth, type User } from '@/lib/auth-context';

interface PaginatedResponse {
  data: User[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async (page: number) => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (role) params.set('role', role);
    if (status) params.set('status', status);

    const result = await apiClient.get<PaginatedResponse>(`/users?${params}`);
    setUsers(result.data);
    setPagination(result.pagination);
  }, [role, status]);

  useEffect(() => {
    const init = async () => {
      await loadUsers(1);
      setLoading(false);
    };
    init();
  }, [loadUsers]);

  const goToPage = useCallback(async (page: number) => {
    setLoading(true);
    await loadUsers(page);
    setLoading(false);
  }, [loadUsers]);

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-zinc-500">Access denied</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff Users</h1>
        <Link
          href="/admin/users/create"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Create user
        </Link>
      </div>

      <div className="mb-4 flex gap-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="room_staff">Room Staff</option>
          <option value="boat_staff">Boat Staff</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : users.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">No users found.</p>
      ) : (
        <>
          <div className="overflow-hidden rounded border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        u.status === 'active'
                          ? 'bg-zinc-200 text-zinc-700'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${u.id}/edit`}
                        className="text-sm text-zinc-600 hover:text-zinc-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <button
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
                className="rounded px-3 py-1 hover:bg-zinc-100 disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-zinc-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
                className="rounded px-3 py-1 hover:bg-zinc-100 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
