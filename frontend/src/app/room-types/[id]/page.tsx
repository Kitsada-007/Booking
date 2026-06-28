'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { MapView } from '@/components/MapView';

interface DetailPageProps { params: Promise<{ id: string }> }

interface Review {
  id: string;
  rating: number;
  comment?: string;
  staffReply?: string;
  userName: string;
  createdAt: string;
}

interface ReviewsResponse {
  data: Review[];
  summary: { averageRating: number; totalReviews: number };
}

export default function RoomTypeDetailPage(props: DetailPageProps) {
  const [roomType, setRoomType] = useState<Record<string, unknown> | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { id } = await props.params;
        const [rtData, revData] = await Promise.all([
          apiClient.get<Record<string, unknown>>(`/room-types/${id}`),
          apiClient.get<ReviewsResponse>(`/reviews?roomTypeId=${id}`).catch(() => null),
        ]);
        setRoomType(rtData);
        if (revData) {
          setReviews(revData.data);
          setReviewSummary(revData.summary);
        }
      } catch { setError('Failed to load room details'); }
      try {
        const s = await apiClient.get<{ latitude?: number; longitude?: number }>('/settings');
        if (s.latitude && s.longitude) setMapCoords({ lat: s.latitude, lng: s.longitude });
      } catch { /* ignore */ }
      setLoading(false);
      setLoadingReviews(false);
    })();
  }, [props.params]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8 text-zinc-400">Loading...</div>;
  if (!roomType) return <div className="mx-auto max-w-3xl px-4 py-8 text-zinc-500">Room type not found</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/room-types" className="text-sm text-zinc-500 hover:text-zinc-900">&larr; Back to rooms</Link>

      {(roomType.images as string[])?.length > 0 && (
        <div className="mt-4">
          <div className="relative h-64 overflow-hidden rounded-lg sm:h-80">
            <Image src={(roomType.images as string[])[0]} alt="" fill className="object-cover" />
          </div>
          {(roomType.images as string[]).length > 1 && (
            <div className="mt-2 flex gap-2">
              {(roomType.images as string[]).slice(1).map((img, i) => (
                <div key={i} className="relative h-16 w-24 overflow-hidden rounded">
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h1 className="mt-6 text-3xl font-bold">{roomType.name as string}</h1>
      <p className="mt-2 text-3xl font-bold">฿{(roomType.price as number).toLocaleString()}</p>

      {reviewSummary.totalReviews > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
          <span className="text-zinc-400">{'★'.repeat(Math.round(reviewSummary.averageRating))}{'☆'.repeat(5 - Math.round(reviewSummary.averageRating))}</span>
          <span>{reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews} review{reviewSummary.totalReviews !== 1 ? 's' : ''})</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded border border-zinc-200 p-3">
          <span className="text-zinc-500">Capacity</span>
          <p className="font-medium">{roomType.capacity as number} guests</p>
        </div>
        <div className="rounded border border-zinc-200 p-3">
          <span className="text-zinc-500">Bed</span>
          <p className="font-medium">{roomType.bedCount as number}x {(roomType.bedSize as string) || 'bed'}</p>
        </div>
        <div className="rounded border border-zinc-200 p-3">
          <span className="text-zinc-500">Air conditioning</span>
          <p className="font-medium">{roomType.hasAircon ? 'Yes' : 'No'}</p>
        </div>
        <div className="rounded border border-zinc-200 p-3">
          <span className="text-zinc-500">TV</span>
          <p className="font-medium">{roomType.hasTv ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {!!roomType.description && (
        <p className="mt-6 text-zinc-600 leading-relaxed">{roomType.description as string}</p>
      )}

      <Link
        href={`/book/rooms?roomTypeId=${roomType.id as string}`}
        className="mt-8 inline-block rounded bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Book this room
      </Link>

      {/* Reviews section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Guest Reviews</h2>

        {loadingReviews ? (
          <p className="text-zinc-400 text-sm">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-zinc-500 text-sm">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded border border-zinc-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{review.userName}</span>
                  <span className="text-xs text-zinc-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 text-zinc-400 text-sm">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-zinc-600">{review.comment}</p>
                )}
                {review.staffReply && (
                  <div className="mt-3 rounded bg-zinc-50 p-3 text-xs">
                    <span className="font-medium text-zinc-500">Staff response:</span>
                    <p className="mt-1 text-zinc-700">{review.staffReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {mapCoords && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Location</h2>
          <MapView latitude={mapCoords.lat} longitude={mapCoords.lng} label="View on OpenStreetMap" height={250} />
        </div>
      )}
    </div>
  );
}
