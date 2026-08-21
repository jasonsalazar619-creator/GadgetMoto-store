# GadgetMoTo Secure Order-Creation Transaction Plan

## Status and scope

This document defines the contract and trusted transaction for guest-order submission. The server-only configuration, lazy PostgreSQL client, strict request validator, safe contracts/errors, atomic transaction, and `POST /api/orders` Route Handler now exist. `ONLINE_ORDERING_ENABLED` is a server-only activation gate and is disabled by default. While disabled, checkout does not call the endpoint and the Route Handler returns a safe unavailable response before parsing a request or creating an order. The endpoint has not been called, `ORDER_DATABASE_URL` remains unset, and no order, reservation, payment attempt, or provider integration was created during implementation.

The storefront and delivery-only guest checkout are complete. Private commerce tables have no browser policies or grants. The deployed secure-order migration provides a separate non-login order-service role and server-only policies; the storefront catalog reader still has no commerce-table write capability. Operational submission remains unavailable until server configuration, controlled database validation, and inventory/location readiness are completed.

## Approved launch defaults

The following launch rules are approved for the first production order workflow:

- Guest checkout remains available; customer accounts are not required.
- Customer mobile number is required.
- Customer email is required by the checkout interface and server contract. The deployed nullable `orders.customer_email` column is retained for backward compatibility, but new storefront submissions cannot omit email.
- Checkout currently submits nationwide or same-day delivery only.
- Store pickup uses the approved GadgetMoTo branch address in Barangay Sabang, Dasmariñas. Pickup timing, instructions, and product availability remain pending confirmation; no placeholder schedule or stock is shown.
- Cash on delivery remains unavailable. Cash on store pickup is accepted only when the approved store-pickup fulfillment option is selected.
- Preorders are disabled.
- Split fulfillment is disabled; one location must be able to fulfill the complete order.
- Maya is the approved online payment provider, but live provider setup remains disabled until credentials and the provider workflow are separately completed.
- Financing messages remain informational only and do not create financing eligibility, quotes, or payment behavior.
- Client-submitted product data, prices, totals, availability, and payment state are never authoritative.
- Authoritative money is stored and calculated in integer centavos.
- When no approved automatic delivery fee exists, delivery fees are manually confirmed before payment.
- No separate VAT amount is displayed until an approved calculation and display rule exists.
- Public cancellation, refund, and warranty policies must not be inferred or promised.
- Product availability is server-authoritative.
- Order writes and staff operations are server-only. Browser and Data API roles receive no private-table write access.

## Explicitly unresolved launch inputs

These items remain unresolved and must not be invented during implementation:

- Automatic delivery-fee calculation
- Separate VAT calculation and display
- Public cancellation policy
- Public refund policy
- Public warranty policy
- Maya merchant credentials
- Production hosting secrets

Additional technical and operational decisions remain identified in the decision matrix below. Approval of the launch defaults does not silently settle retention, notification, reservation-duration, payment-deadline, or legal-policy details.

## Secure order schema migration status

The forward-only migration `20260726121534_secure_order_transaction_schema.sql` was manually deployed successfully. Version `20260726121534` matches locally and remotely, bringing the immutable deployed-migration count to seven. It did not alter the prior six migrations and contains no records, login credential, browser policy, tax calculation, delivery-fee calculation, payment-provider behavior, or customer data.

The deployed migration added:

- Required order email for new storefront submissions
- Hashed high-entropy order lookup tokens
- Private order-submission idempotency claims and request fingerprints
- Duplicate order-variant protection
- Required single-location fulfillment allocation
- Durable per-order-item inventory reservations with expiry and guarded terminal states
- Reservation-linked inventory movement constraints and idempotent movement types
- Hashed payment-attempt idempotency fields
- Final-total component integrity
- Database-enforced append-only behavior for inventory movements, payment events, and audit logs
- A non-login, non-bypass server order-service privilege role with narrowly scoped RLS policies and grants

The migration deliberately reuses the existing unique public order-number storage and payment-provider event uniqueness. Public order-number format, VAT treatment, delivery-fee rules, and live provider configuration remain outside the migration. The service now applies the separately approved 30-minute reservation duration without changing the deployed migration.

## Server-only order-service implementation status

The implementation now includes:

- `src/lib/orders/server/config.ts` for lazy `ORDER_DATABASE_URL` access and presence-only diagnostics
- `src/lib/orders/server/postgres-client.ts` for a separate lazy Postgres.js client
- `src/lib/orders/server/types.ts` for strict request, response, enum, and trusted policy types
- `src/lib/orders/server/order-error.ts` for stable sanitized errors
- `src/lib/orders/server/validation.ts` for strict normalization and validation
- `src/lib/orders/server/create-order.ts` for the single atomic transaction
- `src/app/api/orders/route.ts` for the size-limited, JSON-only, sanitized `POST` boundary

The request uses product slug plus canonical SKU because variant display names are not authoritative identifiers. The shared browser `PrototypeProduct` now exposes the exact catalog SKU, while persisted cart state continues to store slug, display variant, and quantity. Checkout resolves the current product and canonical SKU by slug without persisting a complete product object.

Canonical SKU values are opaque identifiers. Numeric SKU segments are never
parsed as physical RAM, extended RAM, storage, price, or another specification.
The Infinix Note 60 Pro 5G and TECNO Camon 50 keep their complete existing SKUs
while the catalog separately presents 8GB physical RAM, 8GB extended RAM, and
256GB storage.

The service creates every new inventory reservation with `current_timestamp + interval '30 minutes'` inside the same trusted transaction as the order and inventory writes. Idempotent replay returns the existing order and does not create or extend a reservation. Automated expiry release, conversion to sale, failed-payment release, and cancellation release remain future lifecycle work. The parameterized order insert derives `GM-` plus 32 uppercase hexadecimal characters from the SHA-256 idempotency-key hash, persists it under the deployed unique index, and returns the complete stored value. A domain-separated high-entropy confirmation token is derived from the UUID-v4 submission key; only the confirmation-token hash is stored.

Only the server Route Handler imports `createOrder()`. No page, Client Component, provider, or Server Action imports server-order code. Checkout can post the approved contract only after the server-side online-order gate is deliberately enabled. Under the default disabled state it instead provides a deliberate Messenger handoff with a non-sensitive cart summary. The endpoint has not been called. `ORDER_DATABASE_URL` remains unset, no database test occurred, no database client was instantiated, and no connection, query, order, reservation, movement, audit row, or payment attempt occurred.

## Existing checkout and cart findings

### Checkout fields

The current `CheckoutForm` owns transient React state only and collects:

- Required full name
- Required Philippine mobile number
- Required email address in both the checkout UI and server request contract; the existing nullable database column remains backward compatible
- Fulfillment choice: nationwide delivery or same-day delivery
- Required delivery address: street address, province, city or municipality, barangay, and four-digit postal code
- Payment preference: Maya online, Maya manual transfer, GCash, or bank transfer
- Optional customer notes, limited in the UI to 500 characters
- Separate required acknowledgements for the Privacy Policy, Terms and Conditions, and final availability/VAT/delivery/payment review

Store pickup is enabled for the single approved Barangay Sabang, Dasmariñas branch. The checkout selector applies Delivery or Store Pickup to every cart line, so fulfillment can be changed during checkout. Delivery requests require all address fields, while pickup requests use the fixed reviewed location slug and do not submit a customer delivery address. Validation requires a nonblank compatible payment choice, all three acknowledgements, a minimally nonblank name, a required syntactically valid email, and a Philippine mobile number matching the current UI rule.

The form first validates and reveals an in-browser review panel. When live ordering is enabled, its final submit action resolves each current cart slug through `CatalogProvider`, sends only product slug, canonical SKU, quantity, approved customer/fulfillment/payment fields, notes, and consent booleans, and calls `POST /api/orders`. It prevents double submission, preserves one UUID-v4 key across retries and refreshes for the same cart, regenerates the key when the cart changes, keeps the cart after failure, and clears it only after a confirmed safe success response. While disabled, no idempotency key is prepared, no endpoint call occurs, the cart is preserved, and the customer receives a Messenger contact action instead. The endpoint has not been called in this checkpoint.

### Cart and persisted identifiers

The persisted cart key is `gadgetmoto:cart:v1`. Each stored line contains only:

- `productSlug`
- Exact current variant label
- Quantity
- A deterministic client line identifier derived from slug and variant

Names, brands, prices, SRPs, and totals are not persisted. After hydration, invalid products and variants are removed, duplicate line identifiers are merged, and quantities are clamped to integers from 1 through 99. Pre-hydration actions are replayed over sanitized stored state.

The current client `PrototypeProduct` exposes a slug, variant label, and canonical SKU. Database product and variant UUIDs remain server-only and are intentionally omitted from the normalized client model.

### Current presentation-only calculations

Cart and checkout line totals are currently:

`currentPrice in whole pesos × quantity`

The merchandise subtotal is the sum of those line totals. These values are suitable only for current UI presentation. VAT, delivery fee, and final payable amount remain pending. Authoritative commerce calculations must use database `bigint` centavos and must not use browser numbers or floating-point arithmetic.

## Proposed request contract

The server boundary accepts one versioned, size-limited request containing only the information needed to identify the customer's choices. The underlying contract retains the future pickup shape, but the current validator rejects `store_pickup` and `cash_on_pickup` until an approved active location exists. A conceptual strict TypeScript shape is:

```ts
type CreateOrderRequestV1 = {
  contractVersion: 1;
  idempotencyKey: string;
  items: Array<{
    productSlug: string;
    sku: string;
    quantity: number;
  }>;
  customer: {
    fullName: string;
    mobile: string;
    email?: string;
  };
  fulfillment:
    | {
        method: "nationwide_delivery" | "same_day_delivery";
        address: {
          streetAddress: string;
          province: string;
          cityMunicipality: string;
          barangay: string;
          postalCode: string;
        };
      }
    | {
        method: "store_pickup";
        pickupLocationSlug?: string;
      };
  paymentMethod:
    | "maya_online"
    | "maya_manual"
    | "gcash"
    | "bank_transfer"
    | "cash_on_pickup";
  customerNotes?: string;
  consents: {
    privacyAccepted: true;
    termsAccepted: true;
    finalReviewAccepted: true;
  };
};
```

The service contract uses `productSlug`, canonical SKU, and the optional database color ID. It resolves that request to exactly one active product and variant, then requires an available `product_variant_color_options` relationship whenever the product has colors. The shared catalog supplies identifiers to checkout without allowing the browser to invent prices or totals. `POST /api/orders` remains the sole server-order consumer.

`pickupLocationSlug` must not become client-controlled arbitrary location selection. It may be enabled only after the server supplies a reviewed list of active pickup locations. With one approved branch, the server may resolve the single active location instead of accepting a client identifier.

The three consent timestamps are generated by the trusted server when it accepts the request. Browser timestamps are not authoritative.

### Data the client must not submit as authority

The request must not treat any of these as authoritative:

- Product or brand name
- Unit price or SRP
- Discount or savings amount
- Line total
- Merchandise subtotal
- VAT rate or amount
- Delivery fee
- Final total
- Inventory availability or quantity
- Product, payment, or fulfillment status
- Payment success or provider status
- Public order number
- Internal database UUIDs not deliberately exposed by the approved contract

No card number, CVV, password, PIN, banking credential, provider secret, or payment access token may enter this request.

## Request validation and normalization

Before database work, the server boundary must:

1. Require the exact supported contract version and reject unknown fields where practical.
2. Enforce request, item-count, string-length, and note-length limits.
3. Require a high-entropy idempotency key in the approved format.
4. Require a nonempty item array.
5. Require safe integer quantities from 1 through 99.
6. Trim customer and address fields and reject blank results.
7. Require and normalize the approved mobile field; validate email only when supplied.
8. Require an address only for delivery and reject address data as authoritative fulfillment proof for pickup.
9. Require all three acknowledgements.
10. Accept only payment methods supported by the current checkout.
11. Enforce cash-on-pickup compatibility with store pickup.
12. Reject unexpected credential-like payment fields.

Normalizing a field does not make it trusted. Product, inventory, pricing, fulfillment eligibility, and payment compatibility still require authoritative database verification.

## Commerce-table write mapping

The future transaction must populate existing commerce fields as follows:

| Table | Trusted creation data |
| --- | --- |
| `orders` | Server-generated public number and status; normalized customer name/mobile and required email for new storefront submissions; mapped delivery and payment enums; authoritative subtotal; nullable approved VAT, delivery fee, and final total; trimmed notes or null; three server timestamps for accepted acknowledgements |
| `order_addresses` | One normalized address snapshot for nationwide or same-day delivery; no row for store pickup |
| `order_items` | Authoritative product/variant references plus product, brand, variant, SKU, unit-price, quantity, and line-total snapshots |
| `order_fulfillments` | Exactly one row with `pending_confirmation`; approved inventory/pickup location when known; no invented courier, tracking, pickup schedule, or confirmation notes |
| `payments` | An initial attempt only when appropriate; order method, existing payment status, and authoritative amount when final payable amount is known |
| `inventory_levels` | Locked, conditionally updated reserved/on-hand balances through the approved inventory workflow |
| `inventory_movements` | Append-only reservation, release, or sale evidence referencing the order through the approved convention |

At initial creation, `internal_notes`, reviewer fields, review/confirmation/cancellation timestamps, courier data, tracking data, staff verification fields, and provider identifiers remain null unless a separately authorized trusted operation supplies them. Customer-submitted empty notes must normalize to null because the deployed constraint rejects blank note strings.

## Trusted atomic PostgreSQL transaction

The future write boundary should use a dedicated least-privilege server capability that can perform only the reviewed order workflow. It must not reuse the catalog reader as a broadly privileged writer and must not grant direct commerce-table access to browsers, `anon`, or ordinary authenticated users.

Before executing the numbered workflow, the transaction must atomically acquire or insert the idempotency guard and compare the request fingerprint. A completed matching key returns the original safe result; the same key with a different request is rejected.

Within one PostgreSQL transaction:

1. Validate the request structure again at the trusted boundary.
2. Normalize customer fields according to approved rules.
3. Validate fulfillment requirements.
4. Validate payment-method eligibility.
5. Reject an empty cart.
6. Reject duplicate product/variant entries or consolidate exact duplicates before pricing and locking.
7. Load the authoritative product, brand, and variant rows using the approved identifiers.
8. Choose the approved single inventory location and lock required `inventory_levels` rows in deterministic variant/location order.
9. Confirm every brand, product, and variant is active, published, supported, and purchasable.
10. Confirm every requested quantity is a safe integer from 1 through 99.
11. Confirm every required inventory row exists and that `quantity_on_hand - quantity_reserved` is sufficient.
12. Read authoritative `current_price_centavos` values from `product_variants`.
13. Create purchase-time product, brand, variant, and SKU snapshots from those authoritative rows.
14. Calculate each line total using `bigint` centavos and checked multiplication.
15. Calculate the merchandise subtotal from the authoritative line totals and verify the inserted item sum matches the order subtotal.
16. Apply an approved delivery-fee rule only when one exists; otherwise keep the order in review and leave the fee null.
17. Apply an approved VAT rule only when one exists; otherwise keep the order in review and leave VAT fields null.
18. Calculate a final total only when every required component is known.
19. Generate a collision-resistant public order number through the approved server/database strategy.
20. Insert one `orders` row, initially `pending_review` when any payable component remains unresolved.
21. Insert exactly one `order_addresses` snapshot for delivery and none for pickup.
22. Insert all `order_items` snapshots with non-null source product and variant references at creation time.
23. Insert exactly one `order_fulfillments` row with `pending_confirmation` and the approved location where applicable.
24. Insert an initial `payments` row only when the method workflow and payable amount are defined. Do not call Maya inside this transaction.
25. Create the approved inventory reservation records, update `quantity_reserved`, and append the corresponding inventory movements.
26. Commit every write together.
27. Roll back the idempotency guard, order, address, items, fulfillment, payment attempt, reservation, inventory changes, and movements when any required step fails.

No partial order may survive a failed transaction. Locks must be acquired in a deterministic order, held only for the transaction, and released automatically on commit or rollback.

If VAT or delivery rules are unresolved, a future approved workflow may create a `pending_review` order with nullable VAT, delivery fee, and final total. Such an order is not payable, must not initialize Maya, and must be described to the customer as awaiting review rather than confirmed.

## Pricing and money authority

- Database catalog prices are authoritative; browser-displayed prices are not trusted.
- Product, brand, variant, SKU, unit price, and line total are snapshotted at purchase time.
- All persisted amounts use integer centavos.
- PostgreSQL `bigint` values must be handled as exact integers. Application code should use validated decimal strings or `bigint`, never floating-point arithmetic, for authoritative totals.
- `order_items.line_total_centavos` must equal unit price multiplied by quantity.
- `orders.merchandise_subtotal_centavos` must equal the sum of all inserted item line totals.
- VAT rate and VAT amount remain null until the business and tax rules are explicitly approved.
- Delivery fee remains null until an approved calculation exists.
- Final total remains null until all required components are confirmed.
- A null total must never be presented as a confirmed payable amount.
- The current whole-peso UI calculations may remain presentation-only until real submission is implemented.

If an authoritative price differs from the catalog value last shown to the customer, the response must clearly return the new confirmed values before any payment initialization. A future server-issued quote or catalog-revision token may support an explicit `PRODUCT_PRICE_CHANGED` rejection without trusting client prices.

## Inventory behavior and schema gaps

### Existing capability

`inventory_levels` supports:

- One row per variant and location
- Nonnegative `quantity_on_hand`
- Nonnegative `quantity_reserved`
- A constraint preventing reserved quantity from exceeding on-hand quantity
- Derived availability as on-hand minus reserved

`inventory_movements` is append-oriented and supports reservation, reservation release, sale, return, and adjustment event types. Its rows do not automatically mutate inventory levels.

### Required launch behavior

- Lock every required inventory row with `FOR UPDATE` or an equivalent atomic conditional update.
- Lock in deterministic order to reduce deadlock risk.
- Reject missing inventory rows as configuration errors, not as zero-value guesses.
- Reject out-of-stock requests without creating any order row.
- Reserve stock atomically with order creation once the reservation model is approved.
- For a verified sale, decrement on-hand and release the matching reserved quantity in the same trusted workflow.
- For failed payment, expiry, or cancellation, release only the still-active reservation and append a release movement.
- Pickup and delivery orders use the same concurrency controls; their reservation duration or decrement timing may differ only through approved rules.
- Concurrent attempts cannot both consume the same available quantity.
- Preorders are rejected at launch unless a future schema and business checkpoint explicitly supports them.
- Split inventory allocation and split fulfillment are not supported by the existing one-fulfillment-per-order model.

### Blocking gaps

The current database has no store-location or inventory-level records. Real checkout therefore cannot choose a fulfillment location or confirm stock.

The deployed `inventory_reservations` table now owns each reservation by order item, variant, and location, with quantity, status, expiry, and resolution timestamps. Reservation-linked inventory movements have constrained types and directions. The creation service locks inventory rows in deterministic variant order, increments reserved quantity, creates the reservation, and appends the reservation movement inside the same transaction.

Reservation duration is approved at exactly 30 minutes. The service establishes expiry from database-authoritative transaction time inside each new-order transaction. Automated expiry, conversion to sale, failed-payment release, cancellation release, and their scheduling/authorization boundaries remain future work.

## Existing statuses and recommended transition model

### Existing enum values

Order status supports only:

- `draft`
- `pending_review`
- `confirmed`
- `awaiting_payment`
- `paid`
- `processing`
- `ready_for_pickup`
- `shipped`
- `completed`
- `cancelled`

Payment status supports:

- `pending`
- `instructions_pending`
- `awaiting_payment`
- `processing`
- `paid`
- `failed`
- `cancelled`
- `refunded`
- `partially_refunded`

Fulfillment status supports:

- `pending_confirmation`
- `confirmed`
- `preparing`
- `ready_for_pickup`
- `dispatched`
- `delivered`
- `completed`
- `cancelled`

### Recommended launch mapping

The recommended order path, subject to approval, is:

`pending_review → confirmed → awaiting_payment → paid → processing → ready_for_pickup or shipped → completed`

The fulfillment path is:

`pending_confirmation → confirmed → preparing → ready_for_pickup or dispatched → delivered when applicable → completed`

The payment path is:

`pending or instructions_pending → awaiting_payment → processing when applicable → paid`

Cancellation branches to the existing `cancelled` value and must release active inventory reservations. Invalid backward transitions must be rejected by trusted server/staff workflows.

Conceptual statuses unsupported by the order enum must not be inserted into `orders`:

- “Pending” maps to `pending_review`, not a new `pending` order value.
- “Payment processing” belongs to `payments.processing`; the order remains `awaiting_payment`.
- “Preparing” belongs to `order_fulfillments.preparing`; the order uses `processing`.
- “Delivered” belongs to `order_fulfillments.delivered`; the order becomes `completed` only through the approved completion rule.
- “Payment failed” belongs to `payments.failed`; the order remains awaiting payment or becomes cancelled according to an approved rule.
- “Refunded” and “partially refunded” belong to payment status. The current order enum has no refunded value.

Automatic transition enforcement is not present in the deployed schema. A future migration or tightly controlled server transition module is required, and the exact launch transition rules require approval.

## Payment-security boundary

Order creation and payment confirmation are separate trusted operations.

- The browser cannot mark an order or payment as paid.
- A provider redirect is not proof of payment.
- Only a server-verified provider response or a valid signed webhook may confirm payment.
- A payment-attempt row may be created before provider initialization when the method and amount are known.
- Maya initialization must occur after the order transaction commits and through a dedicated server boundary.
- Provider checkout, payment, reference, and event identifiers must use their existing unique constraints.
- Payment events are append-only.
- Webhook signature verification happens before any state mutation.
- Webhook replay is handled by the unique provider event identifier and an atomic idempotent handler.
- Stored provider payloads are minimized and redacted.
- No card number, CVV, PIN, password, banking credential, provider secret, or unnecessary raw payload may enter application tables or logs.
- Browser redirects may display only a pending state until trusted verification completes.

Maya API integration, provider credentials, webhook endpoints, and payment-method decisions remain outside this checkpoint.

## Idempotency and duplicate protection

The browser should generate a cryptographically strong, high-entropy idempotency key for each intentional checkout submission and reuse it for retries caused by double-clicks, refreshes, network failures, or timeouts.

The trusted server must:

1. Validate the key format and length.
2. Hash the key before persistence.
3. Associate the unique key hash with one request fingerprint and one order.
4. Atomically claim the key before order inserts.
5. Return the original minimal safe result for an identical accepted retry.
6. Reject reuse of the same key with a different request fingerprint.
7. Never create a second order for the same accepted key.
8. Keep payment-provider event idempotency separate through `payment_events.external_event_id`.

The deployed private `order_submissions` table stores a unique SHA-256 key hash, normalized request fingerprint, and completed order reference. The service atomically inserts the claim, relies on the database unique constraint for races, locks an existing claim on retry, returns the same safe result for a matching completed request, and rejects mismatched reuse. The UUID-v4 key itself is never persisted. Retention remains a privacy and operational decision.

## Minimal safe server response

A successful order-creation response may contain:

```ts
type CreateOrderResponseV1 = {
  success: true;
  wasReplay: boolean;
  publicOrderNumber: string;
  orderStatus:
    | "pending_review"
    | "confirmed"
    | "awaiting_payment"
    | "paid"
    | "processing"
    | "ready_for_pickup"
    | "shipped"
    | "completed"
    | "cancelled";
  paymentStatus:
    | "not_created"
    | "pending"
    | "instructions_pending"
    | "awaiting_payment"
    | "processing"
    | "paid"
    | "failed"
    | "cancelled"
    | "refunded"
    | "partially_refunded";
  fulfillmentMethod:
    | "nationwide_delivery"
    | "same_day_delivery"
    | "store_pickup";
  confirmedSubtotalCentavos: string;
  confirmedDeliveryFeeCentavos: string | null;
  confirmedVatCentavos: string | null;
  confirmedFinalTotalCentavos: string | null;
  nextAction:
    | "awaiting_review"
    | "awaiting_payment_instructions"
    | "payment_initialization_pending"
    | "order_confirmed";
  confirmationToken: string;
};
```

`wasReplay` is `false` for a newly inserted order and `true` when the same accepted request is returned for an idempotent replay. Centavo values are serialized as digit strings to preserve exact `bigint` values. The confirmation token is returned to the trusted submission consumer; its SHA-256 hash, never the plaintext value, is stored with the order.

The response must not include internal UUIDs unless separately required and approved, database credentials, raw database/provider errors, private staff data, exact inventory quantities, SQL messages, stack traces, provider secrets, or customer personal data beyond what is strictly required for the current confirmation screen.

## Sanitized error contract

Errors return a stable code, a generic customer-safe message, and an appropriate HTTP status without raw causes:

| Code | Meaning |
| --- | --- |
| `ORDER_DATABASE_NOT_CONFIGURED` | The server-only order database configuration is absent |
| `INVALID_CHECKOUT_REQUEST` | Contract, consent, field, or size validation failed |
| `EMPTY_CART` | No orderable item was supplied |
| `INVALID_IDEMPOTENCY_KEY` | The submission key is not a UUID-v4 value |
| `INVALID_QUANTITY` | A quantity is not a safe integer from 1 through 99 |
| `DUPLICATE_CART_ITEM` | The same product/SKU pair appears more than once |
| `PRODUCT_NOT_AVAILABLE` | Product or variant is inactive, unpublished, missing, or unsupported |
| `PRODUCT_PRICE_CHANGED` | A future trusted quote/revision comparison requires customer re-review |
| `INSUFFICIENT_INVENTORY` | Locked authoritative inventory cannot satisfy the request |
| `INVALID_FULFILLMENT` | Fulfillment selection is unsupported or incompatible |
| `INVALID_ADDRESS` | Required delivery-address data is invalid |
| `INVALID_PICKUP_LOCATION` | The approved pickup location cannot be resolved |
| `UNSUPPORTED_PAYMENT_METHOD` | Method is not enabled or is incompatible with fulfillment |
| `DUPLICATE_SUBMISSION` | The same key was used with a different normalized request |
| `ORDER_CREATION_FAILED` | A sanitized unexpected transaction failure occurred |

Raw PostgreSQL errors, constraint text, SQL, provider payloads, connection details, stack traces, and internal exception causes must never reach the browser. Logs must use a correlation identifier and stable code while minimizing customer information.

## Remaining activation gaps

The route and checkout integration are implemented but remain operationally blocked until these are reviewed:

1. Reservation expiry/release lifecycle operations.
2. Verified store-location and inventory-level data.
3. Controlled provisioning of a login that inherits only `gadgetmoto_order_service`, plus `ORDER_DATABASE_URL` outside Git.
4. Controlled database tests for success, rollback, replay, duplicate submission, and last-unit concurrency.
5. Public review of the implemented high-entropy `GM-` order-number presentation.
6. Status-transition enforcement and staff/server authority.
7. Consent policy-version capture if legal review requires proof beyond timestamps.
8. Rate limiting and abuse controls.
9. Safe order-confirmation lookup using the hashed confirmation token.

VAT, delivery, final-total, cancellation, refund, warranty, payment, and retention rules are business or legal decisions, not values to infer in code.

## Open business-decision matrix

| Decision | Current status | Recommended launch default | Schema change required | User approval required | Future checkpoint |
| --- | --- | --- | --- | --- | --- |
| Public order-number format | The parameterized order insert derives `GM-` plus 128 bits of the idempotency-key hash and returns the complete persisted value; the deployed unique index is authoritative | Retain the high-entropy non-sequential value unless presentation review changes it | No current schema change | Presentation approval remains | Controlled database testing |
| VAT-inclusive or VAT-exclusive prices | Unconfirmed | Do not label a basis or collect payment until approved | No for nullable fields; possibly constraints later | Yes, plus tax review | Contract/schema-gap decisions |
| VAT calculation and rounding | Rate and calculation unconfirmed | Keep VAT and final total null; no payable order | Future total-integrity migration after approval | Yes, plus tax review | Order-creation migration |
| Delivery-fee calculation | Unconfirmed | Keep fee and final total null pending review | Possibly rules/configuration tables later | Yes | Contract/schema-gap decisions |
| Delivery service area | “Nationwide” and conditional same-day are presentation only | Do not promise eligibility; server rejects unsupported addresses after rules exist | Possibly service-area configuration | Yes | Fulfillment rules |
| Pickup branch details | Approved GadgetMoTo address in Barangay Sabang, Dasmariñas | Use the fixed reviewed location slug and revalidate the active database record in the order transaction | Forward-only location-data migration; schema already exists | Address approved; schedule and instructions remain unconfirmed | Location/inventory readiness |
| Pickup instructions | Unconfirmed | Show pending confirmation only | No; `pickup_instructions` exists | Yes | Location/inventory readiness |
| Inventory allocation location | Cavite City branch approved; reservation schema exists but no location or inventory rows exist yet | Require one active location to fulfill every item; no split allocation | Controlled location/inventory data only | Launch default approved | Location/inventory readiness |
| Reservation duration | Approved at exactly 30 minutes and implemented from transaction time for newly created orders | Do not extend the original expiry during idempotent replay; add separately reviewed release jobs later | No additional schema change for duration | Approved | Controlled database testing |
| Payment deadline | Unresolved | No automated deadline or cancellation | Possibly payment/order deadline timestamp | Yes | Payment workflow plan |
| Failed-payment behavior | Unresolved | Mark payment failed only; do not cancel/release automatically | Possibly workflow timestamps; transition logic required | Yes | Failed-payment handling |
| Cancellation rules | Unresolved | No self-service cancellation promise; staff-controlled only after approval | Transition/audit support may be required | Yes, plus legal/business review | Cancellation workflow |
| Refund rules | Unresolved | Do not promise eligibility or timing | Payment records support statuses; refund workflow may need fields | Yes, plus legal/business review | Refund workflow |
| Warranty wording | Unresolved | Do not add warranty promises | No immediate commerce schema change | Yes, plus legal/business review | Policy approval |
| Preorder support | Disabled for launch | Reject preorders at launch | No launch change; future support requires a new design | Launch default approved | Future preorder design |
| Split fulfillment | Disabled for launch; one fulfillment per order | Require one location to fulfill the complete order | No launch change; future support requires schema changes | Launch default approved | Future fulfillment expansion |
| Customer email requirement | Nullable in the deployed schema for backward compatibility; required by the current server contract and checkout UI | Reject omitted, blank, or invalid email for new storefront orders | No further schema change | Launch behavior implemented | Checkout submission integration |
| Mobile-number validation | Required for launch; current UI accepts `09…` and `639…` forms | Revalidate the same rule server-side until a canonical format is approved | Optional database constraint after format approval | Requirement approved; canonical format still requires approval | Contract validation |
| Proof-of-payment support | Deferred; optional path exists in `payments` | Disabled at launch until secure upload/review is designed | Storage policies and workflow migration likely | Yes | Manual payment workflow |
| Maya payment methods | Maya approved as online provider; live products and credentials unresolved | No live initialization until official provider behavior and credentials are approved | Provider fields exist; configuration/integration still required | Provider approved; merchant setup still required | Maya initialization |
| Order-notification provider | None | No automated email/SMS promise | Provider/outbox design may require schema | Yes | Notification architecture |
| Staff roles and assignments | Enum exists; no staff records | No staff access until least-privilege role matrix is approved | RLS/grant migration and staff provisioning | Yes | Staff access |
| Audit-log scope | Table exists; automation absent | Audit privileged order/payment/inventory transitions without unnecessary PII | Trigger/service workflow may be required | Yes | Audit implementation |
| Personal-data retention | Unresolved | No invented retention period; minimize access and logs | Retention metadata/jobs may be required | Yes, plus legal review | Privacy/retention plan |
| Abandoned-order retention | Unresolved | Do not auto-delete or retain indefinitely without a rule | Idempotency/order expiry fields and cleanup job likely | Yes, plus legal review | Privacy/retention plan |
| Consent policy-version capture | Only consent timestamps exist | Keep submission disabled until legal review decides whether versions are required | Yes if policy/version identifiers are required | Yes, plus legal review | Contract/schema-gap decisions |

Decision rows in this matrix: **26**. Approved launch defaults are marked explicitly; every remaining unresolved or partially resolved row retains its approval requirement.

## Future controlled checkpoints

1. **Order contract and schema-gap decisions** — approve identifier, consent, idempotency, order-number, total, location, and status rules. Stop if any legal, tax, inventory, or payment prerequisite remains undefined.
2. **Order-creation migration — complete** — the new timestamped idempotency, reservation, constraint, and least-privilege migration was added without editing prior migrations.
3. **Static SQL review — complete** — SQL, grants, rollback risks, constraints, and public-access boundaries passed review.
4. **Linked dry run — not rerun here** — deployment is reported successful and local/remote version `20260726121534` matches; no Supabase command ran during service implementation.
5. **Migration deployment — complete** — migration history, schema, RLS, privileges, and empty-state behavior were manually verified.
6. **Server transaction implementation — code complete, uncalled** — the minimum server-only client and transaction boundary exist with sanitized errors; no configured request has invoked them.
7. **Transaction unit validation** — test contract parsing, normalization, totals, duplicate handling, status mapping, and rollback using isolated fixtures without hosted writes.
8. **Controlled local database test** — with separately supplied local/test configuration, verify success and every rollback path. Stop if partial writes, excess privileges, or raw errors appear.
9. **Checkout submission integration — code complete, safely gated, endpoint uncalled** — the delivery-only form, trusted Route Handler, idempotency lifecycle, loading/error/success states, contact fallback, and authoritative-money boundary are implemented. Live submission remains disabled by default.
10. **Inventory concurrency testing** — test simultaneous last-unit orders, deterministic locks, deadlock retry, expiry, release, cancellation, and idempotent conversion.
11. **Order confirmation UI** — display only the safe response, never internal identifiers or unverified payment success.
12. **Maya payment initialization** — add server-side provider initialization only after order/amount confirmation and credential-management approval.
13. **Maya webhook handling** — verify signatures, deduplicate provider events, minimize payloads, and apply trusted status transitions.
14. **Failed-payment and cancellation handling** — implement approved deadlines, reservation release, cancellation, and retry rules.
15. **Staff order-management tools** — add authenticated, active-role authorization and least-privilege order, fulfillment, payment, and inventory workflows.
16. **Production deployment verification** — configure secrets outside Git, validate pooler/runtime behavior, run smoke and security checks, and retain rollback capability.

Each checkpoint ends with lint/build or SQL validation appropriate to its scope, a diff and secret review, and a stop boundary before deployment or external side effects.

## Safety boundary for this plan

- `POST /api/orders` exists and is the only consumer of the server-only TypeScript service; it is protected by the default-disabled online-order gate, remains uncalled, and has no payment integration.
- No customer or order data is submitted or stored.
- No authoritative tax, fee, refund, warranty, cancellation, or retention policy is chosen.
- No credential, endpoint, project identifier, connection string, or environment value is included.
- No deployed migration is changed.
- No database object or record is changed.
