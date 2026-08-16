# GadgetMoTo Catalog Integration Decisions

## Status and approval record

This document records the final approved implementation decisions for moving the GadgetMoTo storefront catalog from the canonical static TypeScript source to the reviewed PostgreSQL catalog records. It is not executable SQL or application code.

The user approved all 13 catalog-integration decisions without changes. The exact sort order 0 through 11, dedicated `storefront` schema and catalog view, non-login `gadgetmoto_storefront_reader` role, server-only direct PostgreSQL access, `database-with-static-fallback` launch mode, whole-result validation and fallback, static route and metadata fallback, and one shared normalized catalog provider are approved.

Migration `20260717234135_catalog_ordering_storefront_read_model.sql` deployed successfully. The later secure-order and physical-RAM correction migrations are also deployed, and all eight deployed migration versions are user-confirmed as synchronized locally and remotely. The deployed `public.products.sort_order` values were manually verified as the exact approved sequence from 0 through 11. The `storefront.catalog_products` view was verified with all 17 approved columns and exactly 12 rows, and its product, variant, and pricing values passed manual parity verification.

The `gadgetmoto_storefront_reader` role exists as a non-login role with zero active connections. Login, superuser, role creation, database creation, RLS bypass, and replication are all disabled. No login credential or password exists, and no browser-facing or Data API access was introduced.

The separate server login role `gadgetmoto_storefront_app` was created manually with `LOGIN` and `INHERIT` enabled. Role creation, database creation, RLS bypass, superuser, and replication capabilities are disabled, and the role has zero active connections. Its password exists only in the managed database configuration and the user's secure password storage; no password or connection string exists in Git.

The app role inherits `gadgetmoto_storefront_reader`, and the membership was verified successfully. Effective `USAGE` on the `storefront` schema and `SELECT` on `storefront.catalog_products` were verified. Direct `SELECT` on `public.products` and `public.orders` remains unavailable. No browser-facing or Data API access was introduced.

All eight deployed migrations remain immutable. The database contains the manually verified parity copy of 6 brands, 12 products, and 12 product variants. Postgres.js `3.4.9` is installed, and the server-only catalog boundary now implements request-memoized `getCatalogProducts()` and `getCatalogProductBySlug()`. Controlled application-consumer integration covers the homepage catalog sections, `/shop`, `/phones`, `/tablets`, and all 12 product-detail routes; static data in `src/data/prototype-products.ts` remains the active source under the default configuration.

The adapter selects only the 17 approved columns from `storefront.catalog_products`, validates and normalizes the complete parity result, and rejects the entire result on any mismatch. `database-with-static-fallback` returns either the complete validated database catalog or the complete canonical static catalog; partial merging is prohibited. Static enrichment supplies only compatibility and presentation fields absent from the read model, including the legacy application `id`, fixed financing label, placeholder `artSeed`, and verified product specifications.

Controlled local verification passed in both static and database modes. Session pooler authentication using `gadgetmoto_storefront_app` succeeded, and the adapter returned exactly 12 validated and normalized products from the hosted storefront view. Canonical ordering, approved null-value parity, and complete-result validation passed. No partial fallback or mixed-source result occurred.

The temporary verification route was removed, so no permanent diagnostic endpoint exists. Temporary local environment variables were removed, and no password, URI, endpoint, or environment value was committed. Static mode remains the default.

`/shop` is the first storefront route connected to the server catalog boundary. Its Server Component calls `getCatalogProducts()` exactly once and passes the complete normalized `PrototypeProduct` array through the existing typed `CatalogPage` prop boundary to the interactive Shop UI.

`/phones` is the second storefront route connected to the server catalog boundary. Its Server Component calls `getCatalogProducts()` exactly once, filters the complete result to the typed `"Phone"` category on the server, and passes the filtered normalized `PrototypeProduct` array through the existing typed `CatalogPage` prop boundary. Static mode remains the default, `/shop` is unchanged, no other storefront consumer is integrated, no global provider was introduced, and no database connection occurred during this checkpoint.

`/tablets` is the third storefront route connected to the server catalog boundary. Its Server Component calls `getCatalogProducts()` exactly once, filters the complete result to the typed `"Tablet"` category on the server, and passes the four ordered normalized products through the unchanged typed `CatalogPage` prop boundary. `/shop` and `/phones` remain unchanged, static mode remains the default, no other consumer is integrated, and no database connection occurred during this checkpoint.

The homepage Server Component now calls `getCatalogProducts()` exactly once and reproduces its existing catalog sections from that complete ordered result: every phone remains in the New Arrivals grid and every tablet remains in the Featured Tablets grid. Product counts, ordering, cards, placeholder artwork, GSAP hero, navigation, calls to action, and responsive presentation are unchanged.

Product-detail rendering and metadata resolve exact slugs through `getCatalogProductBySlug()`, while related products use the same complete ordered catalog through request-scoped memoization. The canonical 12 static slugs remain the build-safe source for `generateStaticParams()`, and existing not-found behavior, metadata, related-product rules, routes, and presentation remain unchanged.

The async root Server Component now loads one normalized catalog payload and passes it into `src/components/catalog/catalog-provider.tsx`. This client provider exposes read-only products, canonical SKU, and stable slug lookup helpers without diagnostics, environment values, database UUIDs, or server-only code. Global search, comparison, cart, and the checkout summary consume this shared data flow. Their ranking, result limit, localStorage keys, selection limit, quantities, current-price resolution, hydration safeguards, drawer and tray behavior, and empty states remain unchanged. Checkout validates and reviews customer choices but remains contact-first while live online submission is disabled; it performs no live payment action.

## Canonical SKU and specification enrichment

Canonical SKU is a required field on the shared application-facing
`PrototypeProduct` contract. The canonical static catalog uses the exact 12
SKU values already committed in
`20260717205111_catalog_bootstrap_data.sql`. The database row mapper requires
the `storefront.catalog_products` SKU to match that static value exactly and
then maps the database value into the same normalized product shape.

`CatalogProvider` therefore supplies the same SKU in static and database
modes. Persisted cart lines continue to store the stable product slug, current
display variant, and quantity rather than a complete product object. Current
product data, including SKU, is resolved by slug after hydration. Checkout can
construct line items containing `productSlug`, canonical `sku`, and `quantity`
for the server-only order endpoint. Display variants are never used as
transactional SKU substitutes.

Canonical SKUs are opaque identifiers. In particular, numerals within
`GMT-INF-PH-N60P5G-16-256` and `GMT-TEC-PH-CAMON50-16-256` are not parsed as
physical-RAM specifications. The approved static catalog separately records
8GB physical RAM, 8GB extended RAM, and 256GB storage for each product, with
the customer-facing variant `8GB RAM + 8GB Extended / 256GB`. Checkout keeps
using the complete unchanged canonical SKU.

Product specifications remain static presentation enrichment keyed by stable
product slug. Only official manufacturer pages are used, and the verification
status, omitted fields, and regional or memory-configuration conflicts are
recorded in `docs/product-spec-source-matrix.md`. Database rows retain
authority over transactional SKU, price, status, and catalog fields; static
enrichment cannot overwrite those values.

Forward-only migration `20260726175847_correct_product_physical_ram.sql`
corrects only the two matching variant rows by complete canonical SKU. It
changes `ram_gb` and `variant_name` only, is deployed and synchronized, and
does not modify any earlier deployed migration.

## Decisions inherited from the approved architecture

The approved decisions preserve the recommendations in `docs/catalog-database-integration-plan.md`:

- Product ordering needs an explicit global field; brand order, variant order, UUID order, insertion order, and unspecified PostgreSQL row order are not substitutes.
- Primary database access is server-only direct PostgreSQL through a dedicated least-privilege read model and pooled connection.
- The architectural fallback is a narrowly exposed storefront read model queried server-side through the Data API only if direct PostgreSQL pooling is unsuitable.
- The application boundary is `getCatalogProducts()` with `getCatalogProductBySlug(slug)` sharing the same normalized result.
- The 12 static slugs remain in `generateStaticParams()` during the parity phase.
- One server-initialized, read-only normalized catalog payload should feed shared client state.

No concrete security or Next.js compatibility defect was found in those recommendations.

## Product-ordering decision

### Confirmed gap

`public.products` has no stable global storefront ordering column. `public.brands.sort_order` orders brands, and `public.product_variants.sort_order` orders variants within a product. Neither defines the approved full-catalog order.

### Proposed column and integrity rule

The approved local timestamped migration adds:

- `public.products.sort_order integer not null`
- A named check constraint requiring `sort_order >= 0`
- No implicit default; every future product must receive a deliberate storefront position

The migration adds the column in a safe backfill sequence, assigns every existing product, validates the values, and only then enforces `not null`. It does not edit the deployed catalog migration.

The initial proposal does not require `sort_order` to be unique. Distinct values are expected for the parity catalog, while `ORDER BY sort_order, slug` provides deterministic behavior if a later merchandising update temporarily creates a tie. Unique product slugs remain the stable route, comparison, cart, and browser-state identifiers.

### Exact approved-source backfill

| Sort order | Product | Slug |
| ---: | --- | --- |
| 0 | Xiaomi 17 Ultra 5G Leica Kit | `xiaomi-17-ultra-5g-leica-kit` |
| 1 | Apple iPhone 17 | `apple-iphone-17` |
| 2 | POCO F8 Ultra | `poco-f8-ultra` |
| 3 | Redmi Note 15 Pro Plus 5G | `redmi-note-15-pro-plus-5g` |
| 4 | Redmi Turbo 5 | `redmi-turbo-5` |
| 5 | Infinix Note 60 Pro 5G | `infinix-note-60-pro-5g` |
| 6 | TECNO Camon 50 | `tecno-camon-50` |
| 7 | POCO C85 | `poco-c85` |
| 8 | POCO Pad X1 | `poco-pad-x1` |
| 9 | Xiaomi Pad 8 | `xiaomi-pad-8` |
| 10 | Redmi Pad 2 Pro 5G | `redmi-pad-2-pro-5g` |
| 11 | TECNO Mega Pad Pro | `tecno-mega-pad-pro` |

The migration must fail if any expected slug is missing, if an unexpected catalog row makes the backfill incomplete, or if any row remains null. It must not use UUID order, insertion order, brand order, or variant order.

### Index decision

Do not add a product-ordering index in the first migration. The reviewed catalog has only 12 products, so a dedicated index is not yet justified by scale or measurement. The unique slug index already supports the stable identifier. If measured query plans later justify it, add a new migration for an active-catalog ordering index such as one beginning with `sort_order` and ending with `slug`; do not add speculative indexes now.

## Secure storefront read-model decision

### Primary read model

Create a dedicated non-Data-API schema containing one narrowly reviewed, read-only storefront catalog view or an equivalent relational read model. The proposed shape is one row per active product variant and contains only:

- Product UUID
- Product slug
- Product name
- Brand name and slug
- Category
- Product sort order
- Variant UUID
- SKU
- Variant name
- RAM
- Storage
- Condition
- Current price in centavos
- SRP in centavos
- Badge
- Financing flag

The read model must include only rows where:

- The brand is active.
- The product is active.
- `published_at` is not null.
- `published_at` is not in the future.
- The variant is active.

It must exclude product images during the placeholder-media phase, internal timestamps, descriptions not used by the current UI, inventory quantities, staff data, subscriber data, order data, payment data, audit data, and every other field not required by the storefront.

### Privilege boundary

The proposed implementation is a safe view in a dedicated schema that is not exposed through the Data API in the primary architecture. A dedicated read-only database capability role should receive only schema usage and `SELECT` on that view. It should receive no direct table privileges and no insert, update, delete, execute, sequence, or private-schema access.

The future SQL review must explicitly verify view ownership, invoker/definer behavior, RLS interaction, schema qualification, search-path safety, and privilege inheritance. The view must not be accepted merely because its column list appears narrow. `PUBLIC`, `anon`, and `authenticated` must receive no access in the primary direct-PostgreSQL design.

The runtime login credential must be provisioned and rotated outside Git in a separate secure configuration checkpoint. If the host or pooler cannot safely support the dedicated direct-PostgreSQL role, implementation must stop and return for approval of the architectural fallback.

### Architectural fallback

The fallback is the same narrow read model in a dedicated schema exposed through the Supabase Data API, queried only by server-side Next.js code using a low-privilege publishable identity. Only the dedicated schema/read model may be exposed. The full `public` schema and private tables must remain unavailable, and no service-role credential may be used for routine catalog reads.

Any Data API exposed-schema setting that is not safely represented in version-controlled SQL requires its own manual, reviewed checkpoint after the migration is deployed. It must not be changed as an incidental application step.

## Application-access decision

All catalog database reads occur in server-only Next.js modules.

- Browser code performs no direct database query in the first integration phase.
- No service-role credential enters browser code or a browser bundle.
- No secret uses a `NEXT_PUBLIC_` prefix.
- No Client Component receives a database credential or raw database response.
- Server code returns only validated, normalized, serializable catalog data.
- Search, comparison, cart, checkout, related products, filters, and product cards consume the same normalized payload.
- No database write path is introduced.

### Approved configuration names

Primary direct-PostgreSQL configuration, without values:

- `CATALOG_SOURCE`
- `STOREFRONT_DATABASE_URL`

`CATALOG_SOURCE` supports `static`, `database`, and `database-with-static-fallback`, and defaults to `static` when absent. `STOREFRONT_DATABASE_URL` is read only when database access is requested. The database URL is a privileged server-only secret that must be supplied by the deployment environment and never committed, logged, serialized, or returned to a client. The production deployment uses `database-with-static-fallback` and a separately managed, least-privilege storefront login. The Postgres.js client disables prepared statements and limits each serverless instance to one connection for compatibility with the hosted transaction pooler. No environment value or environment file is stored in the repository.

If the Data API fallback is separately approved, proposed server-only names are:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

A project URL and publishable key identify a project and low-privilege API identity; they are not equivalent to a service-role secret. Even so, the first integration phase keeps them server-side because browsers do not query the catalog directly. Privileged values such as a service-role key, database password, or direct database URL remain secrets and must never use `NEXT_PUBLIC_` names. No environment file is created by this proposal.

## Catalog-loading boundary decision

### API boundary

Use one server-only boundary:

- `getCatalogProducts()` returns the complete normalized catalog.
- `getCatalogProductBySlug(slug)` resolves from the same normalized result rather than issuing an independent query shape.

`getCatalogProducts()` now uses React request-level memoization so product metadata, page rendering, and related-product selection observe one normalized catalog snapshot per request. React's request-scoped cache introduces no cross-request or deployment-persistent result, does not retain a static fallback or source-mode decision across requests, and does not cache a raw error beyond the request in which it occurs.

### Source modes

- `static`: return the canonical static catalog without attempting a database read.
- `database`: require valid database configuration and a fully valid database result; otherwise produce a controlled server failure.
- `database-with-static-fallback`: attempt the database read, validate the entire result, and return the entire canonical static catalog on any query, configuration, timeout, normalization, or parity failure.

Recommended launch mode: `database-with-static-fallback`.

### Database-with-static-fallback behavior

1. Server code loads only the reviewed read model.
2. It validates and normalizes the complete result.
3. It sorts products by `sort_order`, then slug as the deterministic tie-breaker.
4. During the parity phase it requires exactly one active variant for each of the 12 expected products and maps that variant into the existing flattened application shape.
5. It preserves current placeholder artwork through a static slug-indexed presentation map.
6. If loading or validation fails, it returns the complete static catalog.
7. It records a sanitized server-side warning containing a reason code, not raw database errors or connection details.
8. It never sends fallback diagnostics, credentials, or raw database errors to the user.

The boundary must be atomic: accept the complete validated database result or use the complete static catalog. It must never silently combine partial database rows with static rows.

## Validation and fallback policy

Reject the complete database result during the parity phase when any of these conditions occurs:

- Duplicate product slug
- Duplicate SKU
- Duplicate product UUID or variant UUID
- Missing or inactive brand relationship
- Missing product relationship
- Unsupported category
- Unsupported condition
- Unsupported badge
- Invalid current price
- Invalid SRP, including an SRP below current price
- Missing or invalid storage
- Invalid RAM when supplied
- An inactive product or variant appears unexpectedly
- A product is unpublished or has a future publication time
- A product has zero or more than one active variant in the single-variant parity phase
- Product count is not exactly 12
- Variant count is not exactly 12
- Any expected source slug is missing
- Product ordering values are invalid or cannot reproduce the approved order
- A centavo value cannot be converted safely at the current whole-peso compatibility boundary

Development may throw a detailed server-side error containing non-secret validation context. Production should log a sanitized warning and use the static fallback. Invalid rows must not be omitted individually because that could produce a silently incomplete storefront.

## Build and product-route decision

- Keep the existing canonical static slug list in `generateStaticParams()` throughout the parity phase.
- Product-detail routes remain buildable without database credentials or database availability.
- At runtime, load the product by slug through the shared catalog boundary.
- Prefer the validated database product when database mode succeeds.
- Fall back to the static product with the same slug when database loading fails.
- Call `notFound()` only if neither the normalized database catalog nor the static fallback contains the slug.
- Keep related-product selection on the same normalized ordered catalog.
- Metadata generation uses the same shared lookup and static fallback.
- Do not add database-only slugs or remove static product routes until deployment reliability, cache behavior, route generation, metadata, and parity have been separately approved.

## Shared client-provider decision

Add one read-only `CatalogProvider` or equivalent shared catalog context, initialized by a Server Component from the normalized serializable catalog payload.

The target data flow is:

1. A server boundary loads and validates one catalog.
2. The server passes one normalized payload into shared client provider composition.
3. Global Search, `ComparisonProvider`, `CartProvider`, checkout, related products, filters, sorting, and product cards resolve from that payload.
4. Comparison stops importing `src/data/prototype-products.ts` independently.
5. Persisted comparison selections continue storing stable product slugs.
6. Persisted cart lines continue storing product slug, exact variant identifier, and quantity during the single-variant parity phase.
7. Names and prices are always resolved from the current normalized catalog rather than persisted browser copies.

Static imports should be removed consumer by consumer only after each conversion passes behavior, hydration, persistence, and parity tests. The source module remains available as the operational fallback until a later retirement review.

## Dependency decision

The selected runtime PostgreSQL driver is `postgres` (Postgres.js) `3.4.9`, installed as the only application database dependency. Its import and configuration access are isolated in server-only modules.

Reasons for this choice:

- It supports direct PostgreSQL queries and bounded pooled connections from server-only code.
- Its tagged-query API can keep query values parameterized.
- It avoids enabling the Data API for the primary architecture.
- It is separate from the existing `supabase` development dependency, which is CLI tooling and must not be treated as an application query client.

`@supabase/supabase-js` is not preferred for the first phase because it would require Data API exposure and the fallback access configuration. The `pg` package would also provide direct PostgreSQL access but is not needed in addition to `postgres`; only one reviewed driver is installed. Pooler mode, connection limits, timeout behavior, and deployment-host support remain deferred until application connectivity is configured.

The lazy PostgreSQL client and catalog adapter have not been called, no connectivity test has occurred, and no application consumer, page, or provider is integrated yet.

## Approved access-and-ordering migration scope

Deployed migration `20260717234135_catalog_ordering_storefront_read_model.sql` is limited to:

- Add `public.products.sort_order` without editing any deployed migration.
- Backfill exact values 0 through 11 by the approved product slugs.
- Fail safely if the expected catalog set cannot be backfilled completely.
- Add the nonnegative check and enforce `not null` after backfill.
- Create the dedicated storefront schema and narrow read-only catalog view or equivalent read model.
- Create only the minimum non-login capability role and grants required for `SELECT` on the read model.
- Revoke default/public access and keep all writes unavailable.
- Preserve RLS and all existing private-table protections.
- Add no ordering index until measurement justifies one.
- Change no catalog business data other than the new `sort_order` values.
- Insert no application user, product, variant, image, inventory, commerce, content, subscriber, or audit record.

The migration must not contain credential values. Provisioning a runtime login/password, setting deployment secrets, and—only if the fallback architecture is approved—changing the hosted Data API exposed-schema configuration require separate secure/manual checkpoints. Those actions must not be hidden inside migration deployment.

## Security acceptance criteria

Implementation cannot proceed unless it guarantees:

- No service-role key in browser bundles.
- No public insert, update, or delete capability.
- No direct browser database query in the first phase.
- No direct access to orders, order addresses, order items, fulfillments, payments, payment events, staff profiles, audit logs, inventory levels, inventory movements, or subscriber emails.
- No public exposure of unsubscribe token hashes.
- No database credential or environment value committed to Git.
- No raw database error shown to users or written to browser logs.
- Static fallback remains functional and complete.
- Data API exposure, if separately approved, is restricted to the reviewed read model and minimum read identity.
- Existing private tables remain inaccessible.
- The read role has no direct table access and no write privileges.
- All query results are validated before crossing the server/client boundary.

## Proposed implementation sequence

### Checkpoint A — Ordering and read-model migration

- Local migration creation and static SQL and privilege review are complete.
- The migration was committed before execution and passed a linked non-destructive dry run.
- Manual deployment is complete.
- Post-deployment ordering, read-model output, role properties, grants, and zero-write-access checks passed.

### Checkpoint B — Server catalog adapter

- The approved PostgreSQL dependency, server-only client, query, normalization, whole-result validation, sanitized errors, and atomic static fallback are complete.
- Configuration validation is implemented without secret values; Session pooler compatibility passed controlled local verification, while production-hosting compatibility remains pending.
- Request-level memoization is implemented with React's request-scoped cache now that the adapter is connected to server consumers.
- Static remains the default source until production environment configuration is supplied securely outside Git.

### Checkpoint C — Page integration

- The homepage, `/shop`, `/phones`, and `/tablets` use the server catalog boundary.
- Product-detail runtime lookups and related products use the request-memoized complete catalog.
- Metadata uses exact-slug catalog lookup while static route generation and fallback remain intact.

### Checkpoint D — Shared client integration

- One normalized catalog provider is initialized by the root Server Component.
- Global Search consumes the shared read-only payload.
- Comparison no longer imports an independent static product source.
- Cart resolves persisted slug-and-variant lines against the shared current catalog.
- Checkout consumes catalog-resolved cart items and current prices, validates the customer-entered form, and remains contact-first while live online submission is disabled.

### Checkpoint E — Static-source retirement review

- The direct-import audit found no accidental storefront consumer bypass.
- Canonical static value imports remain only in the approved server fallback/validation boundary and product-route build-safe slug/title helpers.
- Type-only component imports preserve the shared application model without bundling catalog records.
- The static snapshot remains the default source, complete emergency fallback, and placeholder-presentation source pending a separately approved production rollout.

The catalog consumer-integration checkpoints described above are complete. Production configuration, write-side commerce behavior, payment processing, administration, and deployment verification remain separate future checkpoints.

The separate `/coming-soon` preview catalog is not a catalog-provider consumer.
Its 68 records and preview-detail routes contain no transactional price, SKU,
variant, stock, `/products` route, comparison, cart, checkout, inventory, or
database behavior. Sixty-seven records use exact-copy primary media, two add an
exact-copy gallery poster, and the ambiguous identity record uses a generated
placeholder. Global product search and all commerce flows continue to use only
the 12 canonical products.

## Product media contract

The shared normalized product now carries an explicit nullable `primaryImage`
plus additional `images`. A null primary is reserved for the existing generated
placeholder; gallery entries never repeat the primary path. Static and
database-normalized catalogs preserve the same serializable media shape, and
metadata, sitemap images, product cards, details, search, comparison, cart, and
checkout consume it without adding a browser database boundary.

The 11 approved primary assets are exact byte copies of the original
user-supplied files. They preserve their intrinsic dimensions and render with
contain-and-center behavior. POCO C85 remains the sole placeholder. The catalog
still contains exactly 12 products, SKUs, slugs, and product routes. No complete
new folder record was available, so no catalog record or migration was added.

## Final storefront structure status

### Completed

- Catalog database foundation and secure storefront read model
- Server-only PostgreSQL client, catalog query, complete validation, normalization, sanitized errors, and atomic fallback
- Controlled database connectivity verification
- Homepage, shop, phones, tablets, product-detail, metadata, and related-product integration
- Shared client catalog provider
- Global search, comparison, cart, and catalog-driven checkout summary integration

### Still pending

- Production environment configuration and deployment verification
- Controlled activation and database testing of online order submission
- Inventory reservation and expiry behavior
- Delivery-fee and confirmed VAT rules
- Maya payment integration, server verification, webhooks, and proof-of-payment handling where required
- Staff authentication and admin catalog, inventory, and order-management tools

The storefront structure and secure atomic order-creation code are complete. The transaction reloads authoritative variants and prices, calculates confirmed amounts in integer centavos, and does not trust client prices, line totals, subtotals, inventory claims, or payment status. The current launch state keeps live submission disabled and hands customers to Messenger after review; no order is submitted.

## Upcoming-product content boundary

The Coming Soon content contract adds only serializable descriptions,
highlights, and label/value specifications to the separate preview type. It
does not reuse the transactional `Product` type and adds no price, SKU, variant,
stock, or commerce state. Highlights and specification sections render only
when official-source data exists.

The 68 preview entries remain outside the catalog provider, global product
search, comparison, cart, checkout, inventory, orders, and `/api/orders`.
Their complete audit is maintained in
`docs/upcoming-product-content-audit.md`.

## Administrator write-side integration

The protected product-management application now uses the deployed Supabase
administrator policies and automatic audit triggers. Every Server Action
re-verifies the Auth user and active `administrator` staff profile, validates
an allowlisted request, performs only the requested product or primary-variant
change, returns a sanitized result, and revalidates affected public routes.
The browser never supplies an authoritative role, database price, or
publication decision.

The active catalog adapter no longer assumes immutable parity values for the
original 12 products. It validates any complete server-only active read-model
result for unique slugs, SKUs, product IDs, and variant IDs; supported enums;
safe integer centavos; SRP ordering; valid relationships; and one flattened
active variant per product. The original static catalog remains the complete
fallback when database mode fails validation. Static presentation enrichment
is used only when a known slug matches; new active products receive no
fabricated specifications or product media.

The separate Coming Soon pages now read
`storefront.coming_soon_products` through the same server-only source-mode
boundary. Database preview rows remain non-transactional and contain no SKU,
price, inventory, cart, comparison, checkout, or order behavior. Their
repository media uses only already-known dimensions; unknown managed media is
withheld until the product-image workflow is implemented. Static preview data
remains the build-safe fallback and continues to generate the approved 68
routes.

Administrator edits can therefore update active product names, descriptions,
prices, visibility, and Coming Soon content without mixing database and static
records. Draft and archived products remain absent from public read models.
Revalidation covers the shared root catalog payload, homepage, shop, phones,
tablets, Coming Soon listing and details, active product details, and sitemap.

## Approval checklist

- [x] Add `public.products.sort_order` as a nonnegative, required integer without an implicit default.
- [x] Backfill the exact approved product order values 0 through 11.
- [x] Create a dedicated narrow storefront read model in a non-Data-API schema for the primary architecture.
- [x] Use server-only direct PostgreSQL database access through a least-privilege read role.
- [x] Keep every service-role credential out of browser code and ordinary catalog reads.
- [x] Launch with `database-with-static-fallback` mode.
- [x] Validate the complete database result and fall back atomically to the complete static catalog.
- [x] Retain static `generateStaticParams()` slugs during the parity phase.
- [x] Initialize one shared normalized catalog provider from a Server Component.
- [x] Add only the `postgres` runtime dependency in the future adapter checkpoint, subject to host compatibility verification.
- [x] Limit the future migration to approved ordering and read-access changes.
- [x] Preserve no-write public-read security boundaries.
- [x] Keep private commerce, staff, inventory, subscriber, payment, and audit tables inaccessible.
