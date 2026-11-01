export default function Loading() {
  return (
    <div className="mx-auto grid max-w-6xl animate-pulse gap-8 px-4 py-10 md:grid-cols-2" aria-hidden="true">
      <div className="aspect-[3/4] rounded-3xl bg-surface-2" />
      <div className="space-y-4">
        <div className="h-12 w-1/2 rounded-xl bg-surface-2" />
        <div className="h-40 rounded-2xl bg-surface-2" />
        <div className="h-24 rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}
