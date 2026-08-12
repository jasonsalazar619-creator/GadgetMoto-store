import "server-only";

import { getAuthenticatedAdmin } from "@/lib/admin/server/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrderDatabaseClient } from "@/lib/orders/server/postgres-client";
import {
  logManualPaymentDatabaseFailure,
  logManualPaymentReadinessCode,
} from "@/lib/orders/server/database-diagnostics";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/supabase/database.types";

export type AdminPaymentReview = Readonly<{
  paymentId: string;
  publicOrderNumber: string;
  customerFullName: string;
  customerMobile: string;
  customerEmail: string | null;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  merchandiseSubtotalCentavos: number;
  finalTotalCentavos: number | null;
  paymentAmountCentavos: number | null;
  createdAt: string;
  deliveryMethod: string;
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
    storageGb: number | null;
    quantity: number;
    unitPriceCentavos: number;
    lineTotalCentavos: number;
  }>[];
}>;

type OrderDetailRow = Readonly<{
  payment_id: string;
  delivery_method: string;
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
  storage_gb: number | null;
  quantity: number;
  unit_price_centavos: string | number;
  line_total_centavos: string | number;
}>;

const readCentavos = (value: string | number): number | null => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};

export async function getAdminPaymentReviews(): Promise<
  readonly AdminPaymentReview[] | null
> {
  const authorization = await getAuthenticatedAdmin();
  if (!authorization.ok) {
    logManualPaymentReadinessCode(
      "admin_authorization",
      authorization.code,
    );
    return null;
  }

  const supabase = await createClient();
  if (!supabase) {
    logManualPaymentReadinessCode(
      "payment_review_rpc",
      "AUTH_CONFIGURATION_MISSING",
    );
    return null;
  }

  const { data, error } = await supabase.rpc(
    "get_manual_payment_reviews",
  );
  if (error) {
    logManualPaymentDatabaseFailure("payment_review_rpc", error);
    return null;
  }
  if (!data) {
    logManualPaymentReadinessCode(
      "payment_review_result",
      "INVALID_DATABASE_RESULT",
    );
    return null;
  }

  if (data.length === 0) return [];

  let details: readonly OrderDetailRow[];
  try {
    const database = getOrderDatabaseClient();
    details = await database<OrderDetailRow[]>`
      select
        payments.id as payment_id,
        orders.delivery_method,
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
      where payments.id = any(
        ${database.array(data.map((row) => row.payment_id))}::uuid[]
      )
      order by payments.created_at desc, items.created_at asc, items.id asc
    `;
  } catch (error) {
    logManualPaymentDatabaseFailure("payment_review_details", error);
    return null;
  }

  const detailsByPayment = new Map<string, OrderDetailRow[]>();
  for (const detail of details) {
    const current = detailsByPayment.get(detail.payment_id) ?? [];
    current.push(detail);
    detailsByPayment.set(detail.payment_id, current);
  }

  const reviews = data.map((row): AdminPaymentReview | null => {
    const orderDetails = detailsByPayment.get(row.payment_id) ?? [];
    const parsedItems = orderDetails.map((detail) => ({
      orderItemId: detail.order_item_id,
      productName: detail.product_name_snapshot,
      variantName: detail.variant_snapshot,
      sku: detail.sku_snapshot,
      colorName: detail.color_name_snapshot,
      ramGb: detail.ram_gb,
      storageGb: detail.storage_gb,
      quantity: detail.quantity,
      unitPriceCentavos: readCentavos(detail.unit_price_centavos),
      lineTotalCentavos: readCentavos(detail.line_total_centavos),
    }));
    if (
      parsedItems.some(
        (item) =>
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
    const firstDetail = orderDetails[0];
    const address =
      firstDetail?.street_address &&
      firstDetail.barangay &&
      firstDetail.city_municipality &&
      firstDetail.province &&
      firstDetail.postal_code
        ? {
            streetAddress: firstDetail.street_address,
            barangay: firstDetail.barangay,
            cityMunicipality: firstDetail.city_municipality,
            province: firstDetail.province,
            postalCode: firstDetail.postal_code,
          }
        : null;

    return {
    paymentId: row.payment_id,
    publicOrderNumber: row.public_order_number,
    customerFullName: row.customer_full_name,
    customerMobile: row.customer_mobile,
    customerEmail: row.customer_email,
    orderStatus: row.order_status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    merchandiseSubtotalCentavos: row.merchandise_subtotal_centavos,
    finalTotalCentavos: row.final_total_centavos,
    paymentAmountCentavos: row.payment_amount_centavos,
    createdAt: row.created_at,
      deliveryMethod: firstDetail?.delivery_method ?? "unavailable",
      address,
      items: parsedItems.map((item) => ({
        ...item,
        unitPriceCentavos: item.unitPriceCentavos as number,
        lineTotalCentavos: item.lineTotalCentavos as number,
      })),
    };
  });

  if (!reviews.every((review) => review !== null)) return null;
  return reviews;
}
