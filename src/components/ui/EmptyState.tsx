/**
 * src/components/ui/EmptyState.tsx
 * Oracle Document sections consumed: 7, 9, 10
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
interface EmptyStateProps {
  title: string;
  body: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <section className="card" style={{ padding: '1.25rem' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="muted">{body}</p>
      {action ? (
        <button className="button" type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </section>
  );
}
