/**
 * src/components/layout/AuthShell.tsx
 * Oracle Document sections consumed: 7, 9, 10, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="auth-shell">
      <section className="card auth-card">
        <div className="auth-card__brand">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
        {children}
      </section>
    </div>
  );
}
