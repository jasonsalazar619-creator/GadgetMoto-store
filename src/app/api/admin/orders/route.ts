import { getAuthenticatedAdmin } from "@/lib/admin/server/auth";
import {
  getAdminPaymentReviewDetail,
  getAdminPaymentReviewPage,
} from "@/lib/admin/server/payments";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const noStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
} as const;

function safePage(value: string | null): number {
  if (!value || !/^\d{1,9}$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export async function GET(request: Request): Promise<Response> {
  const authorization = await getAuthenticatedAdmin();
  if (!authorization.ok) {
    return Response.json(
      { success: false, message: "Administrator access is required." },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const paymentId = searchParams.get("paymentId");

  if (paymentId !== null) {
    if (!UUID_PATTERN.test(paymentId)) {
      return Response.json(
        { success: false, message: "The selected payment is invalid." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const review = await getAdminPaymentReviewDetail(paymentId);
    if (!review) {
      return Response.json(
        { success: false, message: "The order details are unavailable." },
        { status: 404, headers: noStoreHeaders },
      );
    }

    return Response.json(
      { success: true, review },
      { headers: noStoreHeaders },
    );
  }

  const page = await getAdminPaymentReviewPage(
    safePage(searchParams.get("page")),
  );
  if (!page) {
    return Response.json(
      { success: false, message: "The orders table is unavailable." },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return Response.json(
    { success: true, page },
    { headers: noStoreHeaders },
  );
}
