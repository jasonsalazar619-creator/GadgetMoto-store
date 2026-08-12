import { createOrder } from "@/lib/orders/server/create-order";
import { isOnlineOrderingEnabled } from "@/lib/orders/server/config";
import {
  sanitizeOrderServerError,
  type OrderServerErrorCode,
} from "@/lib/orders/server/order-error";

const maximumRequestBytes = 32 * 1024;

type SafeErrorResponse = Readonly<{
  success: false;
  code: OrderServerErrorCode;
  message: string;
}>;

const conflictCodes: readonly OrderServerErrorCode[] = [
  "DUPLICATE_CART_ITEM",
  "PRODUCT_NOT_AVAILABLE",
  "INVALID_COLOR_SELECTION",
  "PRODUCT_PRICE_CHANGED",
  "INSUFFICIENT_INVENTORY",
  "DUPLICATE_SUBMISSION",
];

const customerMessages: Record<OrderServerErrorCode, string> = {
  ONLINE_ORDERING_DISABLED:
    "Online order submission is currently unavailable. Please contact us to complete your order.",
  ORDER_DATABASE_NOT_CONFIGURED:
    "Online order submission is temporarily unavailable. Please try again later.",
  INVALID_CHECKOUT_REQUEST:
    "Review your checkout details and try again.",
  EMPTY_CART: "Add at least one product before submitting your order.",
  INVALID_IDEMPOTENCY_KEY:
    "The order attempt could not be verified. Please try again.",
  INVALID_QUANTITY: "Review the quantities in your cart and try again.",
  DUPLICATE_CART_ITEM:
    "The cart contains a duplicate product. Review it and try again.",
  PRODUCT_NOT_AVAILABLE:
    "One or more products are currently unavailable.",
  INVALID_COLOR_SELECTION:
    "One or more selected product colors are unavailable.",
  PRODUCT_PRICE_CHANGED:
    "A product price has changed and requires another review.",
  INSUFFICIENT_INVENTORY:
    "One or more products are currently unavailable.",
  INVALID_FULFILLMENT:
    "Choose an available delivery method and try again.",
  INVALID_ADDRESS: "Review your delivery address and try again.",
  INVALID_PICKUP_LOCATION:
    "Store pickup is currently unavailable. Choose delivery instead.",
  UNSUPPORTED_PAYMENT_METHOD:
    "Choose an available payment method and try again.",
  DUPLICATE_SUBMISSION:
    "This order attempt no longer matches your cart. Please try again.",
  ORDER_CREATION_FAILED:
    "We could not receive your order. Please try again later.",
};

const errorStatus = (code: OrderServerErrorCode): number => {
  if (
    code === "ONLINE_ORDERING_DISABLED" ||
    code === "ORDER_DATABASE_NOT_CONFIGURED"
  ) {
    return 503;
  }
  if (conflictCodes.includes(code)) return 409;
  if (code === "ORDER_CREATION_FAILED") return 500;
  return 400;
};

const safeError = (
  code: OrderServerErrorCode,
  status = errorStatus(code),
): Response =>
  Response.json(
    {
      success: false,
      code,
      message: customerMessages[code],
    } satisfies SafeErrorResponse,
    { status },
  );

export async function POST(request: Request): Promise<Response> {
  if (!isOnlineOrderingEnabled()) {
    return safeError("ONLINE_ORDERING_DISABLED");
  }

  const mediaType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (mediaType !== "application/json") {
    return safeError("INVALID_CHECKOUT_REQUEST", 415);
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumRequestBytes
  ) {
    return safeError("INVALID_CHECKOUT_REQUEST", 413);
  }

  let input: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > maximumRequestBytes) {
      return safeError("INVALID_CHECKOUT_REQUEST", 413);
    }
    input = JSON.parse(body) as unknown;
  } catch {
    return safeError("INVALID_CHECKOUT_REQUEST");
  }

  try {
    const result = await createOrder(input);
    return Response.json(result, {
      status: result.wasReplay ? 200 : 201,
    });
  } catch (error) {
    const safeOrderError = sanitizeOrderServerError(error);
    return safeError(safeOrderError.code);
  }
}
