// Shared class strings for the admin panel (Tailwind, brand tokens from globals.css).

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60";

export const btn = {
  primary: `${base} bg-primary px-4 py-2 text-sm text-white shadow-sm hover:bg-primary-hover`,
  secondary: `${base} border border-border bg-white px-4 py-2 text-sm text-ink hover:border-primary hover:text-primary`,
  danger: `${base} border border-red-200 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50`,
  ghost: `${base} px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-primary`,
  icon: `${base} h-8 w-8 border border-border bg-white text-muted hover:border-primary hover:text-primary`,
  small: `${base} border border-border bg-white px-3 py-1 text-xs text-ink hover:border-primary hover:text-primary`,
  smallDanger: `${base} border border-red-200 bg-white px-3 py-1 text-xs text-red-700 hover:bg-red-50`,
};

export const input =
  "block w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink shadow-xs placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:bg-surface-2";

export const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted";

export const card = "rounded-2xl border border-border/70 bg-white shadow-[0_1px_2px_rgba(42,14,28,0.04)]";
