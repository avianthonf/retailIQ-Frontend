/**
 * src/components/ui/StatusBadge.tsx
 * Oracle Document sections consumed: 4, 7, 9
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  const variant = normalized.includes('ACTIVE') || normalized.includes('SUCCESS') || normalized.includes('COMPLETED') || normalized.includes('FULFILLED')
    ? 'success'
    : normalized.includes('PENDING') || normalized.includes('PROCESSING') || normalized.includes('REVIEW')
      ? 'warning'
      : normalized.includes('FAILED') || normalized.includes('CANCELLED') || normalized.includes('LOCKED')
        ? 'danger'
        : 'info';

  return <span className={`badge badge--${variant}`}>{status}</span>;
}
