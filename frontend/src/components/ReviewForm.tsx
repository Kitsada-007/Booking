'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface ReviewFormProps {
  roomTypeId: string;
  bookingId: string;
  onSuccess: () => void;
}

export function ReviewForm({ roomTypeId, bookingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating'); return; }
    setError('');
    setSubmitting(true);
    try {
      await apiClient.post('/reviews', { roomTypeId, bookingId, rating, comment: comment.trim() || undefined });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="alert alert-error text-sm p-3 shadow-sm">
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={`h-8 w-8 rounded text-lg transition-transform hover:scale-110 ${
                star <= (hover || rating) ? 'text-amber-500' : 'text-zinc-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-1">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          className="textarea textarea-bordered w-full text-sm block"
          placeholder="Share your experience..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}
