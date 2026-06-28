'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

interface SettingFields {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  facebook: string;
  line: string;
  businessHours: string;
  terms: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SettingFields>({
    name: '', address: '', latitude: '', longitude: '', phone: '', email: '',
    facebook: '', line: '', businessHours: '', terms: '',
  });
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [newBank, setNewBank] = useState({ bankName: '', accountName: '', accountNumber: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [settingsData, bankData] = await Promise.all([
          apiClient.get<SettingFields>('/settings'),
          apiClient.get<BankAccount[]>('/settings/bank-accounts'),
        ]);
        setForm({
          name: settingsData.name || '',
          address: settingsData.address || '',
          latitude: settingsData.latitude != null ? String(settingsData.latitude) : '',
          longitude: settingsData.longitude != null ? String(settingsData.longitude) : '',
          phone: settingsData.phone || '',
          email: settingsData.email || '',
          facebook: settingsData.facebook || '',
          line: settingsData.line || '',
          businessHours: settingsData.businessHours || '',
          terms: settingsData.terms || '',
        });
        setAccounts(bankData);
      } catch { setError('Failed to load settings'); }
      finally { setLoading(false); }
    })();
  }, []);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = { ...form };
      if (body.latitude) body.latitude = Number(body.latitude);
      else delete body.latitude;
      if (body.longitude) body.longitude = Number(body.longitude);
      else delete body.longitude;
      const updated = await apiClient.patch<SettingFields>('/settings', body);
      setForm({
        name: updated.name || '',
        address: updated.address || '',
        latitude: updated.latitude != null ? String(updated.latitude) : '',
        longitude: updated.longitude != null ? String(updated.longitude) : '',
        phone: updated.phone || '',
        email: updated.email || '',
        facebook: updated.facebook || '',
        line: updated.line || '',
        businessHours: updated.businessHours || '',
        terms: updated.terms || '',
      });
    } catch { setError('Failed to save settings'); }
    finally { setSaving(false); }
  }

  async function addBank(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const account = await apiClient.post<BankAccount>('/settings/bank-accounts', newBank);
      setAccounts([...accounts, account]);
      setNewBank({ bankName: '', accountName: '', accountNumber: '' });
    } catch { setError('Failed to add bank account'); }
  }

  async function removeBank(id: string) {
    try {
      await apiClient.delete(`/settings/bank-accounts/${id}`);
      setAccounts(accounts.filter((a) => a.id !== id));
    } catch { setError('Failed to delete bank account'); }
  }

  if (!user || (user.role !== 'admin' && user.role !== 'room_staff' && user.role !== 'boat_staff')) return <div className="p-8 text-center text-zinc-500">Access denied</div>;
  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8 text-zinc-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-10">
      <h1 className="text-2xl font-bold">Settings</h1>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Resort Info */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Resort Information</h2>
        <form onSubmit={saveSettings} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="resortName" className="block text-sm font-medium">Resort name</label>
              <input id="resortName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="resortPhone" className="block text-sm font-medium">Phone</label>
              <input id="resortPhone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="resortAddress" className="block text-sm font-medium">Address</label>
            <input id="resortAddress" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium">Latitude</label>
              <input id="latitude" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g. 13.7367" />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium">Longitude</label>
              <input id="longitude" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g. 100.5232" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="resortEmail" className="block text-sm font-medium">Email</label>
              <input id="resortEmail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="businessHours" className="block text-sm font-medium">Business hours</label>
              <input id="businessHours" value={form.businessHours} onChange={(e) => setForm({ ...form, businessHours: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="resortFacebook" className="block text-sm font-medium">Facebook</label>
              <input id="resortFacebook" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="resortLine" className="block text-sm font-medium">LINE ID</label>
              <input id="resortLine" value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="terms" className="block text-sm font-medium">Terms & conditions</label>
            <textarea id="terms" rows={3} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={saving} className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </form>
      </section>

      {/* Bank Accounts */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Bank Accounts</h2>
        <div className="mb-4 space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between rounded border border-zinc-200 px-4 py-3 text-sm">
              <div>
                <span className="font-medium">{acc.bankName}</span> — {acc.accountName}: {acc.accountNumber}
              </div>
              <button onClick={() => removeBank(acc.id)} className="text-red-600 hover:text-red-800">Remove</button>
            </div>
          ))}
          {accounts.length === 0 && <p className="text-sm text-zinc-400">No bank accounts configured.</p>}
        </div>
        <form onSubmit={addBank} className="flex gap-2">
          <input aria-label="Bank name" placeholder="Bank name" value={newBank.bankName} onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })} className="block w-1/4 rounded border border-zinc-300 px-3 py-2 text-sm" required />
          <input aria-label="Account name" placeholder="Account name" value={newBank.accountName} onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })} className="block w-1/3 rounded border border-zinc-300 px-3 py-2 text-sm" required />
          <input aria-label="Account number" placeholder="Account number" value={newBank.accountNumber} onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })} className="block w-1/4 rounded border border-zinc-300 px-3 py-2 text-sm" required />
          <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Add</button>
        </form>
      </section>
    </div>
  );
}
