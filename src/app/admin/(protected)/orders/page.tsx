import { setManualPaymentStatusAction } from "./actions";
import {
  getAdminPaymentReviews,
  type AdminPaymentReview,
} from "@/lib/admin/server/payments";

type AdminOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const paymentMethodLabels: Record<AdminPaymentReview["paymentMethod"], string> = {
  maya_online: "Maya Online",
  maya_manual: "Maya Manual Transfer",
  gcash: "GCash",
  bank_transfer: "Bank Transfer",
  cash_on_pickup: "Cash on Store Pickup",
};

function formatMoney(centavos: number | null): string {
  if (centavos === null) return "Pending confirmation";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: centavos % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: AdminPaymentReview["paymentStatus"]): string {
  if (status === "paid") return "Paid / Verified";
  if (status === "failed") return "Rejected / Needs Review";
  return "Pending Verification";
}

function statusClass(status: AdminPaymentReview["paymentStatus"]): string {
  if (status === "paid") return "bg-emerald-100 text-emerald-800";
  if (status === "failed") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-900";
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const [reviews, params] = await Promise.all([
    getAdminPaymentReviews(),
    searchParams,
  ]);
  const state = typeof params.state === "string" ? params.state : "";

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
          Review manual payment states. An order can be marked paid only
          after its confirmed total and recorded payment amount match.
        </p>
      </header>

      {state === "updated" ? (
        <p className="mt-6 rounded-[var(--radius-md)] bg-emerald-50 p-4 font-bold text-emerald-800" role="status">
          Payment status updated and audit logged.
        </p>
      ) : null}
      {state === "update-failed" ? (
        <p className="mt-6 rounded-[var(--radius-md)] bg-rose-50 p-4 font-bold text-rose-800" role="alert">
          The payment status could not be updated safely. Refresh and review the confirmed amounts.
        </p>
      ) : null}

      {reviews === null ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border bg-white p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-xl font-bold">Payment review unavailable</h2>
          <p className="mt-2 leading-7 text-[var(--color-muted)]">
            The secure manual-payment database update must be deployed before this queue can be used.
          </p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border bg-white p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-xl font-bold">No manual payments to review</h2>
          <p className="mt-2 text-[var(--color-muted)]">
            New submitted orders will appear here without being marked paid.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5">
          {reviews.map((review) => {
            const approvalReady =
              review.finalTotalCentavos !== null &&
              review.paymentAmountCentavos !== null &&
              review.finalTotalCentavos === review.paymentAmountCentavos &&
              review.paymentStatus !== "paid";
            const canReject =
              review.paymentStatus !== "paid" &&
              review.paymentStatus !== "failed";

            return (
              <article className="rounded-[var(--radius-lg)] border bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6" key={review.paymentId}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-action)]">
                      {review.publicOrderNumber}
                    </p>
                    <h2 className="mt-1 text-xl font-bold">
                      {review.customerFullName}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(review.paymentStatus)}`}>
                    {statusLabel(review.paymentStatus)}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <dt className="text-[var(--color-muted)]">Contact</dt>
                    <dd className="mt-1 font-bold">
                      {review.customerMobile}
                      {review.customerEmail ? <><br />{review.customerEmail}</> : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">Method</dt>
                    <dd className="mt-1 font-bold">{paymentMethodLabels[review.paymentMethod]}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">Merchandise subtotal</dt>
                    <dd className="mt-1 font-bold">{formatMoney(review.merchandiseSubtotalCentavos)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">Confirmed total / payment</dt>
                    <dd className="mt-1 font-bold">
                      {formatMoney(review.finalTotalCentavos)} / {formatMoney(review.paymentAmountCentavos)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 text-sm text-[var(--color-muted)]">
                  Order status: <strong className="text-[var(--color-ink)]">{review.orderStatus.replaceAll("_", " ")}</strong>
                </p>
                {!approvalReady && review.paymentStatus !== "paid" ? (
                  <p className="mt-2 text-sm text-amber-800">
                    Paid / Verified stays unavailable until the confirmed order total and recorded payment amount exist and match.
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <form action={setManualPaymentStatusAction}>
                    <input name="paymentId" type="hidden" value={review.paymentId} />
                    <input name="status" type="hidden" value="paid" />
                    <button className="min-h-11 rounded-[var(--radius-round)] bg-emerald-700 px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-45" disabled={!approvalReady} type="submit">
                      Mark Paid / Verified
                    </button>
                  </form>
                  <form action={setManualPaymentStatusAction}>
                    <input name="paymentId" type="hidden" value={review.paymentId} />
                    <input name="status" type="hidden" value="failed" />
                    <button className="min-h-11 rounded-[var(--radius-round)] border border-rose-300 px-5 font-bold text-rose-800 disabled:cursor-not-allowed disabled:opacity-45" disabled={!canReject} type="submit">
                      Rejected / Needs Review
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
