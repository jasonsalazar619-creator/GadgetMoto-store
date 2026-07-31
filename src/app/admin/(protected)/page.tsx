import { getAdminCatalogSummary } from "@/lib/admin/server/catalog-summary";

const summaryLabels = [
  ["total", "Total products"],
  ["active", "Active products"],
  ["comingSoon", "Coming Soon"],
  ["draft", "Draft products"],
  ["archived", "Archived products"],
] as const;

export default async function AdminDashboardPage() {
  const summary = await getAdminCatalogSummary();

  return (
    <>
      <header className="rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,var(--color-action),#123d70)] p-6 text-white shadow-[var(--shadow-md)] sm:p-10">
        <p className="type-eyebrow text-sky-200">Authenticated workspace</p>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
          Admin dashboard
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-sky-50">
          Secure administrator access is active. Product editing, uploads, and
          autosave will be enabled in controlled follow-up checkpoints.
        </p>
      </header>

      <section aria-labelledby="catalog-summary-title" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="type-eyebrow text-[var(--color-action)]">Catalog</p>
            <h2
              className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-[-0.035em]"
              id="catalog-summary-title"
            >
              Product summary
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Read-only during this checkpoint
          </p>
        </div>

        {summary ? (
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {summaryLabels.map(([key, label]) => (
              <div
                className="rounded-[var(--radius-lg)] border bg-white p-5 shadow-[var(--shadow-sm)]"
                key={key}
              >
                <dt className="text-sm font-bold text-[var(--color-muted)]">
                  {label}
                </dt>
                <dd className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-ink)]">
                  {summary[key]}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-5 rounded-[var(--radius-lg)] border bg-white p-6 shadow-[var(--shadow-sm)]">
            <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold">
              Catalog summary unavailable
            </h3>
            <p className="mt-2 max-w-2xl leading-7 text-[var(--color-muted)]">
              The administrator session is valid, but confirmed catalog counts
              could not be loaded safely. No placeholder counts are shown.
            </p>
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Authentication", "Server-verified administrator access is active."],
          ["Product management", "Product CRUD is scheduled for the next checkpoint."],
          ["Image workflow", "Secure Storage uploads and gallery controls remain pending."],
        ].map(([title, description]) => (
          <article
            className="rounded-[var(--radius-lg)] border bg-white p-6"
            key={title}
          >
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold">
              {title}
            </h2>
            <p className="mt-3 leading-7 text-[var(--color-muted)]">
              {description}
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
