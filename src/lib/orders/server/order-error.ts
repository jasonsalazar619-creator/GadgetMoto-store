import "server-only";

export type OrderServerErrorCode =
  | "ONLINE_ORDERING_DISABLED"
  | "ORDER_DATABASE_NOT_CONFIGURED"
  | "INVALID_CHECKOUT_REQUEST"
  | "EMPTY_CART"
  | "INVALID_IDEMPOTENCY_KEY"
  | "INVALID_QUANTITY"
  | "DUPLICATE_CART_ITEM"
  | "PRODUCT_NOT_AVAILABLE"
  | "PRODUCT_PRICE_CHANGED"
  | "INSUFFICIENT_INVENTORY"
  | "INVALID_FULFILLMENT"
  | "INVALID_ADDRESS"
  | "INVALID_PICKUP_LOCATION"
  | "UNSUPPORTED_PAYMENT_METHOD"
  | "DUPLICATE_SUBMISSION"
  | "ORDER_CREATION_FAILED";

const orderErrorMessages: Record<OrderServerErrorCode, string> = {
  ONLINE_ORDERING_DISABLED: "Online order submission is unavailable.",
  ORDER_DATABASE_NOT_CONFIGURED:
    "Order service configuration is unavailable.",
  INVALID_CHECKOUT_REQUEST: "The checkout request is invalid.",
  EMPTY_CART: "The cart must contain at least one item.",
  INVALID_IDEMPOTENCY_KEY: "The submission key is invalid.",
  INVALID_QUANTITY: "An item quantity is invalid.",
  DUPLICATE_CART_ITEM: "The cart contains a duplicate item.",
  PRODUCT_NOT_AVAILABLE: "A requested product is unavailable.",
  PRODUCT_PRICE_CHANGED: "A product price requires review.",
  INSUFFICIENT_INVENTORY: "A requested product is unavailable.",
  INVALID_FULFILLMENT: "The fulfillment selection is invalid.",
  INVALID_ADDRESS: "The delivery address is invalid.",
  INVALID_PICKUP_LOCATION: "The pickup location is unavailable.",
  UNSUPPORTED_PAYMENT_METHOD: "The payment method is unavailable.",
  DUPLICATE_SUBMISSION: "The submission key cannot be reused.",
  ORDER_CREATION_FAILED: "The order could not be created.",
};

export class OrderServerError extends Error {
  readonly code: OrderServerErrorCode;

  constructor(code: OrderServerErrorCode) {
    super(orderErrorMessages[code]);
    this.name = "OrderServerError";
    this.code = code;
  }
}

export function sanitizeOrderServerError(error: unknown): OrderServerError {
  return error instanceof OrderServerError
    ? error
    : new OrderServerError("ORDER_CREATION_FAILED");
}
