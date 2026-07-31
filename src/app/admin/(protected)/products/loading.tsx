export default function AdminProductsLoading() {
  return (
    <div aria-live="polite" className="grid gap-6" role="status">
      <div className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-white" />
      <div className="h-40 animate-pulse rounded-[var(--radius-lg)] bg-white" />
      <div className="h-96 animate-pulse rounded-[var(--radius-lg)] bg-white" />
      <span className="sr-only">Loading product management…</span>
    </div>
  );
}
