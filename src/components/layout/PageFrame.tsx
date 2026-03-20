/**
 * src/components/layout/PageFrame.tsx
 * Oracle Document sections consumed: 7, 9, 10
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type { ReactNode } from 'react';

interface PageFrameProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageFrame({ title, subtitle, actions, children }: PageFrameProps) {
  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">{title}</h1>
          {subtitle ? <p className="page__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="button-row">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
