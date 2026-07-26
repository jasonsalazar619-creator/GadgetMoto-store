# GadgetMoTo Storefront

GadgetMoTo is a production-oriented Next.js storefront for phones and tablets. The current website includes the approved responsive homepage, catalog and category pages, 12 product-detail routes, local product search, comparison, cart, and a review-only guest checkout.

## Current catalog architecture

- Next.js `16.2.10`, React `19.2.4`, strict TypeScript, Tailwind CSS, and GSAP
- Server-only catalog boundary with complete-result validation, normalization, sanitized failures, and atomic static fallback
- Request-scoped catalog memoization for consistent server rendering and metadata
- One server-initialized client catalog provider for search, comparison, cart, and checkout summaries
- Canonical static catalog remains the default source, complete fallback, build-safe route-slug source, and placeholder-presentation source
- A least-privilege PostgreSQL read model is prepared and previously verified, but production environment configuration and deployment verification remain pending

No environment file, database credential, public catalog API, active order-submission consumer, or live payment flow is included in the repository.

## Local development

PowerShell script execution is disabled on the project computer, so use the Windows command shims:

```powershell
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
```

## Storefront routes

- `/`
- `/shop`
- `/phones`
- `/tablets`
- `/products/[slug]` for all 12 approved products
- `/compare`
- `/cart`
- `/checkout`
- `/privacy-policy`
- `/terms-and-conditions`
- `/design-system`

## Completed

- Catalog and commerce database foundation with seven immutable deployed migrations
- Secure storefront read model and least-privilege reader architecture
- Deployed secure order-transaction schema and an uncalled server-only order-creation service
- Server-only PostgreSQL client, catalog query, validation, normalization, and fallback
- Controlled static and database connectivity verification
- Homepage, shop, phones, tablets, product-detail, metadata, and related-product catalog integration
- Shared client catalog provider
- Global search, comparison, cart, and catalog-driven checkout summary integration
- Static-mode lint and production-build validation

## Still pending

- Production environment configuration and deployment verification
- Controlled database testing of the order-creation transaction
- Approved reservation duration plus release, expiry, and conversion workflows
- Customer checkout integration with the server-only order service
- Store-location and inventory readiness for order allocation
- Delivery-fee and VAT implementation after business rules are confirmed
- Maya payment integration, server verification, and webhooks
- Proof-of-payment handling where required
- Staff authentication
- Admin catalog, inventory, and order-management tools
- Production product imagery

Checkout is currently a review preview only. It creates no order, processes no payment, and stores no customer information.

## Current implementation status

- Storefront catalog integration: complete
- Checkout interface and review flow: complete
- Secure server-side order service: implemented but uncalled and unconnected
- Maya and other live payment integration: pending
- Staff and admin tools: pending
- Production environment configuration and deployment verification: pending

The proposed order contract, atomic transaction, inventory and idempotency gaps, payment boundary, and unresolved launch decisions are documented in `docs/order-creation-transaction-plan.md`.
