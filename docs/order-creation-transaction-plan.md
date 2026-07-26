# GadgetMoTo Secure Order-Creation Transaction Plan

## Status and scope

This document defines the proposed contract and trusted transaction for a future guest-order submission checkpoint. It is architecture and contract documentation only. No route handler, Server Action, database function, migration, order, reservation, payment attempt, or provider integration is implemented here.

The storefront and review-only checkout are complete. The seven commerce tables already exist, but they have no public policies or grants, and the current server catalog reader has no commerce-table write capability. Real submission must remain disabled until the schema gaps and business decisions in this document are separately approved and implemented.

## Approved launch defaults

The following launch rules are approved for the first production order workflow:

- Guest checkout remains available; customer accounts are not required.
- Customer mobile number is required.
- Customer email is optional. The current checkout and `orders.customer_email` still require it, so both the schema and interface must be updated in later controlled checkpoints before submission is enabled.
- Fulfillment supports delivery and store pickup.
- Store pickup uses the existing GadgetMoTo Cavite City branch after its reviewed `store_locations` record and inventory rows are available.
- Cash on delivery is disabled. Cash on store pickup remains a distinct, pickup-only method.
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

## Existing checkout and cart findings

### Checkout fields

The current `CheckoutForm` owns transient React state only and collects:

- Required full name
- Required Philippine mobile number
- Required email address in the current preview UI; the approved launch contract makes email optional and requires a later UI/schema change
- Fulfillment choice: nationwide delivery, same-day delivery, or Cavite City store pickup
- For delivery: street address, province, city or municipality, barangay, and four-digit postal code
- Payment choice: Maya online, Maya manual transfer, GCash, bank transfer, or cash on store pickup
- Optional customer notes, limited in the UI to 500 characters
- Separate required acknowledgements for the Privacy Policy, Terms and Conditions, and final availability/VAT/delivery/payment review

Cash on store pickup is disabled for delivery orders and is cleared if a customer changes from pickup to delivery. The existing validation requires all address fields for delivery, a nonblank payment choice, all three acknowledgements, a minimally nonblank name, a syntactically valid email, and a Philippine mobile number matching the current UI rule.

The form's current submit handler only validates and reveals an in-browser review panel. It does not call a route, Server Action, database, or payment provider. It does not create an order number or success state.

### Cart and persisted identifiers

The persisted cart key is `gadgetmoto:cart:v1`. Each stored line contains only:

- `productSlug`
- Exact current variant label
- Quantity
- A deterministic client line identifier derived from slug and variant

Names, brands, prices, SRPs, and totals are not persisted. After hydration, invalid products and variants are removed, duplicate line identifiers are merged, and quantities are clamped to integers from 1 through 99. Pre-hydration actions are replayed over sanitized stored state.

The current client `PrototypeProduct` exposes a slug and variant label but does not expose the database SKU, product UUID, or variant UUID. The database catalog row contains SKU and UUID values, but the normalized client model intentionally omits them.

### Current presentation-only calculations

Cart and checkout line totals are currently:

`currentPrice in whole pesos × quantity`

The merchandise subtotal is the sum of those line totals. These values are suitable only for current UI presentation. VAT, delivery fee, and final payable amount remain pending. Authoritative commerce calculations must use database `bigint` centavos and must not use browser numbers or floating-point arithmetic.

## Proposed request contract

The future server boundary should accept one versioned, size-limited request containing only the information needed to identify the customer's choices. A conceptual strict TypeScript shape is:

```ts
type CreateOrderRequestV1 = {
  contractVersion: 1;
  idempotencyKey: string;
  items: Array<{
    productSlug: string;
    variantName: string;
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

`productSlug` plus the exact variant label is the only identifier pair currently supported by the client model. The server must resolve that pair to exactly one active database product and variant. A later catalog-model checkpoint may replace `variantName` with an approved SKU or opaque variant identifier; the client must not invent or infer either value.

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
| `orders` | Server-generated public number and status; normalized customer name/mobile and optional email; mapped delivery and payment enums; authoritative subtotal; nullable approved VAT, delivery fee, and final total; trimmed notes or null; three server timestamps for accepted acknowledgements |
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

The schema has a reserved counter and generic movements but no explicit reservation record with:

- Order or order-item ownership
- Reserved quantity
- Reservation status
- Creation and expiry timestamps
- Release, conversion, or cancellation timestamp
- Idempotent release/conversion guard

Deriving active reservations only from generic movement rows would be fragile. The recommended launch design is a new reviewed `inventory_reservations` table, or an equivalently strong transactional structure, plus controlled functions for reserve, convert-to-sale, expire, and release. A new timestamped migration is required.

The meaning of `inventory_movements.quantity_delta` for reservation versus on-hand movements must also be documented and enforced. The current single delta column does not by itself identify which inventory balance changed.

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

The current schema has no order idempotency column or submission table. `public_order_number` uniqueness and payment-provider indexes do not prevent double order creation. A future migration should add either:

- A unique non-null `orders.idempotency_key_hash` plus a request fingerprint, or
- A dedicated private order-submission idempotency table with unique key hash, request fingerprint, order reference, status, and bounded retention.

The dedicated-table design is preferred because it can represent an in-progress claim and safely recover the original response. Retention requires privacy and operational approval.

## Minimal safe server response

A successful order-creation response may contain:

```ts
type CreateOrderResponseV1 = {
  success: true;
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
    | "processing";
  totals: {
    merchandiseSubtotalCentavos: string;
    deliveryFeeCentavos: string | null;
    vatAmountCentavos: string | null;
    finalTotalCentavos: string | null;
  };
  nextAction:
    | "awaiting_review"
    | "awaiting_payment_instructions"
    | "payment_initialization_pending"
    | "order_confirmed";
  redirectPath?: string;
};
```

Centavo values are serialized as digit strings to preserve exact `bigint` values. A redirect path must be an application-controlled relative path, never an untrusted provider URL.

The response must not include internal UUIDs unless separately required and approved, database credentials, raw database/provider errors, private staff data, exact inventory quantities, SQL messages, stack traces, provider secrets, or customer personal data beyond what is strictly required for the current confirmation screen.

## Sanitized error contract

Errors return a stable code, a generic customer-safe message, and an appropriate HTTP status without raw causes:

| Code | Meaning |
| --- | --- |
| `INVALID_CHECKOUT_REQUEST` | Contract, consent, field, or size validation failed |
| `EMPTY_CART` | No orderable item was supplied |
| `INVALID_QUANTITY` | A quantity is not a safe integer from 1 through 99 |
| `PRODUCT_NOT_AVAILABLE` | Product or variant is inactive, unpublished, missing, or unsupported |
| `PRODUCT_PRICE_CHANGED` | A future trusted quote/revision comparison requires customer re-review |
| `INSUFFICIENT_INVENTORY` | Locked authoritative inventory cannot satisfy the request |
| `INVENTORY_CONFIGURATION_MISSING` | Required location or inventory-level rows are absent |
| `INVALID_FULFILLMENT` | Fulfillment selection is unsupported or incompatible |
| `INVALID_ADDRESS` | Required delivery-address data is invalid |
| `PICKUP_LOCATION_UNAVAILABLE` | The approved pickup location cannot be resolved |
| `UNSUPPORTED_PAYMENT_METHOD` | Method is not enabled or is incompatible with fulfillment |
| `DUPLICATE_SUBMISSION` | An equivalent duplicate item/submission must be consolidated or returned |
| `IDEMPOTENCY_KEY_REUSED` | The same key was used with a different request |
| `ORDER_CREATION_FAILED` | A sanitized unexpected transaction failure occurred |

Raw PostgreSQL errors, constraint text, SQL, provider payloads, connection details, stack traces, and internal exception causes must never reach the browser. Logs must use a correlation identifier and stable code while minimizing customer information.

## Schema and capability gaps before implementation

Real order submission is blocked until these are reviewed:

1. A unique order-submission idempotency structure and retention rule.
2. A durable reservation/expiry structure and exact inventory movement semantics.
3. Verified store-location and inventory-level data.
4. A single-location allocation rule compatible with one fulfillment per order.
5. A least-privilege server write boundary for the complete atomic transaction.
6. Public order-number generation and collision handling.
7. Status-transition enforcement and staff/server authority.
8. Defense-in-depth duplicate order-item protection where appropriate.
9. Consent policy-version capture if legal review requires proof beyond timestamps.
10. A client-to-server approved variant identifier; the current compatibility contract uses slug plus variant label.

VAT, delivery, final-total, cancellation, refund, warranty, payment, and retention rules are business or legal decisions, not values to infer in code.

## Open business-decision matrix

| Decision | Current status | Recommended launch default | Schema change required | User approval required | Future checkpoint |
| --- | --- | --- | --- | --- | --- |
| Public order-number format | Unique text exists; generation undefined | High-entropy, non-sequential customer-safe code with collision retry | Possibly a generator function; existing unique index may suffice | Yes | Contract/schema-gap decisions |
| VAT-inclusive or VAT-exclusive prices | Unconfirmed | Do not label a basis or collect payment until approved | No for nullable fields; possibly constraints later | Yes, plus tax review | Contract/schema-gap decisions |
| VAT calculation and rounding | Rate and calculation unconfirmed | Keep VAT and final total null; no payable order | Future total-integrity migration after approval | Yes, plus tax review | Order-creation migration |
| Delivery-fee calculation | Unconfirmed | Keep fee and final total null pending review | Possibly rules/configuration tables later | Yes | Contract/schema-gap decisions |
| Delivery service area | “Nationwide” and conditional same-day are presentation only | Do not promise eligibility; server rejects unsupported addresses after rules exist | Possibly service-area configuration | Yes | Fulfillment rules |
| Pickup branch details | Existing GadgetMoTo Cavite City branch approved; no location record exists yet | Keep real pickup submission disabled until the reviewed active branch record exists | Data addition through controlled workflow; schema already exists | Approved; exact public details still require confirmation | Location/inventory readiness |
| Pickup instructions | Unconfirmed | Show pending confirmation only | No; `pickup_instructions` exists | Yes | Location/inventory readiness |
| Inventory allocation location | Cavite City branch approved; no location or inventory rows exist yet | Require that one branch to fulfill every item; no split allocation | Reservation structure and controlled location/inventory data | Launch default approved | Inventory design migration |
| Reservation duration | Unresolved | No expiring reservation until a duration is approved | Yes, reservation expiry fields/table | Yes | Inventory design migration |
| Payment deadline | Unresolved | No automated deadline or cancellation | Possibly payment/order deadline timestamp | Yes | Payment workflow plan |
| Failed-payment behavior | Unresolved | Mark payment failed only; do not cancel/release automatically | Possibly workflow timestamps; transition logic required | Yes | Failed-payment handling |
| Cancellation rules | Unresolved | No self-service cancellation promise; staff-controlled only after approval | Transition/audit support may be required | Yes, plus legal/business review | Cancellation workflow |
| Refund rules | Unresolved | Do not promise eligibility or timing | Payment records support statuses; refund workflow may need fields | Yes, plus legal/business review | Refund workflow |
| Warranty wording | Unresolved | Do not add warranty promises | No immediate commerce schema change | Yes, plus legal/business review | Policy approval |
| Preorder support | Disabled for launch | Reject preorders at launch | No launch change; future support requires a new design | Launch default approved | Future preorder design |
| Split fulfillment | Disabled for launch; one fulfillment per order | Require one location to fulfill the complete order | No launch change; future support requires schema changes | Launch default approved | Future fulfillment expansion |
| Customer email requirement | Optional for launch; current UI and `orders` schema still require it | Accept null when omitted and validate only supplied values | Yes, make `orders.customer_email` nullable | Launch default approved | Order-creation migration |
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
2. **Order-creation migration** — create only a new timestamped migration for approved idempotency, reservation, constraints, transition support, and least-privilege execution boundary. Do not edit deployed migrations.
3. **Static SQL review** — review complete SQL, security-definer/search-path behavior if used, grants, rollback characteristics, locks, constraints, and destructive operations. Stop on any public write path or privilege expansion.
4. **Linked dry run** — compare migration history and run only a non-destructive dry run after explicit authorization. Stop on any unexpected migration or SQL error.
5. **Migration deployment** — deploy only the reviewed pending migration through a manual checkpoint, then verify history, schema, RLS, privileges, and empty-state behavior.
6. **Server transaction implementation** — add the minimum server-only write client and transaction boundary with sanitized errors; keep checkout submission disabled.
7. **Transaction unit validation** — test contract parsing, normalization, totals, duplicate handling, status mapping, and rollback using isolated fixtures without hosted writes.
8. **Controlled local database test** — with separately supplied local/test configuration, verify success and every rollback path. Stop if partial writes, excess privileges, or raw errors appear.
9. **Checkout submission integration** — connect the existing form to the trusted boundary, add idempotency-key lifecycle, pending states, retry behavior, and explicit authoritative-total review.
10. **Inventory concurrency testing** — test simultaneous last-unit orders, deterministic locks, deadlock retry, expiry, release, cancellation, and idempotent conversion.
11. **Order confirmation UI** — display only the safe response, never internal identifiers or unverified payment success.
12. **Maya payment initialization** — add server-side provider initialization only after order/amount confirmation and credential-management approval.
13. **Maya webhook handling** — verify signatures, deduplicate provider events, minimize payloads, and apply trusted status transitions.
14. **Failed-payment and cancellation handling** — implement approved deadlines, reservation release, cancellation, and retry rules.
15. **Staff order-management tools** — add authenticated, active-role authorization and least-privilege order, fulfillment, payment, and inventory workflows.
16. **Production deployment verification** — configure secrets outside Git, validate pooler/runtime behavior, run smoke and security checks, and retain rollback capability.

Each checkpoint ends with lint/build or SQL validation appropriate to its scope, a diff and secret review, and a stop boundary before deployment or external side effects.

## Safety boundary for this plan

- No order route, Server Action, database function, or payment integration exists.
- No customer or order data is submitted or stored.
- No authoritative tax, fee, refund, warranty, cancellation, or retention policy is chosen.
- No credential, endpoint, project identifier, connection string, or environment value is included.
- No deployed migration is changed.
- No database object or record is changed.
