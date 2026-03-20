/**
 * src/components/ui/Pagination.tsx
 * Oracle Document sections consumed: 5, 7, 9, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="button-row" style={{ justifyContent: 'space-between' }}>
      <button className="button button--secondary" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span className="muted" aria-live="polite">
        Page {page} of {totalPages || 1}
      </span>
      <button className="button button--secondary" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
