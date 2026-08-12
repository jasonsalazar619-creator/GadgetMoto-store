"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { ProductArtwork } from "@/components/storefront/product-artwork";

type Delivery = "nationwide" | "same-day";
type Payment =
  | "maya-online"
  | "maya-transfer"
  | "gcash"
  | "bank"
  | "";
type Values = {
  fullName: string;
  mobile: string;
  email: string;
  street: string;
  province: string;
  city: string;
  barangay: string;
  postal: string;
  notes: string;
  delivery: Delivery;
  payment: Payment;
  privacy: boolean;
  terms: boolean;
  confirmation: boolean;
};
type FieldName = keyof Values;
type OrderResult = Readonly<{
  publicOrderNumber: string;
  wasReplay: boolean;
  customer: Readonly<{
    fullName: string;
    mobile: string;
    email: string;
  }>;
  delivery: Readonly<{
    method: string;
    address: string;
  }>;
  paymentLabel: string;
  paymentStatus: "instructions_pending";
  items: readonly Readonly<{
    lineId: string;
    productName: string;
    variant: string;
    ramGb: number | null;
    storageGb: number;
    colorName: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>[];
  subtotal: number;
}>;

const initialValues: Values = {
  fullName: "",
  mobile: "",
  email: "",
  street: "",
  province: "",
  city: "",
  barangay: "",
  postal: "",
  notes: "",
  delivery: "nationwide",
  payment: "",
  privacy: false,
  terms: false,
  confirmation: false,
};
const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
const messengerUrl =
  "https://www.facebook.com/profile.php?id=100063905416187";
const idempotencyStorageKey = "gadgetmoto:checkout:idempotency:v1";
const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sensitivePaymentLabelPattern =
  /\b(?:card\s*(?:number|no)|cvv|cvc|pin|password|passcode|otp|bank(?:ing)?\s*(?:account|credential)|account\s*(?:number|no))\b/i;
const longDigitSequencePattern = /(?:\d[\s-]*){13,19}/;
const deliveryLabels: Record<Delivery, string> = {
  nationwide: "Nationwide Delivery",
  "same-day": "Same-Day Delivery",
};
const paymentLabels: Record<Exclude<Payment, "">, string> = {
  "maya-online": "Maya Online Payment",
  "maya-transfer": "Maya Manual Transfer",
  gcash: "GCash",
  bank: "Bank Transfer",
};
const paymentMethods: Record<
  Exclude<Payment, "">,
  "maya_online" | "maya_manual" | "gcash" | "bank_transfer"
> = {
  "maya-online": "maya_online",
  "maya-transfer": "maya_manual",
  gcash: "gcash",
  bank: "bank_transfer",
};

function Field({
  label,
  name,
  value,
  error,
  onChange,
  required = true,
  ...props
}: {
  label: string;
  name: FieldName;
  value: string;
  error?: string;
  onChange: (name: FieldName, value: string) => void;
  required?: boolean;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "value" | "onChange"
>) {
  return (
    <label className="checkout-field" htmlFor={`checkout-${name}`}>
      <span>
        {label}{" "}
        {required ? (
          <b aria-hidden="true">*</b>
        ) : (
          <i>Optional</i>
        )}
      </span>
      <input
        {...props}
        aria-describedby={error ? `checkout-${name}-error` : undefined}
        aria-invalid={!!error}
        id={`checkout-${name}`}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        value={value}
      />
      {error ? (
        <small id={`checkout-${name}-error`}>{error}</small>
      ) : null}
    </label>
  );
}

const readResponseCode = (value: unknown): string | undefined => {
  if (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "string"
  ) {
    return value.code;
  }
  return undefined;
};

const getCustomerError = (
  status: number,
  response: unknown,
): string => {
  const code = readResponseCode(response);
  if (status === 503 || code === "ORDER_DATABASE_NOT_CONFIGURED") {
    return "Online order submission is temporarily unavailable. Please try again later.";
  }
  if (
    status === 409 ||
    code === "PRODUCT_NOT_AVAILABLE" ||
    code === "INVALID_COLOR_SELECTION" ||
    code === "INSUFFICIENT_INVENTORY"
  ) {
    return "One or more products are no longer available. Your cart has been kept so you can review it.";
  }
  if (
    code === "INVALID_ADDRESS" ||
    code === "INVALID_CHECKOUT_REQUEST"
  ) {
    return "Review your checkout details and try again.";
  }
  if (code === "UNSUPPORTED_PAYMENT_METHOD") {
    return "Choose an available payment method and try again.";
  }
  return "We could not receive your order. Please try again later.";
};

export function CheckoutForm({
  onlineOrderingEnabled,
  paymentGatewayEnabled,
}: {
  onlineOrderingEnabled: boolean;
  paymentGatewayEnabled: boolean;
}) {
  const { items, subtotal, clearCart } = useCart();
  const { productBySlug } = useCatalog();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [reviewed, setReviewed] = useState(false);
  const [guidance, setGuidance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [orderResult, setOrderResult] = useState<OrderResult | null>(
    null,
  );
  const previousCartRef = useRef("");
  const idempotencyKeyRef = useRef("");
  const idempotencySignatureRef = useRef("");
  const submissionInFlightRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const cartSignature = items
    .map(
      (item) =>
        `${item.productSlug}:${item.product.sku}:${item.color?.id ?? "no-color"}:${item.quantity}`,
    )
    .join("|");

  const ensureIdempotencyKey = useCallback((): string => {
    if (
      idempotencySignatureRef.current === cartSignature &&
      uuidV4Pattern.test(idempotencyKeyRef.current)
    ) {
      return idempotencyKeyRef.current;
    }

    let key = "";
    try {
      const stored: unknown = JSON.parse(
        sessionStorage.getItem(idempotencyStorageKey) ?? "null",
      );
      if (
        typeof stored === "object" &&
        stored !== null &&
        "cartSignature" in stored &&
        "key" in stored &&
        stored.cartSignature === cartSignature &&
        typeof stored.key === "string" &&
        uuidV4Pattern.test(stored.key)
      ) {
        key = stored.key;
      }
    } catch {
      // A fresh in-memory key remains available when storage is blocked.
    }

    key ||= crypto.randomUUID();
    idempotencyKeyRef.current = key;
    idempotencySignatureRef.current = cartSignature;
    try {
      sessionStorage.setItem(
        idempotencyStorageKey,
        JSON.stringify({ cartSignature, key }),
      );
    } catch {
      // The retry key remains available for the current page session.
    }
    return key;
  }, [cartSignature]);

  useEffect(() => {
    if (!onlineOrderingEnabled || !cartSignature) return;
    ensureIdempotencyKey();
  }, [cartSignature, ensureIdempotencyKey, onlineOrderingEnabled]);

  useEffect(() => {
    if (
      previousCartRef.current &&
      previousCartRef.current !== cartSignature &&
      reviewed
    ) {
      setReviewed(false);
      setGuidance(
        "Your cart changed. Review your checkout details again.",
      );
      setSubmissionError("");
    }
    previousCartRef.current = cartSignature;
  }, [cartSignature, reviewed]);

  const update = (name: FieldName, value: string | boolean) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setReviewed(false);
    setSubmissionError("");
  };

  const chooseDelivery = (delivery: Delivery) => {
    setValues((current) => ({ ...current, delivery }));
    setErrors((current) => ({
      ...current,
      delivery: undefined,
    }));
    setReviewed(false);
    setSubmissionError("");
  };

  const validate = () => {
    const next: Partial<Record<FieldName, string>> = {};
    if (values.fullName.trim().length < 2) {
      next.fullName = "Enter your full name.";
    }
    const mobile = values.mobile.replace(/\D/g, "");
    if (!/^(09\d{9}|639\d{9})$/.test(mobile)) {
      next.mobile =
        "Enter a Philippine mobile number such as 09XXXXXXXXX or +639XXXXXXXXX.";
    }
    if (
      values.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    ) {
      next.email = "Enter a valid email address.";
    }
    if (!values.street.trim()) {
      next.street = "Enter the complete street address.";
    }
    if (!values.province.trim()) next.province = "Enter the province.";
    if (!values.city.trim()) {
      next.city = "Enter the city or municipality.";
    }
    if (!values.barangay.trim()) {
      next.barangay = "Enter the barangay.";
    }
    if (!/^\d{4}$/.test(values.postal.trim())) {
      next.postal = "Enter a valid four-digit postal code.";
    }
    if (!values.payment) next.payment = "Choose a payment method.";
    if (!values.privacy) {
      next.privacy = "Privacy Policy agreement is required.";
    }
    if (!values.terms) {
      next.terms = "Terms and Conditions agreement is required.";
    }
    if (!values.confirmation) {
      next.confirmation = "Confirmation acknowledgement is required.";
    }
    if (
      sensitivePaymentLabelPattern.test(values.notes) ||
      longDigitSequencePattern.test(values.notes)
    ) {
      next.notes =
        "Remove payment-card, PIN, password, OTP, or banking credentials from the notes.";
    }
    return next;
  };

  const reviewOrder = (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      setReviewed(false);
      window.setTimeout(
        () =>
          formRef.current
            ?.querySelector<HTMLElement>("[aria-invalid='true']")
            ?.focus(),
        0,
      );
      return;
    }
    setReviewed(true);
    setGuidance("");
    setSubmissionError("");
    window.setTimeout(
      () => document.getElementById("checkout-review")?.focus(),
      0,
    );
  };

  const submitOrder = async () => {
    if (!onlineOrderingEnabled) {
      setSubmissionError(
        "Online order submission is currently unavailable. Please contact us to complete your order.",
      );
      return;
    }

    if (submissionInFlightRef.current) return;

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length || !items.length || !values.payment) {
      setReviewed(false);
      setSubmissionError(
        items.length
          ? "Review the highlighted checkout details."
          : "Add at least one product before submitting your order.",
      );
      return;
    }

    const orderItems = items.flatMap((item) => {
      const product = productBySlug(item.productSlug);
      if (
        !product ||
        product.variant !== item.variant ||
        !product.sku
      ) {
        return [];
      }
      return [
        {
          productSlug: product.slug,
          sku: product.sku,
          ...(item.color ? { colorId: item.color.id } : {}),
          quantity: item.quantity,
        },
      ];
    });
    if (orderItems.length !== items.length) {
      setSubmissionError(
        "A product in your cart could not be verified. Your cart has been kept for review.",
      );
      return;
    }

    submissionInFlightRef.current = true;
    setSubmitting(true);
    setSubmissionError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractVersion: 1,
          idempotencyKey: ensureIdempotencyKey(),
          items: orderItems,
          customer: {
            fullName: values.fullName,
            mobile: values.mobile,
            email: values.email,
          },
          fulfillment: {
            method:
              values.delivery === "nationwide"
                ? "nationwide_delivery"
                : "same_day_delivery",
            address: {
              streetAddress: values.street,
              province: values.province,
              cityMunicipality: values.city,
              barangay: values.barangay,
              postalCode: values.postal,
            },
          },
          paymentMethod: paymentMethods[values.payment],
          ...(values.notes.trim()
            ? { customerNotes: values.notes }
            : {}),
          consents: {
            privacyAccepted: true,
            termsAccepted: true,
            finalReviewAccepted: true,
          },
        }),
      });
      let responseBody: unknown;
      try {
        responseBody = (await response.json()) as unknown;
      } catch {
        responseBody = null;
      }

      if (!response.ok) {
        setSubmissionError(
          getCustomerError(response.status, responseBody),
        );
        return;
      }
      if (
        typeof responseBody !== "object" ||
        responseBody === null ||
        !("success" in responseBody) ||
        responseBody.success !== true ||
        !("publicOrderNumber" in responseBody) ||
        typeof responseBody.publicOrderNumber !== "string" ||
        !responseBody.publicOrderNumber ||
        !("wasReplay" in responseBody) ||
        typeof responseBody.wasReplay !== "boolean" ||
        !("paymentStatus" in responseBody) ||
        responseBody.paymentStatus !== "instructions_pending"
      ) {
        setSubmissionError(
          "We could not confirm that your order was received. Please try again.",
        );
        return;
      }

      setOrderResult({
        publicOrderNumber: responseBody.publicOrderNumber,
        wasReplay: responseBody.wasReplay,
        customer: {
          fullName: values.fullName,
          mobile: values.mobile,
          email: values.email,
        },
        delivery: {
          method: deliveryLabels[values.delivery],
          address: `${values.street}, ${values.barangay}, ${values.city}, ${values.province} ${values.postal}`,
        },
        paymentLabel: paymentLabels[values.payment],
        paymentStatus: responseBody.paymentStatus,
        items: items.map((item) => ({
          lineId: item.lineId,
          productName: item.product.name,
          variant: item.variant,
          ramGb: item.product.ramGb ?? null,
          storageGb: item.product.storageGb,
          colorName: item.color?.name ?? null,
          quantity: item.quantity,
          unitPrice: item.product.currentPrice,
          lineTotal: item.lineTotal,
        })),
        subtotal,
      });
      setReviewed(false);
      try {
        sessionStorage.removeItem(idempotencyStorageKey);
      } catch {
        // No persisted customer information needs cleanup.
      }
      idempotencyKeyRef.current = "";
      idempotencySignatureRef.current = "";
      clearCart();
      window.setTimeout(
        () => document.getElementById("checkout-order-result")?.focus(),
        0,
      );
    } catch {
      setSubmissionError(
        "We could not reach the order service. Your cart has been kept so you can try again.",
      );
    } finally {
      submissionInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  const contactSummary = [
    "GadgetMoTo order inquiry",
    ...items.map(
      (item) =>
        `${item.product.name} — ${item.variant}${item.color ? ` — ${item.color.name}` : ""} — Qty ${item.quantity}`,
    ),
    `Estimated merchandise subtotal: ${money.format(subtotal)}`,
    `Delivery preference: ${deliveryLabels[values.delivery]}`,
    "Please confirm product availability, delivery charges, and payment instructions.",
  ].join("\n");

  const copyContactSummary = async () => {
    try {
      await navigator.clipboard.writeText(contactSummary);
      setGuidance(
        "Order summary copied. Paste it into your Messenger conversation when you are ready.",
      );
    } catch {
      setGuidance(
        "Messenger is opening. The same order summary remains visible below for you to copy.",
      );
    }
  };

  if (orderResult) {
    return (
      <section
        aria-live="polite"
        className="checkout-review checkout-order-result"
        id="checkout-order-result"
        tabIndex={-1}
      >
        <p className="type-eyebrow">PAYMENT VERIFICATION PENDING</p>
        <h2>Order Submitted</h2>
        <strong>
          Thank you! Your order has been received. Payment verification
          will be handled manually by GadgetMoTo. We will confirm your
          order once your payment has been verified.
        </strong>
        <p>Your order has been submitted and is awaiting payment verification.</p>
        <p className="checkout-order-number">
          <span>Public order number</span>
          {orderResult.publicOrderNumber}
        </p>
        {orderResult.wasReplay ? (
          <p>
            This order attempt was already received, so no duplicate order
            was created.
          </p>
        ) : null}
        <section className="checkout-contact-summary">
          <h3>Manual Payment</h3>
          <p>
            Please complete your payment using the payment instructions
            provided and wait for confirmation from GadgetMoTo.
          </p>
          <p>
            Payment instructions will be provided by GadgetMoTo after
            your order is submitted.
          </p>
        </section>
        <div className="checkout-review-grid">
          <section>
            <h3>Customer</h3>
            <p>
              {orderResult.customer.fullName}
              <br />
              {orderResult.customer.mobile}
              {orderResult.customer.email ? (
                <>
                  <br />
                  {orderResult.customer.email}
                </>
              ) : null}
            </p>
          </section>
          <section>
            <h3>Delivery</h3>
            <p>
              {orderResult.delivery.method}
              <br />
              {orderResult.delivery.address}
            </p>
          </section>
          <section>
            <h3>Payment preference</h3>
            <p>
              {orderResult.paymentLabel}
              <br />
              Status: {orderResult.paymentStatus.replaceAll("_", " ")}
            </p>
          </section>
          <section>
            <h3>Products</h3>
            {orderResult.items.map((item) => (
              <p key={item.lineId}>
                {item.productName} · {item.variant}
                {item.colorName ? ` · ${item.colorName}` : ""} · Qty {item.quantity} ·{" "}
                {money.format(item.lineTotal)}
                <br />
                {item.ramGb ? `${item.ramGb}GB RAM · ` : ""}
                {item.storageGb}GB storage
              </p>
            ))}
          </section>
        </div>
        <dl>
          <div>
            <dt>Merchandise subtotal</dt>
            <dd>{money.format(orderResult.subtotal)}</dd>
          </div>
          <div>
            <dt>Final payable amount</dt>
            <dd>Pending VAT, delivery, availability, and payment review</dd>
          </div>
        </dl>
        <p>
          Keep this complete order number. GadgetMoTo will confirm
          availability, delivery fees, VAT treatment, final payable
          amount, and payment instructions separately.
        </p>
        <div>
          <Link href="/shop">Continue Shopping</Link>
          <a
            href={messengerUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Message GadgetMoTo
          </a>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="checkout-empty">
        <p className="type-eyebrow text-[var(--color-action)]">
          GUEST CHECKOUT
        </p>
        <h1>Your checkout is waiting for a cart.</h1>
        <p>
          Add a GadgetMoTo phone or tablet before continuing to checkout.
        </p>
        <div>
          <Link href="/shop">Shop All Products</Link>
          <Link href="/phones">Browse Phones</Link>
          <Link href="/tablets">Browse Tablets</Link>
        </div>
      </section>
    );
  }

  const address = `${values.street}, ${values.barangay}, ${values.city}, ${values.province} ${values.postal}`;

  return (
    <>
      <div className="checkout-heading">
        <p className="type-eyebrow text-[var(--color-action)]">
          GUEST CHECKOUT
        </p>
        <h1>Review your GadgetMoTo order.</h1>
        <p>
          Provide delivery details, choose a manual payment preference,
          and review your cart before submitting your order.
        </p>
      </div>
      {!onlineOrderingEnabled ? (
        <aside className="checkout-ordering-notice" role="status">
          <h2>Contact-based ordering is active.</h2>
          <p>
            Online order submission is currently unavailable. Please
            contact us to complete your order.
          </p>
          <p>
            Contact us to confirm product availability, delivery charges,
            and payment instructions.
          </p>
        </aside>
      ) : null}
      {guidance ? (
        <p aria-live="polite" className="checkout-guidance">
          {guidance}
        </p>
      ) : null}
      {submissionError ? (
        <aside className="checkout-error-summary" role="alert">
          <h2>We could not receive your order.</h2>
          <p>{submissionError}</p>
        </aside>
      ) : null}
      {Object.keys(errors).length ? (
        <aside className="checkout-error-summary" role="alert">
          <h2>Review the highlighted checkout details.</h2>
          <p>
            {Object.keys(errors).length} required{" "}
            {Object.keys(errors).length === 1
              ? "detail needs"
              : "details need"}{" "}
            attention.
          </p>
        </aside>
      ) : null}
      <form
        className="checkout-grid"
        noValidate
        onSubmit={reviewOrder}
        ref={formRef}
      >
        <div className="checkout-form-sections">
          <section className="checkout-section">
            <h2>1. Contact Information</h2>
            <div className="checkout-field-grid">
              <Field
                autoComplete="name"
                error={errors.fullName}
                label="Full name"
                name="fullName"
                onChange={update}
                value={values.fullName}
              />
              <Field
                autoComplete="tel"
                error={errors.mobile}
                inputMode="tel"
                label="Mobile number"
                name="mobile"
                onChange={update}
                type="tel"
                value={values.mobile}
              />
              <Field
                autoComplete="email"
                error={errors.email}
                label="Email address"
                name="email"
                onChange={update}
                required={false}
                type="email"
                value={values.email}
              />
            </div>
          </section>

          <section className="checkout-section">
            <fieldset>
              <legend>2. Delivery Method</legend>
              <div className="checkout-options">
                {(["nationwide", "same-day"] as Delivery[]).map(
                  (method) => (
                    <label key={method}>
                      <input
                        checked={values.delivery === method}
                        name="delivery"
                        onChange={() => chooseDelivery(method)}
                        type="radio"
                        value={method}
                      />
                      <span>
                        <strong>{deliveryLabels[method]}</strong>
                        <small>
                          {method === "nationwide"
                            ? "Delivery fees, courier details, and timing will be confirmed after review."
                            : "Subject to location, availability, and sales-team confirmation."}
                        </small>
                      </span>
                    </label>
                  ),
                )}
                <label
                  aria-disabled="true"
                  className="checkout-option--disabled"
                >
                  <input disabled name="delivery" type="radio" />
                  <span>
                    <strong>Store Pickup</strong>
                    <small>
                      Unavailable until branch and pickup details are
                      confirmed.
                    </small>
                  </span>
                </label>
              </div>
            </fieldset>
          </section>

          <section className="checkout-section">
            <h2>3. Delivery Address</h2>
            <div className="checkout-field-grid">
              <Field
                autoComplete="street-address"
                error={errors.street}
                label="Complete street address"
                name="street"
                onChange={update}
                value={values.street}
              />
              <Field
                autoComplete="address-level1"
                error={errors.province}
                label="Province"
                name="province"
                onChange={update}
                value={values.province}
              />
              <Field
                autoComplete="address-level2"
                error={errors.city}
                label="City or municipality"
                name="city"
                onChange={update}
                value={values.city}
              />
              <Field
                error={errors.barangay}
                label="Barangay"
                name="barangay"
                onChange={update}
                value={values.barangay}
              />
              <Field
                autoComplete="postal-code"
                error={errors.postal}
                inputMode="numeric"
                label="Postal code"
                maxLength={4}
                name="postal"
                onChange={update}
                value={values.postal}
              />
            </div>
          </section>

          <section className="checkout-section">
            <fieldset>
              <legend>4. Manual Payment Approval</legend>
              <div className="checkout-contact-summary">
                <h3>Manual Payment</h3>
                <p>
                  Please complete your payment using the payment
                  instructions provided and wait for confirmation from
                  GadgetMoTo.
                </p>
                <p>
                  Payment instructions will be provided by GadgetMoTo
                  after your order is submitted.
                </p>
              </div>
              <div className="checkout-options">
                {(
                  paymentGatewayEnabled
                    ? ([
                        "maya-online",
                        "maya-transfer",
                        "gcash",
                        "bank",
                      ] as Exclude<Payment, "">[])
                    : ([
                        "maya-transfer",
                        "gcash",
                        "bank",
                      ] as Exclude<Payment, "">[])
                ).map((method) => (
                  <label key={method}>
                    <input
                      checked={values.payment === method}
                      name="payment"
                      onChange={() => update("payment", method)}
                      type="radio"
                      value={method}
                    />
                    <span>
                      <strong>{paymentLabels[method]}</strong>
                      <small>
                        {method === "maya-online"
                          ? "Automated Maya checkout is available only when the server-side gateway feature is enabled."
                          : "Payment instructions are provided after the order is submitted and reviewed."}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              {errors.payment ? (
                <small className="checkout-group-error">
                  {errors.payment}
                </small>
              ) : null}
            </fieldset>
          </section>

          <section className="checkout-section">
            <h2>5. Order Notes</h2>
            <label className="checkout-field" htmlFor="checkout-notes">
              <span>
                Order notes <i>Optional</i>
              </span>
              <textarea
                aria-describedby={
                  errors.notes ? "checkout-notes-error" : undefined
                }
                aria-invalid={!!errors.notes}
                id="checkout-notes"
                maxLength={500}
                onChange={(event) =>
                  update("notes", event.target.value)
                }
                rows={4}
                value={values.notes}
              />
              <small className="checkout-help">
                Add a delivery instruction or question for the
                GadgetMoTo sales team. Do not include passwords, card
                details, or other sensitive payment information.{" "}
                {values.notes.length}/500
              </small>
              {errors.notes ? (
                <small id="checkout-notes-error">{errors.notes}</small>
              ) : null}
            </label>
          </section>

          <section className="checkout-section">
            <fieldset>
              <legend>6. Required Confirmations</legend>
              <div className="checkout-consents">
                <label>
                  <input
                    aria-invalid={!!errors.privacy}
                    checked={values.privacy}
                    onChange={(event) =>
                      update("privacy", event.target.checked)
                    }
                    type="checkbox"
                  />
                  I have read and agree to the{" "}
                  <Link href="/privacy-policy">Privacy Policy</Link>.
                </label>
                {errors.privacy ? <small>{errors.privacy}</small> : null}
                <label>
                  <input
                    aria-invalid={!!errors.terms}
                    checked={values.terms}
                    onChange={(event) =>
                      update("terms", event.target.checked)
                    }
                    type="checkbox"
                  />
                  I have read and agree to the{" "}
                  <Link href="/terms-and-conditions">
                    Terms and Conditions
                  </Link>
                  .
                </label>
                {errors.terms ? <small>{errors.terms}</small> : null}
                <label>
                  <input
                    aria-invalid={!!errors.confirmation}
                    checked={values.confirmation}
                    onChange={(event) =>
                      update("confirmation", event.target.checked)
                    }
                    type="checkbox"
                  />
                  I understand that product availability, VAT, delivery
                  fees, final payable amount, and payment instructions
                  must still be confirmed before payment.
                </label>
                {errors.confirmation ? (
                  <small>{errors.confirmation}</small>
                ) : null}
              </div>
            </fieldset>
          </section>
          <button className="checkout-review-button" type="submit">
            Review Order Details
          </button>
        </div>

        <aside className="checkout-summary">
          <h2>Order Summary</h2>
          {items.map((item) => (
            <article key={item.lineId}>
              <div>
                <ProductArtwork
                  product={item.product}
                  sizes="3.5rem"
                />
              </div>
              <span>
                <small>{item.product.brand}</small>
                <strong>{item.product.name}</strong>
                <small>
                  {item.variant}
                  {item.color ? ` · ${item.color.name}` : ""} · Qty {item.quantity}
                </small>
              </span>
              <span>
                {money.format(item.lineTotal)}
                <small>
                  {money.format(item.product.currentPrice)} each
                </small>
              </span>
            </article>
          ))}
          <dl>
            <div>
              <dt>Current merchandise estimate</dt>
              <dd>{money.format(subtotal)}</dd>
            </div>
            <div>
              <dt>VAT</dt>
              <dd>Pending confirmation</dd>
            </div>
            <div>
              <dt>Shipping or delivery fee</dt>
              <dd>Pending confirmation</dd>
            </div>
            <div>
              <dt>Final payable amount</dt>
              <dd>
                Pending final VAT, delivery, availability, and payment
                review
              </dd>
            </div>
          </dl>
        </aside>
      </form>

      {reviewed ? (
        <section
          aria-live="polite"
          className="checkout-review"
          id="checkout-review"
          tabIndex={-1}
        >
          <p className="type-eyebrow">ORDER REVIEW READY</p>
          <h2>
            {onlineOrderingEnabled
              ? "Review your details before submitting."
              : "Review your details before contacting us."}
          </h2>
          <strong>
            {onlineOrderingEnabled
              ? "Submitting receives the order for review. It does not process a payment or mark the order as paid."
              : "Online submission is unavailable. Use the contact action below to continue deliberately through Messenger."}
          </strong>
          <div className="checkout-review-grid">
            <section>
              <h3>Customer</h3>
              <p>
                {values.fullName}
                <br />
                {values.mobile}
                <br />
                {values.email}
              </p>
            </section>
            <section>
              <h3>Delivery</h3>
              <p>
                {deliveryLabels[values.delivery]}
                <br />
                {address}
              </p>
            </section>
            <section>
              <h3>Payment preference</h3>
              <p>
                {values.payment
                  ? paymentLabels[values.payment]
                  : "Not selected"}
                <br />
                No payment has been authorized or processed.
              </p>
            </section>
            <section>
              <h3>Items</h3>
              {items.map((item) => (
                <p key={item.lineId}>
                  {item.product.name} · {item.variant}
                  {item.color ? ` · ${item.color.name}` : ""} · Qty{" "}
                  {item.quantity} · {money.format(item.lineTotal)}
                </p>
              ))}
            </section>
          </div>
          <dl>
            <div>
              <dt>Current merchandise estimate</dt>
              <dd>{money.format(subtotal)}</dd>
            </div>
            <div>
              <dt>VAT</dt>
              <dd>Pending confirmation</dd>
            </div>
            <div>
              <dt>Shipping or delivery fee</dt>
              <dd>Pending confirmation</dd>
            </div>
            <div>
              <dt>Final payable amount</dt>
              <dd>
                Pending final VAT, delivery, availability, and payment
                review
              </dd>
            </div>
          </dl>
          {!onlineOrderingEnabled ? (
            <section
              aria-labelledby="checkout-contact-summary-title"
              className="checkout-contact-summary"
            >
              <h3 id="checkout-contact-summary-title">
                Order inquiry summary
              </h3>
              <pre>{contactSummary}</pre>
              <p>
                This summary contains cart and delivery-preference details
                only. It does not include your personal contact or address
                information.
              </p>
            </section>
          ) : null}
          <div>
            <button
              onClick={() => {
                setReviewed(false);
                formRef.current
                  ?.querySelector<HTMLElement>("input")
                  ?.focus();
              }}
              type="button"
            >
              Edit Checkout Details
            </button>
            {onlineOrderingEnabled ? (
              <button
                className="checkout-submit-order"
                disabled={submitting}
                onClick={submitOrder}
                type="button"
              >
                {submitting ? "Sending order…" : "Submit Order"}
              </button>
            ) : (
              <a
                className="checkout-submit-order"
                href={messengerUrl}
                onClick={() => {
                  void copyContactSummary();
                }}
                rel="noopener noreferrer"
                target="_blank"
              >
                Message us to complete your order
              </a>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}
