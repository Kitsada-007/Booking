const statusColors: Record<string, string> = {
  pending_payment: 'bg-zinc-100 text-zinc-600',
  confirmed: 'bg-zinc-200 text-zinc-700',
  checked_in: 'bg-zinc-300 text-zinc-800',
  cancelled: 'bg-zinc-100 text-zinc-400 line-through',
  completed: 'bg-zinc-800 text-white',
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${statusColors[status] || ''}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
