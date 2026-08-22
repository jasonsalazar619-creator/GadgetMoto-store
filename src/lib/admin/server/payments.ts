import "server-only";

import { getAuthenticatedAdmin } from "@/lib/admin/server/auth";
import {
  logManualPaymentDatabaseFailure,
  logManualPaymentReadinessCode,
} from "@/lib/orders/server/database-diagnostics";
import { getOrderDatabaseClient } from "@/lib/orders/server/postgres-client";
import { paymentProofBucket } from "@/lib/payments/server/proof-storage";
import { createClient } from "@/lib/supabase/server";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/supabase/database.types";

export const ADMIN_PAYMENT_PAGE_SIZE = 10;

export type AdminPaymentSummary = Readonly<{
  paymentId: string;
  publicOrderNumber: string;
  customerFullName: string;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  merchandiseSubtotalCentavos: number;
  finalTotalCentavos: number | null;
  paymentAmountCentavos: number | null;
  createdAt: string;
}>;

export type AdminPaymentReview = AdminPaymentSummary &
  Readonly<{
    customerMobile: string;
    customerEmail: string | null;
    deliveryMethod: string;
    deliveryFeeCentavos: number | null;
    vatRateBps: number | null;
    vatAmountCentavos: number | null;
    proofAttached: boolean;
    proofUrl: string | null;
    address: Readonly<{
      streetAddress: string;
      barangay: string;
      cityMunicipality: string;
      province: string;
      postalCode: string;
    }> | null;
    items: readonly Readonly<{
      orderItemId: string;
      productName: string;
      variantName: string;
      sku: string;
      colorName: string | null;
      ramGb: number | null;
      extendedRamGb: number | null;
      storageGb: number | null;
      quantity: number;
      unitPriceCentavos: number;
      lineTotalCentavos: number;
    }>[];
  }>;

export type AdminPaymentReviewPage = Readonly<{
  reviews: readonly AdminPaymentSummary[];
  currentPage: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
}>;

type CountRow = Readonly<{ total_count: string | number }>;

type SummaryRow = Readonly<{
  payment_id: string;
  public_order_number: string;
  customer_full_name: string;
  order_status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  merchandise_subtotal_centavos: string | number;
  final_total_centavos: string | number | null;
  payment_amount_centavos: string | number | null;
  created_at: Date | string;
}>;

type DetailRow = SummaryRow &
  Readonly<{
    customer_mobile: string;
    customer_email: string | null;
    proof_storage_path: string | null;
    delivery_method: string;
    delivery_fee_centavos: string | number | null;
    vat_rate_bps: number | null;
    vat_amount_centavos: string | number | null;
    street_address: string | null;
    barangay: string | null;
    city_municipality: string | null;
    province: string | null;
    postal_code: string | null;
    order_item_id: string;
    product_name_snapshot: string;
    variant_snapshot: string;
    sku_snapshot: string;
    color_name_snapshot: string | null;
    ram_gb: number | null;
    extended_ram_gb: number | null;
    storage_gb: number | null;
    quantity: number;
    unit_price_centavos: string | number;
    line_total_centavos: string | number;
  }>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readCentavos(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function readCount(value: string | number | undefined): number | null {
  if (value === undefined) return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function readRequestedPage(value: number): number {
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function mapSummary(row: SummaryRow): AdminPaymentSummary | null {
  const merchandiseSubtotalCentavos = readCentavos(
    row.merchandise_subtotal_centavos,
  );
  const finalTotalCentavos = readCentavos(row.final_total_centavos);
  const paymentAmountCentavos = readCentavos(row.payment_amount_centavos);

  if (
    !UUID_PATTERN.test(row.payment_id) ||
    merchandiseSubtotalCentavos === null ||
    (row.final_total_centavos !== null && finalTotalCentavos === null) ||
    (row.payment_amount_centavos !== null && paymentAmountCentavos === null)
  ) {
    return null;
  }

  return {
    paymentId: row.payment_id,
    publicOrderNumber: row.public_order_number,
    customerFullName: row.customer_full_name,
    orderStatus: row.order_status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    merchandiseSubtotalCentavos,
    finalTotalCentavos,
    paymentAmountCentavos,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  };
}

async function confirmAdministrator(): Promise<boolean> {
  const authorization = await getAuthenticatedAdmin();
  if (authorization.ok) return true;

  logManualPaymentReadinessCode(
    "admin_authorization",
    authorization.code,
  );
  return false;
}

export async function getAdminPaymentReviewPage(
  requestedPage: number,
): Promise<AdminPaymentReviewPage | null> {
  if (!(await confirmAdministrator())) return null;

  try {
    const database = getOrderDatabaseClient();
    const countRows = await database<CountRow[]>`
      select count(*) as total_count
      from public.payments as payments
      where payments.method in (
        'maya_manual'::public.payment_method,
        'gcash'::public.payment_method,
        'bank_transfer'::public.payment_method,
        'cash_on_pickup'::public.payment_method
      )
    `;
    const totalCount = readCount(countRows[0]?.total_count);
    if (totalCount === null) {
      logManualPaymentReadinessCode(
        "payment_review_result",
        "INVALID_DATABASE_RESULT",
      );
      return null;
    }

    const pageCount = Math.max(
      1,
      Math.ceil(totalCount / ADMIN_PAYMENT_PAGE_SIZE),
    );
    const currentPage = Math.min(readRequestedPage(requestedPage), pageCount);
    const offset = (currentPage - 1) * ADMIN_PAYMENT_PAGE_SIZE;
    const rows = await database<SummaryRow[]>`
      select
        payments.id as payment_id,
        orders.public_order_number,
        orders.customer_full_name,
        orders.status as order_status,
        payments.method as payment_method,
        payments.status as payment_status,
        orders.merchandise_subtotal_centavos,
        orders.final_total_centavos,
        payments.amount_centavos as payment_amount_centavos,
        orders.created_at
      from public.payments as payments
      inner join public.orders as orders on orders.id = payments.order_id
      where payments.method in (
        'maya_manual'::public.payment_method,
        'gcash'::public.payment_method,
        'bank_transfer'::public.payment_method,
        'cash_on_pickup'::public.payment_method
      )
      order by orders.created_at desc, payments.id desc
      limit ${ADMIN_PAYMENT_PAGE_SIZE}
      offset ${offset}
    `;
    const reviews = rows.map(mapSummary);
    if (!reviews.every((review) => review !== null)) {
      logManualPaymentReadinessCode(
        "payment_review_result",
        "INVALID_DATABASE_RESULT",
      );
      return null;
    }

    return {
      reviews,
      currentPage,
      pageCount,
      pageSize: ADMIN_PAYMENT_PAGE_SIZE,
      totalCount,
    };
  } catch (error) {
    logManualPaymentDatabaseFailure("payment_review_page", error);
    return null;
  }
}

export async function getAdminPaymentReviewDetail(
  paymentId: string,
): Promise<AdminPaymentReview | null> {
  if (!UUID_PATTERN.test(paymentId) || !(await confirmAdministrator())) {
    return null;
  }

  try {
    const database = getOrderDatabaseClient();
    const rows = await database<DetailRow[]>`
      select
        payments.id as payment_id,
        orders.public_order_number,
        orders.customer_full_name,
        orders.customer_mobile,
        orders.customer_email,
        orders.status as order_status,
        payments.method as payment_method,
        payments.status as payment_status,
        orders.merchandise_subtotal_centavos,
        orders.final_total_centavos,
        payments.amount_centavos as payment_amount_centavos,
        payments.proof_storage_path,
        orders.created_at,
        orders.delivery_method,
        orders.delivery_fee_centavos,
        orders.vat_rate_bps,
        orders.vat_amount_centavos,
        addresses.street_address,
        addresses.barangay,
        addresses.city_municipality,
        addresses.province,
        addresses.postal_code,
        items.id as order_item_id,
        items.product_name_snapshot,
        items.variant_snapshot,
        items.sku_snapshot,
        items.color_name_snapshot,
        variants.ram_gb,
        variants.extended_ram_gb,
        variants.storage_gb,
        items.quantity,
        items.unit_price_centavos,
        items.line_total_centavos
      from public.payments as payments
      inner join public.orders as orders on orders.id = payments.order_id
      inner join public.order_items as items on items.order_id = orders.id
      left join public.order_addresses as addresses
        on addresses.order_id = orders.id
      left join public.product_variants as variants
        on variants.id = items.variant_id
      where payments.id = ${paymentId}::uuid
        and payments.method in (
          'maya_manual'::public.payment_method,
          'gcash'::public.payment_method,
          'bank_transfer'::public.payment_method,
          'cash_on_pickup'::public.payment_method
        )
      order by items.created_at asc, items.id asc
    `;
    const first = rows[0];
    if (!first) return null;

    const summary = mapSummary(first);
    const deliveryFeeCentavos = readCentavos(first.delivery_fee_centavos);
    const vatAmountCentavos = readCentavos(first.vat_amount_centavos);
    const items = rows.map((row) => ({
      orderItemId: row.order_item_id,
      productName: row.product_name_snapshot,
      variantName: row.variant_snapshot,
      sku: row.sku_snapshot,
      colorName: row.color_name_snapshot,
      ramGb: row.ram_gb,
      extendedRamGb: row.extended_ram_gb,
      storageGb: row.storage_gb,
      quantity: row.quantity,
      unitPriceCentavos: readCentavos(row.unit_price_centavos),
      lineTotalCentavos: readCentavos(row.line_total_centavos),
    }));
    if (
      !summary ||
      (first.delivery_fee_centavos !== null && deliveryFeeCentavos === null) ||
      (first.vat_amount_centavos !== null && vatAmountCentavos === null) ||
      (first.vat_rate_bps !== null &&
        (!Number.isSafeInteger(first.vat_rate_bps) ||
          first.vat_rate_bps < 0 ||
          first.vat_rate_bps > 10000)) ||
      items.some(
        (item) =>
          !UUID_PATTERN.test(item.orderItemId) ||
          item.unitPriceCentavos === null ||
          item.lineTotalCentavos === null,
      )
    ) {
      logManualPaymentReadinessCode(
        "payment_review_result",
        "INVALID_DATABASE_RESULT",
      );
      return null;
    }

    const address =
      first.street_address &&
      first.barangay &&
      first.city_municipality &&
      first.province &&
      first.postal_code
        ? {
            streetAddress: first.street_address,
            barangay: first.barangay,
            cityMunicipality: first.city_municipality,
            province: first.province,
            postalCode: first.postal_code,
          }
        : null;

    const proofPathPattern = new RegExp(
      `^${first.payment_id}/[0-9a-f-]{36}\\.(?:jpg|png|webp|pdf)$`,
      "i",
    );
    const proofAttached =
      typeof first.proof_storage_path === "string" &&
      proofPathPattern.test(first.proof_storage_path);
    let proofUrl: string | null = null;
    if (proofAttached) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.storage
          .from(paymentProofBucket)
          .createSignedUrl(first.proof_storage_path as string, 300);
        if (!error) proofUrl = data.signedUrl;
      }
    }

    return {
      ...summary,
      customerMobile: first.customer_mobile,
      customerEmail: first.customer_email,
      deliveryMethod: first.delivery_method,
      deliveryFeeCentavos,
      vatRateBps: first.vat_rate_bps,
      vatAmountCentavos,
      proofAttached,
      proofUrl,
      address,
      items: items.map((item) => ({
        ...item,
        unitPriceCentavos: item.unitPriceCentavos as number,
        lineTotalCentavos: item.lineTotalCentavos as number,
      })),
    };
  } catch (error) {
    logManualPaymentDatabaseFailure("payment_review_detail", error);
    return null;
  }
}
