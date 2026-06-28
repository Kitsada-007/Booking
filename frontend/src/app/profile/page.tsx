'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  lineId?: string;
  facebook?: string;
  profileImage?: string;
  role: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lineId, setLineId] = useState('');
  const [facebook, setFacebook] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      if (!user) { setLoading(false); return; }
      try {
        const data = await apiClient.get<Profile>('/users/me');
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setLineId(data.lineId || '');
        setFacebook(data.facebook || '');
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await apiClient.patch<Profile>('/users/me', {
        firstName, lastName, email, phone: phone || undefined,
        address: address || undefined, lineId: lineId || undefined,
        facebook: facebook || undefined,
      });
      setProfile(updated);
      setSuccess('Profile updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setSavingPassword(true);
    try {
      await apiClient.patch('/users/me/password', { currentPassword, newPassword });
      setSuccess('Password changed');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
    setSavingPassword(false);
  }

  if (!user) return <div className="mx-auto max-w-lg px-4 py-16 text-center"><Link href="/login?redirect=/profile" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Sign in</Link></div>;
  if (loading) return <div className="mx-auto max-w-lg px-4 py-8 text-zinc-400">Loading...</div>;
  if (!profile) return <div className="mx-auto max-w-lg px-4 py-8 text-red-600">Profile not found</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <p className="text-sm text-zinc-500 mb-6 capitalize">Role: {profile.role.replace('_', ' ')}</p>

      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium">First name</label>
            <input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium">Last name</label>
            <input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label htmlFor="profileEmail" className="block text-sm font-medium">Email</label>
          <input id="profileEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label htmlFor="profilePhone" className="block text-sm font-medium">Phone</label>
          <input id="profilePhone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label htmlFor="profileAddress" className="block text-sm font-medium">Address</label>
          <textarea id="profileAddress" value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="lineId" className="block text-sm font-medium">LINE ID</label>
            <input id="lineId" type="text" value={lineId} onChange={(e) => setLineId(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="facebook" className="block text-sm font-medium">Facebook</label>
            <input id="facebook" type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full rounded bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <hr className="my-8 border-zinc-200" />

      <h2 className="text-lg font-bold mb-4">Change Password</h2>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium">Current password</label>
          <input id="currentPassword" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium">New password</label>
          <input id="newPassword" type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirm new password</label>
          <input id="confirmPassword" type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={savingPassword}
          className="w-full rounded border border-zinc-300 px-4 py-3 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50">
          {savingPassword ? 'Changing...' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
