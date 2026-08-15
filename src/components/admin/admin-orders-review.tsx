"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  approveManualPaymentAction,
  setManualPaymentStatusAction,
  type PaymentActionState,
} from "@/app/admin/(protected)/orders/actions";
import type {
  AdminPaymentReview,
  AdminPaymentReviewPage,
  AdminPaymentSummary,
} from "@/lib/admin/server/payments";

type AdminOrdersReviewProps = Readonly<{
  initialPage: AdminPaymentReviewPage;
}>;

type PageResponse =
  | Readonly<{ success: true; page: AdminPaymentReviewPage }>
  | Readonly<{ success: false; message: string }>;

type DetailResponse =
  | Readonly<{ success: true; review: AdminPaymentReview }>
  | Readonly<{ success: false; message: string }>;

const initialActionState: PaymentActionState = {
  status: "idle",
  message: "",
};

const paymentMethodLabels: Record<
  AdminPaymentSummary["paymentMethod"],
  string
> = {
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

function formatInputMoney(centavos: number | null): string {
  if (centavos === null) return "";
  return (centavos / 100).toFixed(2);
}

function formatInputPercent(basisPoints: number | null): string {
  if (basisPoints === null) return "";
  return (basisPoints / 100).toFixed(2);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: AdminPaymentSummary["paymentStatus"]): string {
  if (status === "paid") return "Paid / Verified";
  if (status === "failed") return "Rejected / Needs Review";
  return "Pending Verification";
}

function statusClass(status: AdminPaymentSummary["paymentStatus"]): string {
  if (status === "paid") return "bg-emerald-100 text-emerald-800";
  if (status === "failed") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-900";
}

function pageItems(currentPage: number, pageCount: number): (number | string)[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    pageCount,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const ordered = [...pages]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right);
  const result: (number | string)[] = [];
  ordered.forEach((page, index) => {
    const previous = ordered[index - 1];
    if (previous !== undefined && page - previous > 1) {
      result.push(`ellipsis-${previous}`);
    }
    result.push(page);
  });
  return result;
}

function ActionMessage({ state }: { state: PaymentActionState }) {
  if (state.status === "idle") return null;
  return (
    <p
      className={`mt-4 rounded-[var(--radius-sm)] p-3 text-sm font-bold ${
        state.status === "success"
          ? "bg-emerald-50 text-emerald-800"
          : "bg-rose-50 text-rose-800"
      }`}
      role={state.status === "success" ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}

function PaymentDetail({
  review,
  onUpdated,
}: Readonly<{
  review: AdminPaymentReview;
  onUpdated: (message: string) => Promise<void>;
}>) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveManualPaymentAction,
    initialActionState,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    setManualPaymentStatusAction,
    initialActionState,
  );
  const handledApprove = useRef<PaymentActionState | null>(null);
  const handledReject = useRef<PaymentActionState | null>(null);

  useEffect(() => {
    if (
      approveState.status === "success" &&
      handledApprove.current !== approveState
    ) {
      handledApprove.current = approveState;
      void onUpdated(approveState.message);
    }
  }, [approveState, onUpdated]);

  useEffect(() => {
    if (
      rejectState.status === "success" &&
      handledReject.current !== rejectState
    ) {
      handledReject.current = rejectState;
      void onUpdated(rejectState.message);
    }
  }, [onUpdated, rejectState]);

  const canApprove = review.paymentStatus !== "paid";
  const canReject =
    review.paymentStatus !== "paid" && review.paymentStatus !== "failed";

  return (
    <article
      aria-labelledby="selected-order-title"
      className="mt-6 rounded-[var(--radius-lg)] border bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--color-action)]">
            {review.publicOrderNumber}
          </p>
          <h2 className="mt-1 text-2xl font-bold" id="selected-order-title">
            {review.customerFullName}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Submitted {formatDate(review.createdAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(review.paymentStatus)}`}
        >
          {statusLabel(review.paymentStatus)}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-[var(--color-muted)]">Contact</dt>
          <dd className="mt-1 font-bold">
            {review.customerMobile}
            {review.customerEmail ? (
              <>
                <br />
                {review.customerEmail}
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted)]">Method</dt>
          <dd className="mt-1 font-bold">
            {paymentMethodLabels[review.paymentMethod]}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted)]">Merchandise subtotal</dt>
          <dd className="mt-1 font-bold">
            {formatMoney(review.merchandiseSubtotalCentavos)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted)]">
            Confirmed total / payment
          </dt>
          <dd className="mt-1 font-bold">
            {formatMoney(review.finalTotalCentavos)} /{" "}
            {formatMoney(review.paymentAmountCentavos)}
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-5 border-t border-[var(--color-border)] pt-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section aria-label="Delivery details">
          <h3 className="font-bold">Delivery details</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            {review.deliveryMethod.replaceAll("_", " ")}
            {review.address ? (
              <>
                <br />
                {review.address.streetAddress}
                <br />
                {review.address.barangay}, {review.address.cityMunicipality}
                <br />
                {review.address.province} {review.address.postalCode}
              </>
            ) : (
              <>
                <br />No delivery address is attached to this order.
              </>
            )}
          </p>
        </section>
        <section aria-label="Ordered products">
          <h3 className="font-bold">Products</h3>
          <div className="mt-2 grid gap-3">
            {review.items.map((item) => (
              <article
                className="rounded-[var(--radius-sm)] bg-[var(--color-ice)] p-3 text-sm"
                key={item.orderItemId}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>{item.productName}</strong>
                  <strong>{formatMoney(item.lineTotalCentavos)}</strong>
                </div>
                <p className="mt-1 leading-6 text-[var(--color-muted)]">
                  {item.variantName}
                  {item.colorName ? ` · ${item.colorName}` : ""}
                  {item.ramGb ? ` · ${item.ramGb}GB RAM` : ""}
                  {item.storageGb ? ` · ${item.storageGb}GB storage` : ""}
                  {` · Qty ${item.quantity} · ${formatMoney(item.unitPriceCentavos)} each`}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-5 text-sm text-[var(--color-muted)]">
        Order status:{" "}
        <strong className="text-[var(--color-ink)]">
          {review.orderStatus.replaceAll("_", " ")}
        </strong>
      </p>

      {canApprove ? (
        <form
          action={approveAction}
          className="mt-6 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50/50 p-5"
        >
          <input name="paymentId" type="hidden" value={review.paymentId} />
          <div>
            <h3 className="text-lg font-bold">Confirm amounts and approve</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Enter only amounts confirmed by GadgetMoTo. The final total is
              calculated from merchandise subtotal, delivery fee, and VAT. The
              recorded payment must match that total before approval succeeds.
            </p>
          </div>
          <fieldset
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            disabled={approvePending}
          >
            <label className="grid gap-2 text-sm font-bold">
              Delivery fee (₱)
              <input
                className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3 font-normal"
                defaultValue={formatInputMoney(review.deliveryFeeCentavos)}
                inputMode="decimal"
                name="deliveryFee"
                placeholder="Confirmed amount"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              VAT rate (%)
              <input
                className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3 font-normal"
                defaultValue={formatInputPercent(review.vatRateBps)}
                inputMode="decimal"
                name="vatRate"
                placeholder="Confirmed rate"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              VAT amount (₱)
              <input
                className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3 font-normal"
                defaultValue={formatInputMoney(review.vatAmountCentavos)}
                inputMode="decimal"
                name="vatAmount"
                placeholder="Confirmed amount"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Recorded payment (₱)
              <input
                className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3 font-normal"
                defaultValue={formatInputMoney(review.paymentAmountCentavos)}
                inputMode="decimal"
                name="paymentAmount"
                placeholder="Amount received"
                required
              />
            </label>
          </fieldset>
          <button
            className="mt-5 min-h-11 rounded-[var(--radius-round)] bg-emerald-700 px-5 font-bold text-white disabled:cursor-wait disabled:opacity-60"
            disabled={approvePending}
            type="submit"
          >
            {approvePending ? "Approving…" : "Mark Paid / Verified"}
          </button>
          <ActionMessage state={approveState} />
        </form>
      ) : null}

      {canReject ? (
        <form action={rejectAction} className="mt-4">
          <input name="paymentId" type="hidden" value={review.paymentId} />
          <input name="status" type="hidden" value="failed" />
          <button
            className="min-h-11 rounded-[var(--radius-round)] border border-rose-300 px-5 font-bold text-rose-800 disabled:cursor-wait disabled:opacity-60"
            disabled={rejectPending}
            type="submit"
          >
            {rejectPending ? "Updating…" : "Rejected / Needs Review"}
          </button>
          <ActionMessage state={rejectState} />
        </form>
      ) : null}
    </article>
  );
}

export function AdminOrdersReview({ initialPage }: AdminOrdersReviewProps) {
  const [page, setPage] = useState(initialPage);
  const [selectedReview, setSelectedReview] =
    useState<AdminPaymentReview | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null,
  );
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pageAbort = useRef<AbortController | null>(null);
  const detailAbort = useRef<AbortController | null>(null);

  const updatePageUrl = useCallback((targetPage: number, replace = false) => {
    const url = new URL(window.location.href);
    url.searchParams.delete("state");
    if (targetPage === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(targetPage));
    window.history[replace ? "replaceState" : "pushState"](
      null,
      "",
      `${url.pathname}${url.search}`,
    );
  }, []);

  const loadPage = useCallback(
    async (
      targetPage: number,
      historyMode: "push" | "replace" | "none" = "push",
    ) => {
      pageAbort.current?.abort();
      detailAbort.current?.abort();
      const controller = new AbortController();
      pageAbort.current = controller;
      setLoadingPage(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(`/api/admin/orders?page=${targetPage}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as PageResponse;
        if (!response.ok || !result.success) {
          throw new Error("ORDERS_PAGE_UNAVAILABLE");
        }

        setPage(result.page);
        setSelectedReview(null);
        setSelectedPaymentId(null);
        if (historyMode !== "none") {
          updatePageUrl(
            result.page.currentPage,
            historyMode === "replace" || result.page.currentPage !== targetPage,
          );
        }
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }
        setError("The orders table could not be updated. Please try again.");
      } finally {
        if (pageAbort.current === controller) {
          setLoadingPage(false);
        }
      }
    },
    [updatePageUrl],
  );

  const loadDetail = useCallback(async (paymentId: string) => {
    detailAbort.current?.abort();
    const controller = new AbortController();
    detailAbort.current = controller;
    setSelectedPaymentId(paymentId);
    setSelectedReview(null);
    setLoadingDetail(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders?paymentId=${encodeURIComponent(paymentId)}`,
        { cache: "no-store", signal: controller.signal },
      );
      const result = (await response.json()) as DetailResponse;
      if (!response.ok || !result.success) {
        throw new Error("ORDER_DETAIL_UNAVAILABLE");
      }
      setSelectedReview(result.review);
    } catch (loadError) {
      if (
        loadError instanceof DOMException &&
        loadError.name === "AbortError"
      ) {
        return;
      }
      setError("The selected order details could not be loaded.");
    } finally {
      if (detailAbort.current === controller) {
        setLoadingDetail(false);
      }
    }
  }, []);

  const refreshAfterAction = useCallback(
    async (successMessage: string) => {
      const paymentId = selectedPaymentId;
      await loadPage(page.currentPage, "none");
      if (paymentId) await loadDetail(paymentId);
      setMessage(successMessage);
    },
    [loadDetail, loadPage, page.currentPage, selectedPaymentId],
  );

  useEffect(() => {
    const handlePopState = () => {
      const value = new URL(window.location.href).searchParams.get("page");
      const targetPage = value && /^\d+$/.test(value) ? Number(value) : 1;
      void loadPage(targetPage, "none");
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      pageAbort.current?.abort();
      detailAbort.current?.abort();
    };
  }, [loadPage]);

  const firstVisible =
    page.totalCount === 0 ? 0 : (page.currentPage - 1) * page.pageSize + 1;
  const lastVisible = Math.min(
    page.currentPage * page.pageSize,
    page.totalCount,
  );

  return (
    <div className="mt-8">
      <div aria-live="polite" className="sr-only">
        {loadingPage
          ? "Loading orders"
          : `${firstVisible} to ${lastVisible} of ${page.totalCount} orders`}
      </div>
      {message ? (
        <p
          className="mb-5 rounded-[var(--radius-md)] bg-emerald-50 p-4 font-bold text-emerald-800"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className="mb-5 rounded-[var(--radius-md)] bg-rose-50 p-4 font-bold text-rose-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {page.totalCount === 0 ? (
        <div className="rounded-[var(--radius-lg)] border bg-white p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-xl font-bold">No manual payments to review</h2>
          <p className="mt-2 text-[var(--color-muted)]">
            New submitted orders will appear here without being marked paid.
          </p>
        </div>
      ) : (
        <>
          <div
            aria-busy={loadingPage}
            className={`overflow-x-auto rounded-[var(--radius-lg)] border bg-white shadow-[var(--shadow-sm)] transition-opacity ${loadingPage ? "opacity-55" : "opacity-100"}`}
          >
            <table className="w-full min-w-[68rem] border-collapse text-left">
              <caption className="sr-only">
                Manual-payment orders. Select an order to load its details.
              </caption>
              <thead className="bg-[var(--color-ice)] text-sm">
                <tr>
                  {["Order", "Customer", "Method", "Submitted", "Subtotal", "Status", ""].map(
                    (label, index) => (
                      <th
                        className="px-4 py-3 font-bold"
                        key={`${label}-${index}`}
                        scope="col"
                      >
                        {label || <span className="sr-only">Action</span>}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {page.reviews.map((review) => (
                  <tr
                    className={`border-t align-middle ${
                      selectedPaymentId === review.paymentId
                        ? "bg-sky-50"
                        : "hover:bg-slate-50"
                    }`}
                    key={review.paymentId}
                  >
                    <th className="px-4 py-4 font-bold" scope="row">
                      {review.publicOrderNumber}
                    </th>
                    <td className="px-4 py-4">{review.customerFullName}</td>
                    <td className="px-4 py-4">
                      {paymentMethodLabels[review.paymentMethod]}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-4 py-4 font-bold">
                      {formatMoney(review.merchandiseSubtotalCentavos)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass(review.paymentStatus)}`}
                      >
                        {statusLabel(review.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        aria-pressed={selectedPaymentId === review.paymentId}
                        className="min-h-11 rounded-[var(--radius-round)] bg-[var(--color-action)] px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
                        disabled={loadingDetail && selectedPaymentId === review.paymentId}
                        onClick={() => void loadDetail(review.paymentId)}
                        type="button"
                      >
                        {loadingDetail && selectedPaymentId === review.paymentId
                          ? "Loading…"
                          : "View details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[var(--color-muted)]">
              Showing {firstVisible}–{lastVisible} of {page.totalCount}
            </p>
            <nav
              aria-label="Orders pagination"
              className="flex flex-wrap items-center justify-end gap-2"
            >
              <button
                className="min-h-11 rounded-[var(--radius-round)] border bg-white px-4 font-bold disabled:cursor-not-allowed disabled:opacity-45"
                disabled={loadingPage || page.currentPage === 1}
                onClick={() => void loadPage(page.currentPage - 1)}
                type="button"
              >
                Previous
              </button>
              {pageItems(page.currentPage, page.pageCount).map((item) =>
                typeof item === "string" ? (
                  <span aria-hidden="true" className="px-1" key={item}>
                    …
                  </span>
                ) : (
                  <button
                    aria-current={item === page.currentPage ? "page" : undefined}
                    aria-label={`Page ${item}`}
                    className={`min-h-11 min-w-11 rounded-full border px-3 font-bold ${
                      item === page.currentPage
                        ? "border-[var(--color-action)] bg-[var(--color-action)] text-white"
                        : "bg-white"
                    }`}
                    disabled={loadingPage || item === page.currentPage}
                    key={item}
                    onClick={() => void loadPage(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                className="min-h-11 rounded-[var(--radius-round)] border bg-white px-4 font-bold disabled:cursor-not-allowed disabled:opacity-45"
                disabled={loadingPage || page.currentPage === page.pageCount}
                onClick={() => void loadPage(page.currentPage + 1)}
                type="button"
              >
                Next
              </button>
            </nav>
          </div>
        </>
      )}

      {loadingDetail ? (
        <div
          className="mt-6 rounded-[var(--radius-lg)] border bg-white p-6 shadow-[var(--shadow-sm)]"
          role="status"
        >
          Loading selected order details…
        </div>
      ) : selectedReview ? (
        <PaymentDetail
          key={selectedReview.paymentId}
          onUpdated={refreshAfterAction}
          review={selectedReview}
        />
      ) : page.totalCount > 0 ? (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed bg-white p-6 text-center text-[var(--color-muted)]">
          Select an order to review its customer, delivery, products, and
          payment details.
        </div>
      ) : null}
    </div>
  );
}
