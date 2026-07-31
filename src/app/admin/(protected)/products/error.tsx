"use client";

export default function AdminProductsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      aria-labelledby="products-error-title"
      className="rounded-[var(--radius-xl)] border bg-white p-8 shadow-[var(--shadow-md)]"
    >
      <p className="type-eyebrow text-[var(--color-error)]">Unable to load</p>
      <h1 className="mt-3 text-3xl font-bold" id="products-error-title">
        Product management is temporarily unavailable
      </h1>
      <p className="mt-4 max-w-2xl text-[var(--color-muted)]">
        No product changes were made. Check the administrator session and
        configuration, then try again.
      </p>
      <button
        className="mt-6 min-h-11 rounded-[var(--radius-round)] bg-[var(--color-action)] px-5 font-bold text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}
