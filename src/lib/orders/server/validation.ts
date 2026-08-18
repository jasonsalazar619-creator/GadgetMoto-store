import "server-only";

import { isPaymentGatewayEnabled } from "./config";
import { OrderServerError } from "./order-error";
import { primaryPickupLocation } from "@/lib/storefront/pickup-location";
import {
  fulfillmentMethods,
  supportedPaymentMethods,
  type CheckoutDeliveryAddressInput,
  type CheckoutFulfillmentInput,
  type CreateOrderRequest,
  type FulfillmentMethod,
  type SupportedPaymentMethod,
} from "./types";

const maximumCartItems = 12;
const idempotencyKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const productSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const skuPattern = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sensitivePaymentLabelPattern =
  /\b(?:card\s*(?:number|no)|cvv|cvc|pin|password|passcode|otp|bank(?:ing)?\s*(?:account|credential)|account\s*(?:number|no))\b/i;
const longDigitSequencePattern = /(?:\d[\s-]*){13,19}/;

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const hasOnlyKeys = (
  value: PlainObject,
  allowedKeys: readonly string[],
): boolean => {
  const allowed = new Set(allowedKeys);
  return Object.keys(value).every((key) => allowed.has(key));
};

const normalizeText = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const readText = (
  value: unknown,
  maximumLength: number,
  code: "INVALID_CHECKOUT_REQUEST" | "INVALID_ADDRESS",
): string => {
  if (typeof value !== "string") throw new OrderServerError(code);
  const normalized = normalizeText(value);
  if (!normalized || normalized.length > maximumLength) {
    throw new OrderServerError(code);
  }
  return normalized;
};

const readAddress = (value: unknown): CheckoutDeliveryAddressInput => {
  if (
    !isPlainObject(value) ||
    !hasOnlyKeys(value, [
      "streetAddress",
      "province",
      "cityMunicipality",
      "barangay",
      "postalCode",
    ])
  ) {
    throw new OrderServerError("INVALID_ADDRESS");
  }

  const postalCode = readText(
    value.postalCode,
    4,
    "INVALID_ADDRESS",
  );
  if (!/^\d{4}$/.test(postalCode)) {
    throw new OrderServerError("INVALID_ADDRESS");
  }

  return {
    streetAddress: readText(
      value.streetAddress,
      200,
      "INVALID_ADDRESS",
    ),
    province: readText(value.province, 100, "INVALID_ADDRESS"),
    cityMunicipality: readText(
      value.cityMunicipality,
      100,
      "INVALID_ADDRESS",
    ),
    barangay: readText(value.barangay, 100, "INVALID_ADDRESS"),
    postalCode,
  };
};

const readFulfillment = (value: unknown): CheckoutFulfillmentInput => {
  if (!isPlainObject(value) || typeof value.method !== "string") {
    throw new OrderServerError("INVALID_FULFILLMENT");
  }

  if (
    !fulfillmentMethods.some((method) => method === value.method)
  ) {
    throw new OrderServerError("INVALID_FULFILLMENT");
  }

  if (value.method === "store_pickup") {
    if (
      !hasOnlyKeys(value, ["method", "pickupLocationSlug"]) ||
      value.pickupLocationSlug !== primaryPickupLocation.slug
    ) {
      throw new OrderServerError("INVALID_PICKUP_LOCATION");
    }
    return {
      method: "store_pickup",
      pickupLocationSlug: primaryPickupLocation.slug,
    };
  }

  if (
    (value.method !== "nationwide_delivery" &&
      value.method !== "same_day_delivery") ||
    !hasOnlyKeys(value, ["method", "address"])
  ) {
    throw new OrderServerError("INVALID_FULFILLMENT");
  }

  return {
    method: value.method,
    address: readAddress(value.address),
  };
};

const readMobile = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
  }

  const digits = value.replace(/\D/g, "");
  if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
  if (/^639\d{9}$/.test(digits)) return `+${digits}`;
  throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
};

const isSupportedPaymentMethod = (
  value: string,
): value is SupportedPaymentMethod =>
  supportedPaymentMethods.some((method) => method === value);

const isFulfillmentMethod = (value: string): value is FulfillmentMethod =>
  fulfillmentMethods.some((method) => method === value);

const readPaymentMethod = (value: unknown): SupportedPaymentMethod => {
  if (
    typeof value !== "string" ||
    !isSupportedPaymentMethod(value)
  ) {
    throw new OrderServerError("UNSUPPORTED_PAYMENT_METHOD");
  }
  if (value === "maya_online" && !isPaymentGatewayEnabled()) {
    throw new OrderServerError("UNSUPPORTED_PAYMENT_METHOD");
  }
  return value;
};

export function validateCreateOrderRequest(
  value: unknown,
): CreateOrderRequest {
  if (
    !isPlainObject(value) ||
    !hasOnlyKeys(value, [
      "contractVersion",
      "idempotencyKey",
      "items",
      "customer",
      "fulfillment",
      "paymentMethod",
      "customerNotes",
      "consents",
    ]) ||
    value.contractVersion !== 1
  ) {
    throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
  }

  if (
    typeof value.idempotencyKey !== "string" ||
    !idempotencyKeyPattern.test(value.idempotencyKey)
  ) {
    throw new OrderServerError("INVALID_IDEMPOTENCY_KEY");
  }

  if (!Array.isArray(value.items) || value.items.length === 0) {
    throw new OrderServerError("EMPTY_CART");
  }
  if (value.items.length > maximumCartItems) {
    throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
  }

  const itemKeys = new Set<string>();
  const items = value.items.map((item) => {
    if (
      !isPlainObject(item) ||
      !hasOnlyKeys(item, [
        "productSlug",
        "sku",
        "colorId",
        "fulfillmentMethod",
        "quantity",
      ]) ||
      typeof item.productSlug !== "string" ||
      typeof item.sku !== "string" ||
      typeof item.fulfillmentMethod !== "string" ||
      !isFulfillmentMethod(item.fulfillmentMethod)
    ) {
      throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
    }

    const productSlug = item.productSlug.trim();
    const sku = item.sku.trim().toUpperCase();
    const colorId =
      typeof item.colorId === "string"
        ? item.colorId.trim().toLowerCase()
        : undefined;
    if (
      productSlug.length > 120 ||
      !productSlugPattern.test(productSlug) ||
      !skuPattern.test(sku)
    ) {
      throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
    }
    if (item.colorId !== undefined && (!colorId || !uuidPattern.test(colorId))) {
      throw new OrderServerError("INVALID_COLOR_SELECTION");
    }
    if (
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      throw new OrderServerError("INVALID_QUANTITY");
    }

    const itemKey = `${productSlug}::${sku.toLowerCase()}::${colorId ?? "no-color"}::${item.fulfillmentMethod}`;
    if (itemKeys.has(itemKey)) {
      throw new OrderServerError("DUPLICATE_CART_ITEM");
    }
    itemKeys.add(itemKey);

    return {
      productSlug,
      sku,
      ...(colorId ? { colorId } : {}),
      fulfillmentMethod: item.fulfillmentMethod,
      quantity: item.quantity,
    };
  });

  if (
    !isPlainObject(value.customer) ||
    !hasOnlyKeys(value.customer, ["fullName", "mobile", "email"])
  ) {
    throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
  }

  const fullName = readText(
    value.customer.fullName,
    120,
    "INVALID_CHECKOUT_REQUEST",
  );
  if (fullName.length < 2) {
    throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
  }

  let email: string | undefined;
  if (
    value.customer.email !== undefined &&
    value.customer.email !== null &&
    value.customer.email !== ""
  ) {
    if (typeof value.customer.email !== "string") {
      throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
    }
    email = value.customer.email.trim().toLowerCase();
    if (email.length > 254 || !emailPattern.test(email)) {
      throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
    }
  }

  const fulfillment = readFulfillment(value.fulfillment);
  if (
    items.some(
      (item) => item.fulfillmentMethod !== fulfillment.method,
    )
  ) {
    throw new OrderServerError("INVALID_FULFILLMENT");
  }
  const paymentMethod = readPaymentMethod(value.paymentMethod);
  if (
    paymentMethod === "cash_on_pickup" &&
    fulfillment.method !== "store_pickup"
  ) {
    throw new OrderServerError("UNSUPPORTED_PAYMENT_METHOD");
  }

  if (
    !isPlainObject(value.consents) ||
    !hasOnlyKeys(value.consents, [
      "privacyAccepted",
      "termsAccepted",
      "finalReviewAccepted",
    ]) ||
    value.consents.privacyAccepted !== true ||
    value.consents.termsAccepted !== true ||
    value.consents.finalReviewAccepted !== true
  ) {
    throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
  }

  let customerNotes: string | undefined;
  if (
    value.customerNotes !== undefined &&
    value.customerNotes !== null &&
    value.customerNotes !== ""
  ) {
    customerNotes = readText(
      value.customerNotes,
      500,
      "INVALID_CHECKOUT_REQUEST",
    );
    if (
      sensitivePaymentLabelPattern.test(customerNotes) ||
      longDigitSequencePattern.test(customerNotes)
    ) {
      throw new OrderServerError("INVALID_CHECKOUT_REQUEST");
    }
  }

  return {
    contractVersion: 1,
    idempotencyKey: value.idempotencyKey.toLowerCase(),
    items: [...items].sort(
      (left, right) =>
        left.productSlug.localeCompare(right.productSlug) ||
        left.sku.localeCompare(right.sku) ||
        (left.colorId ?? "").localeCompare(right.colorId ?? "") ||
        left.fulfillmentMethod.localeCompare(right.fulfillmentMethod),
    ),
    customer: {
      fullName,
      mobile: readMobile(value.customer.mobile),
      ...(email ? { email } : {}),
    },
    fulfillment,
    paymentMethod,
    ...(customerNotes ? { customerNotes } : {}),
    consents: {
      privacyAccepted: true,
      termsAccepted: true,
      finalReviewAccepted: true,
    },
  };
}
