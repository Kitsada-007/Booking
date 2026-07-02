const statusColors: Record<string, string> = {
  pending_payment: 'badge badge-neutral gap-1 border-none',
  confirmed: 'badge badge-info gap-1 text-white border-none',
  checked_in: 'badge badge-primary gap-1 border-none',
  cancelled: 'badge badge-ghost opacity-60 line-through gap-1 border-none',
  completed: 'badge badge-success text-white gap-1 border-none',
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2.5 py-3 text-xs font-bold capitalize ${statusColors[status] || ''}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
