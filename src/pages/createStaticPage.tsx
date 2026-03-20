/**
 * src/pages/createStaticPage.tsx
 * Oracle Document sections consumed: 7, 9, 10
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { PageFrame } from '@/components/layout/PageFrame';
import { EmptyState } from '@/components/ui/EmptyState';

export const createStaticPage = (title: string, subtitle: string, body: string, actionLabel?: string, onAction?: () => void) => {
  return function StaticPage() {
    return (
      <PageFrame title={title} subtitle={subtitle}>
        <EmptyState
          title={title}
          body={body}
          action={actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined}
        />
      </PageFrame>
    );
  };
};
