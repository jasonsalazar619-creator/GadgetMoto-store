export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="storefront-loading"
    >
      <span aria-hidden="true" className="storefront-loading__mark" />
      <p className="type-eyebrow text-[var(--color-action)]">
        GADGETMOTO
      </p>
      <h1>Preparing your next upgrade…</h1>
    </main>
  );
}
