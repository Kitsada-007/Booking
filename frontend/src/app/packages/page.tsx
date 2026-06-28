'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface PackageItem {
  id: string;
  name: string;
  roomQuantity: number;
  price: number;
  startDate: string;
  endDate: string;
  details?: string;
  roomType: { id: string; name: string; price: number; images: string[] };
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const result = await apiClient.get<{ data: PackageItem[] }>('/packages?activeOnly=true');
        setPackages(result.data);
      } catch { setError('Failed to load packages'); setPackages([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Room Packages</h1>
      <p className="mb-8 text-zinc-500">Special deals bundling rooms and boat passes</p>

      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? <p className="text-zinc-400">Loading...</p> : packages.length === 0 ? (
        <p className="text-zinc-500">No packages available.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded border border-zinc-200 p-5">
              {pkg.roomType.images.length > 0 && (
                <img src={pkg.roomType.images[0]} alt="" className="mb-3 h-40 w-full rounded object-cover" />
              )}
              <h2 className="text-lg font-semibold">{pkg.name}</h2>
              <p className="text-sm text-zinc-500 mt-1">{pkg.roomType.name} · {pkg.roomQuantity} room(s)</p>
              <p className="mt-2 text-2xl font-bold">฿{pkg.price.toLocaleString()}</p>
              <p className="text-xs text-zinc-400 mt-1">{new Date(pkg.startDate).toLocaleDateString()} — {new Date(pkg.endDate).toLocaleDateString()}</p>
              {pkg.details && <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{pkg.details}</p>}
              <Link
                href={`/book/rooms?roomTypeId=${pkg.roomType.id}&packageId=${pkg.id}`}
                className="mt-4 inline-block w-full rounded bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800"
              >
                Book this package
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
