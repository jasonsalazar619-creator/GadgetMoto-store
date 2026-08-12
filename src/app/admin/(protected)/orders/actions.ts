"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/admin/server/auth";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/supabase/database.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function paymentRedirect(state: "updated" | "update-failed"): never {
  redirect(`/admin/orders?state=${state}`);
}

export async function setManualPaymentStatusAction(
  formData: FormData,
): Promise<void> {
  const fields = [...formData.keys()].filter(
    (key) => !key.startsWith("$ACTION_"),
  );
  if (
    fields.length !== 2 ||
    new Set(fields).size !== 2 ||
    !fields.includes("paymentId") ||
    !fields.includes("status")
  ) {
    paymentRedirect("update-failed");
  }

  const paymentId = formData.get("paymentId");
  const requestedStatus = formData.get("status");
  if (
    typeof paymentId !== "string" ||
    !uuidPattern.test(paymentId) ||
    (requestedStatus !== "paid" && requestedStatus !== "failed")
  ) {
    paymentRedirect("update-failed");
  }

  const authorization = await getAuthenticatedAdmin();
  if (!authorization.ok) {
    paymentRedirect("update-failed");
  }

  const supabase = await createClient();
  if (!supabase) {
    paymentRedirect("update-failed");
  }

  const { data, error } = await supabase.rpc(
    "set_manual_payment_status",
    {
      target_payment_id: paymentId,
      target_status: requestedStatus as PaymentStatus,
    },
  );
  if (error || data !== true) {
    paymentRedirect("update-failed");
  }

  revalidatePath("/admin/orders");
  paymentRedirect("updated");
}
