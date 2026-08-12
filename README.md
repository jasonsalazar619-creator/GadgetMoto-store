# GadgetMoTo Storefront

GadgetMoTo is a production-oriented Next.js storefront for phones and tablets. The customer-facing website includes a responsive homepage, catalog and category pages, a price-derived Sale page, 12 product-detail routes, a separate 68-item Coming Soon preview catalog, product search, comparison, cart, and validated manual-order checkout. Facebook Messenger remains a secondary support channel.

## Current catalog architecture

- Next.js `16.2.10`, React `19.2.4`, strict TypeScript, Tailwind CSS, and GSAP
- Server-only catalog boundary with complete-result validation, normalization, sanitized failures, and atomic static fallback
- Request-scoped catalog memoization for consistent server rendering and metadata
- One server-initialized client catalog provider for search, comparison, cart, and checkout summaries
- Canonical static catalog remains the default source, complete fallback, build-safe route-slug source, and placeholder-presentation source
- A least-privilege PostgreSQL read model is prepared and previously verified; production database configuration remains intentionally absent

Manual order submission activates only when secure server-side order-database configuration is present and has an explicit emergency-disable flag. Automated payment processing remains disabled. No environment file, database credential, public catalog API, or live payment flow is included in the repository.

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
- `/sale`
- `/coming-soon` for all 68 non-purchasable folder candidates
- `/coming-soon/[slug]` for 68 non-purchasable product previews and available
  image galleries
- `/products/[slug]` for all 12 approved products
- `/compare`
- `/cart`
- `/checkout`
- `/contact`
- `/privacy-policy`
- `/terms-and-conditions`
- `/design-system`

## Completed

- Catalog, commerce, and admin product-management database foundation with nine immutable deployed migrations
- Secure storefront read model and least-privilege reader architecture
- Deployed secure order-transaction schema, an uncalled server-only order-creation service, and `POST /api/orders`
- Server-only PostgreSQL client, catalog query, validation, normalization, and fallback
- Controlled static and database connectivity verification
- Homepage, shop, phones, tablets, product-detail, contact, metadata, sitemap, robots, and related-product catalog integration
- Shared client catalog provider
- Global search, comparison, cart, and catalog-driven checkout integration
- Database-backed manual-order submission with server-authoritative products, variants, colors, quantities, prices, pending fulfillment, and pending payment review
- Contact-first checkout fallback when secure order-database configuration is unavailable
- Product media for 11 products plus the approved POCO C85 placeholder
- 69 exact-copy preview images assigned across 67 identified products, plus one
  safe placeholder for an ambiguous filename/poster conflict
- Two non-duplicating upcoming-product galleries, isolated from transactional
  catalog behavior
- Unique short descriptions and full overviews for all 68 upcoming products
- Officially sourced highlights and specifications for 35 upcoming products,
  with unsupported sections hidden for partially verified or unresolved models
- Product-specific Coming Soon metadata and responsive, non-cropping preview
  cards and detail pages
- Original-aspect product media with one explicit primary image, a
  non-duplicating gallery contract, and contain-and-center rendering on cards,
  details, search, comparison, cart, and checkout
- Responsive, accessibility, static-mode lint, and production-build validation

## Still pending

- Secure production order-database configuration in each hosting environment
- Reservation release, expiry-job, and conversion workflows
- Controlled database and endpoint testing with inventory and location readiness
- Store-location and inventory readiness for order allocation
- Delivery-fee and VAT implementation after business rules are confirmed
- Maya payment integration, server verification, and webhooks
- Proof-of-payment handling where required
- Admin product-image uploads and gallery management
- Admin inventory and order-management tools
- Approved POCO C85 imagery
- Final business-supplied privacy, terms, warranty, cancellation, and refund wording

`ONLINE_ORDERING_ENABLED=0` is the server-side emergency disable. Manual order submission otherwise activates when `ORDER_DATABASE_URL` is securely configured and automated payment remains disabled. While order submission is unavailable, checkout does not call `POST /api/orders`; customers can review their cart and continue through Messenger. The endpoint returns a safe unavailable response before parsing or creating an order.

## Current implementation status

- Storefront catalog integration: complete
- Checkout interface, validation, review flow, contact handoff, and delivery-only request contract: complete
- Secure server-side order service and endpoint: implemented for manual-order review
- Manual order submission: enabled when secure server configuration is present
- Maya and other live payment integration: pending
- Secure staff authentication and protected admin shell: implemented
- Validated admin product CRUD, autosave, archival, guarded draft deletion,
  audit logging, and storefront revalidation: implemented
- Admin product-image workflow: pending
- Vercel project connection: complete; production redeployment follows pushes to `main`

The order contract, atomic transaction, inventory and idempotency boundaries, payment boundary, and unresolved launch decisions are documented in `docs/order-creation-transaction-plan.md`. Current launch readiness is summarized in `docs/storefront-launch-status.md`.

The authoritative 12-product record is documented in
`docs/product-master-catalog.md`. Image origins, dimensions, hashes, and active
mapping are documented in `docs/product-media-source-matrix.md`; incomplete
folder candidates and their non-transactional preview status are documented in
`docs/new-product-intake.md`.

Upcoming-product content sources, verification levels, unresolved naming
conflicts, and per-product completion counts are recorded in
`docs/upcoming-product-content-audit.md`. Content completion does not approve
any preview for sale: the 68 records still have no price, SKU, stock, cart,
checkout, inventory, order, or payment behavior.
