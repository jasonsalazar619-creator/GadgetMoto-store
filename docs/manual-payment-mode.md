# GadgetMoTo Manual Payment Mode

## Current payment state

- Automated payment-gateway processing is disabled by default.
- The server-only `PAYMENT_GATEWAY_ENABLED` flag enables gateway-facing checkout choices only when its value is exactly `1`.
- The flag is intentionally not public and must never use a `NEXT_PUBLIC_` prefix.
- No payment-gateway API client, checkout-session creator, redirect flow, capture call, or webhook confirmation exists in the current application.
- Customer order submission continues through the existing secured order endpoint when the server has order-database configuration and manual payment mode is available. `ONLINE_ORDERING_ENABLED=0` remains an explicit emergency disable, while `ONLINE_ORDERING_ENABLED=1` remains an explicit enable for controlled environments.
- A customer submission never marks an order or payment as paid.
- Manual order submission and automated payment-gateway processing are independent feature decisions.

## Manual payment workflow

1. The customer submits a validated guest order using an approved manual payment preference.
2. The order remains `pending_review` while VAT, delivery fees, availability, and the final payable amount remain unresolved.
3. A payment record is created as `instructions_pending`, without a provider identifier or automatic payment request.
4. GadgetMoTo supplies approved payment instructions separately; no account number, recipient, QR code, or transfer destination is stored in this repository.
5. An authenticated active administrator reviews the order and payment.
6. The administrator records the confirmed delivery fee, VAT rate, VAT amount, and received payment amount. The database calculates the final order total from the authoritative merchandise subtotal plus those confirmed components.
7. Paid approval is allowed only when the recorded payment amount matches that calculated final total.
8. Every administrator payment decision creates an append-only payment event and audit-log entry.

Customers have no payment-status mutation route. The administrator UI calls only the reviewed database function, which repeats authentication and active-administrator authorization inside the database. Direct browser access to private order and payment tables remains closed by RLS and revoked privileges.

## Database deployment

The forward-only migration `20260812113000_manual_payment_approval.sql` adds two narrowly scoped administrator functions:

- a limited manual-payment review queue that omits provider fields, internal notes, addresses, and payment-event payloads;
- an audited manual status transition limited to `paid` or `failed`.

The migration does not add a table, enum, payment method, public policy, seed record, or customer write path. It must be reviewed and deployed manually before the administrator payment queue can be used. No SQL is executed by the application checkpoint.

The deployed forward-only migration `20260812143000_pending_inventory_order_submission.sql` allows a new fulfillment to remain without an assigned store location only while its status is `pending_confirmation`. The linked dry run listed only this migration, deployment completed successfully, and local and remote migration histories now match. The non-blocking Docker catalog-cache warning did not prevent the remote migration.

The deployed forward-only migration `20260815115315_admin_payment_confirmation.sql` adds one narrowly scoped administrator function. It atomically records confirmed delivery and VAT components, calculates the final total, requires the recorded manual payment to match, transitions the order and payment to paid, and appends both payment-event and audit evidence. Authentication and active-administrator authorization are repeated inside the database. No public table privilege, policy, seed record, payment-provider behavior, or customer mutation path was added.

The administrator orders screen queries exactly ten summary records per page from PostgreSQL, loads one selected order's private details on demand, and updates numbered pagination through a protected no-store endpoint without reloading the page. Browser Back and Forward restore the page query, and stale page or detail requests are cancelled.

This permits a validated manual order to enter review when no inventory or store-location records have been configured, without claiming stock, creating a reservation, or confirming availability. Once inventory configuration exists for a requested variant, the existing availability and reservation checks remain authoritative.

The order endpoint validates canonical products, SKUs, active colors, quantities, and prices against PostgreSQL, recalculates merchandise totals in the transaction, and records delivery and customer details. Manual orders begin as `pending_review`; their payment records begin as `instructions_pending`. VAT, delivery fees, the final payable amount, inventory confirmation, and payment approval remain pending administrator review.

## Restoring automated payments later

Do not enable automated payments by changing the flag alone. First add and review a complete server-only provider integration, including authenticated order ownership, trusted price and amount validation, idempotent session creation, signed webhook verification, replay protection, sanitized errors, and server-confirmed payment capture. A browser redirect must never determine that payment succeeded.

After that work has been deployed and verified, set `PAYMENT_GATEWAY_ENABLED=1` in the hosting provider's encrypted server environment and redeploy. Leave secrets unprefixed so they cannot enter browser bundles. To return to manual mode, remove the flag or set it to any value other than `1` and redeploy.
