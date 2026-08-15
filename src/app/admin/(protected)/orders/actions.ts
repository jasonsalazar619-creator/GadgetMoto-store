"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdmin } from "@/lib/admin/server/auth";
import { logManualPaymentDatabaseFailure } from "@/lib/orders/server/database-diagnostics";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/supabase/database.types";

export type PaymentActionState = Readonly<{
  status: "idle" | "success" | "error";
  message: string;
}>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const PERCENT_PATTERN = /^\d+(?:\.\d{1,2})?$/;

const failedState = (message: string): PaymentActionState => ({
  status: "error",
  message,
});

function hasExactFields(formData: FormData, expected: readonly string[]): boolean {
  const fields = [...formData.keys()].filter(
    (key) => !key.startsWith("$ACTION_"),
  );
  return (
    fields.length === expected.length &&
    new Set(fields).size === expected.length &&
    expected.every((field) => fields.includes(field))
  );
}

function parsePesosToCentavos(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replaceAll(",", "");
  if (!MONEY_PATTERN.test(normalized)) return null;
  const [pesos, decimal = ""] = normalized.split(".");
  const centavos = Number(pesos) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(centavos) && centavos >= 0 ? centavos : null;
}

function parsePercentToBasisPoints(
  value: FormDataEntryValue | null,
): number | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!PERCENT_PATTERN.test(normalized)) return null;
  const [whole, decimal = ""] = normalized.split(".");
  const basisPoints = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(basisPoints) && basisPoints <= 10000
    ? basisPoints
    : null;
}

export async function approveManualPaymentAction(
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const expectedFields = [
    "paymentId",
    "deliveryFee",
    "vatRate",
    "vatAmount",
    "paymentAmount",
  ] as const;
  if (!hasExactFields(formData, expectedFields)) {
    return failedState("The confirmation form is invalid. Review every amount.");
  }

  const paymentId = formData.get("paymentId");
  const deliveryFeeCentavos = parsePesosToCentavos(
    formData.get("deliveryFee"),
  );
  const vatRateBps = parsePercentToBasisPoints(formData.get("vatRate"));
  const vatAmountCentavos = parsePesosToCentavos(formData.get("vatAmount"));
  const paymentAmountCentavos = parsePesosToCentavos(
    formData.get("paymentAmount"),
  );
  if (
    typeof paymentId !== "string" ||
    !UUID_PATTERN.test(paymentId) ||
    deliveryFeeCentavos === null ||
    vatRateBps === null ||
    vatAmountCentavos === null ||
    paymentAmountCentavos === null
  ) {
    return failedState(
      "Enter valid confirmed amounts using no more than two decimal places.",
    );
  }

  const authorization = await getAuthenticatedAdmin();
  if (!authorization.ok) {
    return failedState("Administrator authorization could not be verified.");
  }

  const supabase = await createClient();
  if (!supabase) {
    return failedState("The payment service is temporarily unavailable.");
  }

  const { data, error } = await supabase.rpc(
    "approve_manual_payment_with_confirmed_amounts",
    {
      target_payment_id: paymentId,
      target_delivery_fee_centavos: deliveryFeeCentavos,
      target_vat_rate_bps: vatRateBps,
      target_vat_amount_centavos: vatAmountCentavos,
      target_payment_amount_centavos: paymentAmountCentavos,
    },
  );
  if (error || data !== true) {
    if (error) {
      logManualPaymentDatabaseFailure("payment_approval", error);
    }
    return failedState(
      "Approval failed. The recorded payment must match the confirmed merchandise, delivery, and VAT total.",
    );
  }

  revalidatePath("/admin/orders");
  return {
    status: "success",
    message: "Payment approved and audit logged.",
  };
}

export async function setManualPaymentStatusAction(
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const expectedFields = ["paymentId", "status"] as const;
  if (!hasExactFields(formData, expectedFields)) {
    return failedState("The payment update request is invalid.");
  }

  const paymentId = formData.get("paymentId");
  const requestedStatus = formData.get("status");
  if (
    typeof paymentId !== "string" ||
    !UUID_PATTERN.test(paymentId) ||
    requestedStatus !== "failed"
  ) {
    return failedState("The payment update request is invalid.");
  }

  const authorization = await getAuthenticatedAdmin();
  if (!authorization.ok) {
    return failedState("Administrator authorization could not be verified.");
  }

  const supabase = await createClient();
  if (!supabase) {
    return failedState("The payment service is temporarily unavailable.");
  }

  const { data, error } = await supabase.rpc(
    "set_manual_payment_status",
    {
      target_payment_id: paymentId,
      target_status: requestedStatus as PaymentStatus,
    },
  );
  if (error || data !== true) {
    if (error) {
      logManualPaymentDatabaseFailure("payment_rejection", error);
    }
    return failedState("The payment status could not be updated safely.");
  }

  revalidatePath("/admin/orders");
  return {
    status: "success",
    message: "Payment marked for review and audit logged.",
  };
}
