import "server-only";

import { getAuthenticatedAdmin } from "@/lib/admin/server/auth";
import { createClient } from "@/lib/supabase/server";
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
}>;

export async function getAdminPaymentReviews(): Promise<
  readonly AdminPaymentReview[] | null
> {
  const authorization = await getAuthenticatedAdmin();
  if (!authorization.ok) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc(
    "get_manual_payment_reviews",
  );
  if (error || !data) return null;

  return data.map((row) => ({
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
  }));
}
