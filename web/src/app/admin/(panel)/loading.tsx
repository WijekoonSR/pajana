export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-lg bg-border/60" />
      <div className="h-4 w-80 rounded bg-border/40" />
      <div className="h-48 rounded-2xl bg-white" />
      <div className="h-72 rounded-2xl bg-white" />
    </div>
  );
}
