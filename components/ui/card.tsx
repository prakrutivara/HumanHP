import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function EmptyState({ title, description, eyebrow }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      {children}
    </section>
  );
}
