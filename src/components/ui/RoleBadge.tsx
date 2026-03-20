/**
 * src/components/ui/RoleBadge.tsx
 * Oracle Document sections consumed: 2, 7, 10
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type { UserRole } from '@/types/models';

interface RoleBadgeProps {
  role: UserRole | null | undefined;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  if (!role) {
    return null;
  }

  return <span className="badge badge--info">{role}</span>;
}
