import type { ReactNode } from "react";

/** Section title: English display word plus localized subtitle. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-blush border-b border-border">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 text-center md:pb-10 md:pt-14">
        <p
          aria-hidden="true"
          className="text-brand-gradient font-display text-4xl font-bold tracking-[0.2em] md:text-5xl"
        >
          {eyebrow}
        </p>
        <h1 className="mt-2 text-lg font-bold text-ink md:text-xl">{title}</h1>
        <div aria-hidden="true" className="mx-auto mt-3 flex items-center justify-center gap-2 text-primary-soft">
          <span className="h-px w-10 bg-current" />
          <span className="text-xs">♥</span>
          <span className="h-px w-10 bg-current" />
        </div>
        {lead && <p className="mx-auto mt-4 max-w-2xl text-sm text-muted">{lead}</p>}
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6 text-center">
      <p aria-hidden="true" className="text-brand-gradient font-display text-2xl font-bold tracking-[0.18em] md:text-3xl">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-sm font-bold text-muted">{title}</h2>
    </div>
  );
}
