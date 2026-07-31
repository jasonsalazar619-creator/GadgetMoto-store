import { getAdminCatalogSummary } from "@/lib/admin/server/catalog-summary";

export default async function AdminProductsPlaceholderPage() {
  const summary = await getAdminCatalogSummary();

  return (
    <section
      aria-labelledby="admin-products-title"
      className="rounded-[var(--radius-xl)] border bg-white p-6 shadow-[var(--shadow-md)] sm:p-10"
    >
      <p className="type-eyebrow text-[var(--color-action)]">
        Protected module
      </p>
      <h1
        className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-[-0.045em] sm:text-5xl"
        id="admin-products-title"
      >
        Product management
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
        The secure product-management workspace is being activated in the next
        checkpoint. Editing, creation, archive controls, uploads, and autosave
        are intentionally unavailable here.
      </p>

      {summary ? (
        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Total products", summary.total],
            ["Active products", summary.active],
            ["Coming Soon", summary.comingSoon],
          ].map(([label, value]) => (
            <div
              className="rounded-[var(--radius-md)] bg-[var(--color-ice)] p-5"
              key={label}
            >
              <dt className="text-sm font-bold text-[var(--color-muted)]">
                {label}
              </dt>
              <dd className="mt-2 text-3xl font-bold text-[var(--color-ink)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-8 rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] p-5 text-[var(--color-warning)]">
          Confirmed product counts are temporarily unavailable. No estimated
          values are displayed.
        </p>
      )}

      <div className="mt-8 border-t pt-6">
        <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold">
          Coming next
        </h2>
        <ul className="mt-4 grid gap-3 text-[var(--color-muted)] sm:grid-cols-2">
          <li>Search, status filters, and catalog ordering</li>
          <li>Explicit draft product creation</li>
          <li>Validated product and variant editing</li>
          <li>Controlled image and gallery management</li>
        </ul>
      </div>
    </section>
  );
}
