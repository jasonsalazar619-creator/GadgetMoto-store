import { createHash, randomUUID } from "node:crypto";

import { getOrderDatabaseClient } from "@/lib/orders/server/postgres-client";
import {
  getPaymentProofStorageClient,
  paymentProofBucket,
} from "@/lib/payments/server/proof-storage";

export const runtime = "nodejs";

const maximumProofBytes = 8 * 1024 * 1024;
const maximumRequestBytes = maximumProofBytes + 64 * 1024;
const orderNumberPattern = /^GM-[A-Z0-9-]{8,64}$/;
const confirmationTokenPattern = /^[a-f0-9]{64}$/;

type PaymentRow = Readonly<{
  payment_id: string;
  proof_storage_path: string | null;
}>;

type SafeProofResponse =
  | Readonly<{ success: true }>
  | Readonly<{
      success: false;
      code:
        | "INVALID_PAYMENT_PROOF"
        | "PAYMENT_NOT_AVAILABLE"
        | "PAYMENT_PROOF_STORAGE_UNAVAILABLE"
        | "PAYMENT_PROOF_UPLOAD_FAILED";
      message: string;
    }>;

const safeError = (
  code: Extract<SafeProofResponse, { success: false }>["code"],
  message: string,
  status: number,
): Response =>
  Response.json(
    { success: false, code, message } satisfies SafeProofResponse,
    { status },
  );

const sha256 = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

function getVerifiedExtension(
  bytes: Uint8Array,
  declaredType: string,
): "jpg" | "png" | "webp" | "pdf" | null {
  const jpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  if (declaredType === "image/jpeg" && jpeg) return "jpg";

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const png =
    bytes.length >= pngSignature.length &&
    pngSignature.every((value, index) => bytes[index] === value);
  if (declaredType === "image/png" && png) return "png";

  const webp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (declaredType === "image/webp" && webp) return "webp";

  const pdf =
    bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (declaredType === "application/pdf" && pdf) return "pdf";

  return null;
}

export async function POST(request: Request): Promise<Response> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumRequestBytes
  ) {
    return safeError(
      "INVALID_PAYMENT_PROOF",
      "Choose a JPEG, PNG, WebP, or PDF proof no larger than 8 MB.",
      413,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return safeError(
      "INVALID_PAYMENT_PROOF",
      "The payment proof could not be read.",
      400,
    );
  }

  const publicOrderNumber = formData.get("publicOrderNumber");
  const confirmationToken = formData.get("confirmationToken");
  const proof = formData.get("proof");
  const fields = [...formData.keys()];
  if (
    fields.length !== 3 ||
    new Set(fields).size !== 3 ||
    !["publicOrderNumber", "confirmationToken", "proof"].every((field) =>
      fields.includes(field),
    ) ||
    typeof publicOrderNumber !== "string" ||
    !orderNumberPattern.test(publicOrderNumber) ||
    typeof confirmationToken !== "string" ||
    !confirmationTokenPattern.test(confirmationToken) ||
    !(proof instanceof File) ||
    proof.size <= 0 ||
    proof.size > maximumProofBytes
  ) {
    return safeError(
      "INVALID_PAYMENT_PROOF",
      "Choose a JPEG, PNG, WebP, or PDF proof no larger than 8 MB.",
      400,
    );
  }

  const bytes = new Uint8Array(await proof.arrayBuffer());
  const extension = getVerifiedExtension(bytes, proof.type);
  if (!extension) {
    return safeError(
      "INVALID_PAYMENT_PROOF",
      "Choose a valid JPEG, PNG, WebP, or PDF proof.",
      400,
    );
  }

  const database = getOrderDatabaseClient();
  let payment: PaymentRow | undefined;
  try {
    const rows = await database<PaymentRow[]>`
      select
        payments.id as payment_id,
        payments.proof_storage_path
      from public.orders as orders
      inner join public.payments as payments on payments.order_id = orders.id
      where orders.public_order_number = ${publicOrderNumber}
        and orders.public_lookup_token_hash = ${sha256(confirmationToken)}
        and orders.status <> 'cancelled'::public.order_status
        and payments.method = 'maya_manual'::public.payment_method
        and payments.status <> 'paid'::public.payment_status
      order by payments.created_at desc, payments.id desc
      limit 1
    `;
    payment = rows[0];
  } catch {
    return safeError(
      "PAYMENT_PROOF_UPLOAD_FAILED",
      "The payment proof could not be attached. Please try again.",
      500,
    );
  }

  if (!payment) {
    return safeError(
      "PAYMENT_NOT_AVAILABLE",
      "This order is not available for a Maya proof attachment.",
      409,
    );
  }
  const verifiedPayment = payment;

  const storage = getPaymentProofStorageClient();
  if (!storage) {
    return safeError(
      "PAYMENT_PROOF_STORAGE_UNAVAILABLE",
      "Payment-proof upload is temporarily unavailable.",
      503,
    );
  }

  const storagePath = `${verifiedPayment.payment_id}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await storage.storage
    .from(paymentProofBucket)
    .upload(storagePath, bytes, {
      cacheControl: "3600",
      contentType: proof.type,
      upsert: false,
    });
  if (uploadError) {
    return safeError(
      "PAYMENT_PROOF_UPLOAD_FAILED",
      "The payment proof could not be attached. Please try again.",
      500,
    );
  }

  try {
    await database.begin("read write", async (sql) => {
      const updated = await sql<Readonly<{ id: string }>[]>`
        update public.payments
        set
          proof_storage_path = ${storagePath},
          status = 'awaiting_payment'::public.payment_status
        where id = ${verifiedPayment.payment_id}::uuid
          and method = 'maya_manual'::public.payment_method
          and status <> 'paid'::public.payment_status
        returning id
      `;
      if (!updated[0]) throw new Error("PAYMENT_PROOF_NOT_UPDATED");

      await sql`
        insert into public.audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id,
          after_data
        )
        values (
          null,
          'payment.proof_attached',
          'payment',
          ${verifiedPayment.payment_id}::uuid,
          jsonb_build_object('proofAttached', true)
        )
      `;
    });
  } catch {
    await storage.storage.from(paymentProofBucket).remove([storagePath]);
    return safeError(
      "PAYMENT_PROOF_UPLOAD_FAILED",
      "The payment proof could not be attached. Please try again.",
      500,
    );
  }

  if (
    verifiedPayment.proof_storage_path &&
    verifiedPayment.proof_storage_path !== storagePath
  ) {
    await storage.storage
      .from(paymentProofBucket)
      .remove([verifiedPayment.proof_storage_path]);
  }

  return Response.json({ success: true } satisfies SafeProofResponse);
}
