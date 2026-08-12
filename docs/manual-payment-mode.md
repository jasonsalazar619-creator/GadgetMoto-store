# GadgetMoTo Manual Payment Mode

## Current payment state

- Automated payment-gateway processing is disabled by default.
- The server-only `PAYMENT_GATEWAY_ENABLED` flag enables gateway-facing checkout choices only when its value is exactly `1`.
- The flag is intentionally not public and must never use a `NEXT_PUBLIC_` prefix.
- No payment-gateway API client, checkout-session creator, redirect flow, capture call, or webhook confirmation exists in the current application.
- Customer order submission continues through the existing secured order endpoint when `ONLINE_ORDERING_ENABLED` is exactly `1`.
- A customer submission never marks an order or payment as paid.

## Manual payment workflow

1. The customer submits a validated guest order using an approved manual payment preference.
2. The order remains `pending_review` while VAT, delivery fees, availability, and the final payable amount remain unresolved.
3. A payment record is created as `instructions_pending`, without a provider identifier or automatic payment request.
4. GadgetMoTo supplies approved payment instructions separately; no account number, recipient, QR code, or transfer destination is stored in this repository.
5. An authenticated active administrator reviews the order and payment.
6. Paid approval is allowed only after the trusted final order total and recorded payment amount both exist and match.
7. Every administrator payment decision creates an append-only payment event and audit-log entry.

Customers have no payment-status mutation route. The administrator UI calls only the reviewed database function, which repeats authentication and active-administrator authorization inside the database. Direct browser access to private order and payment tables remains closed by RLS and revoked privileges.

## Database deployment

The forward-only migration `20260812113000_manual_payment_approval.sql` adds two narrowly scoped administrator functions:

- a limited manual-payment review queue that omits provider fields, internal notes, addresses, and payment-event payloads;
- an audited manual status transition limited to `paid` or `failed`.

The migration does not add a table, enum, payment method, public policy, seed record, or customer write path. It must be reviewed and deployed manually before the administrator payment queue can be used. No SQL is executed by the application checkpoint.

## Restoring automated payments later

Do not enable automated payments by changing the flag alone. First add and review a complete server-only provider integration, including authenticated order ownership, trusted price and amount validation, idempotent session creation, signed webhook verification, replay protection, sanitized errors, and server-confirmed payment capture. A browser redirect must never determine that payment succeeded.

After that work has been deployed and verified, set `PAYMENT_GATEWAY_ENABLED=1` in the hosting provider's encrypted server environment and redeploy. Leave secrets unprefixed so they cannot enter browser bundles. To return to manual mode, remove the flag or set it to any value other than `1` and redeploy.
