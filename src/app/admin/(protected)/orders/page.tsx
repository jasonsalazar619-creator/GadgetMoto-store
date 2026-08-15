import { AdminOrdersReview } from "@/components/admin/admin-orders-review";
import { getAdminPaymentReviewPage } from "@/lib/admin/server/payments";

type AdminOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readPage(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^\d{1,9}$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const page = await getAdminPaymentReviewPage(readPage(params.page));

  return (
    <section aria-labelledby="admin-orders-title">
      <header>
        <p className="type-eyebrow text-[var(--color-action)]">
          Manual payment approval
        </p>
        <h1
          className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-[-0.045em] sm:text-5xl"
          id="admin-orders-title"
        >
          Orders and payments
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-[var(--color-muted)]">
          Select an order from the table to review its details. Confirmed
          merchandise, delivery, VAT, and recorded payment amounts must match
          before an order can be marked paid.
        </p>
      </header>

      {page ? (
        <AdminOrdersReview initialPage={page} />
      ) : (
        <div className="mt-8 rounded-[var(--radius-lg)] border bg-white p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-xl font-bold">
            Payment review is temporarily unavailable.
          </h2>
          <p className="mt-2 leading-7 text-[var(--color-muted)]">
            The manual-payment database connection could not be verified.
            Check the server configuration or database permissions.
          </p>
        </div>
      )}
    </section>
  );
}
