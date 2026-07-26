import "server-only";

export const orderStatuses = [
  "draft",
  "pending_review",
  "confirmed",
  "awaiting_payment",
  "paid",
  "processing",
  "ready_for_pickup",
  "shipped",
  "completed",
  "cancelled",
] as const;

export const paymentStatuses = [
  "pending",
  "instructions_pending",
  "awaiting_payment",
  "processing",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
] as const;

export const fulfillmentMethods = [
  "nationwide_delivery",
  "same_day_delivery",
  "store_pickup",
] as const;

export const supportedPaymentMethods = [
  "maya_online",
  "maya_manual",
  "gcash",
  "bank_transfer",
  "cash_on_pickup",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type FulfillmentMethod = (typeof fulfillmentMethods)[number];
export type SupportedPaymentMethod =
  (typeof supportedPaymentMethods)[number];

export type CheckoutOrderItemInput = Readonly<{
  productSlug: string;
  sku: string;
  quantity: number;
}>;

export type CheckoutCustomerInput = Readonly<{
  fullName: string;
  mobile: string;
  email?: string;
}>;

export type CheckoutDeliveryAddressInput = Readonly<{
  streetAddress: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  postalCode: string;
}>;

export type CheckoutFulfillmentInput =
  | Readonly<{
      method: "nationwide_delivery" | "same_day_delivery";
      address: CheckoutDeliveryAddressInput;
    }>
  | Readonly<{
      method: "store_pickup";
      pickupLocationSlug: string;
    }>;

export type CheckoutConsentInput = Readonly<{
  privacyAccepted: true;
  termsAccepted: true;
  finalReviewAccepted: true;
}>;

export type CreateOrderRequest = Readonly<{
  contractVersion: 1;
  idempotencyKey: string;
  items: readonly CheckoutOrderItemInput[];
  customer: CheckoutCustomerInput;
  fulfillment: CheckoutFulfillmentInput;
  paymentMethod: SupportedPaymentMethod;
  customerNotes?: string;
  consents: CheckoutConsentInput;
}>;

export type CreateOrderServerPolicy = Readonly<{
  reservationExpiresAt: Date;
}>;

export type CreateOrderNextAction =
  | "awaiting_review"
  | "awaiting_payment_instructions"
  | "payment_initialization_pending"
  | "order_confirmed";

export type CreateOrderSuccessResponse = Readonly<{
  success: true;
  publicOrderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus | "not_created";
  fulfillmentMethod: FulfillmentMethod;
  confirmedSubtotalCentavos: string;
  confirmedDeliveryFeeCentavos: string | null;
  confirmedVatCentavos: string | null;
  confirmedFinalTotalCentavos: string | null;
  nextAction: CreateOrderNextAction;
  confirmationToken: string;
}>;
