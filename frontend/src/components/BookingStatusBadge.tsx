const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  checked_in: 'bg-purple-50 text-purple-700',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-blue-50 text-blue-700',
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${statusColors[status] || ''}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
