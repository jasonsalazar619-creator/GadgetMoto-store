# GadgetMoTo Catalog Integration Decisions

## Status and approval record

This document records the final approved implementation decisions for moving the GadgetMoTo storefront catalog from the canonical static TypeScript source to the reviewed PostgreSQL catalog records. It is not executable SQL or application code.

The user approved all 13 catalog-integration decisions without changes. The exact sort order 0 through 11, dedicated `storefront` schema and catalog view, non-login `gadgetmoto_storefront_reader` role, server-only direct PostgreSQL access, `database-with-static-fallback` launch mode, whole-result validation and fallback, static route and metadata fallback, and one shared normalized catalog provider are approved.

Local migration `20260717234135_catalog_ordering_storefront_read_model.sql` is drafted but remains unexecuted and undeployed. It creates no login credential or password in Git. No database access, Data API exposure, environment configuration, application dependency, or application behavior has been enabled or changed. Postgres.js remains the proposed future application dependency pending compatibility verification.

The linked remote dry run passed and listed only `20260717234135_catalog_ordering_storefront_read_model.sql`. The migration remains unapplied: no sort-order value, schema, role, view, privilege, migration-history row, or record changed remotely. No login credential or password exists. Deployment and post-deployment security verification remain pending.

The five deployed migrations remain immutable. The database currently contains the manually verified parity copy of 6 brands, 12 products, and 12 product variants. Static data in `src/data/prototype-products.ts` remains the live storefront source.

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

### Proposed configuration names

Primary direct-PostgreSQL configuration, without values:

- `GADGETMOTO_CATALOG_SOURCE_MODE`
- `GADGETMOTO_CATALOG_DATABASE_URL`
- `GADGETMOTO_CATALOG_QUERY_TIMEOUT_MS`

The database URL is a privileged server-only secret. It must be supplied by the deployment environment, never committed, logged, serialized, or returned to a client.

If the Data API fallback is separately approved, proposed server-only names are:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

A project URL and publishable key identify a project and low-privilege API identity; they are not equivalent to a service-role secret. Even so, the first integration phase keeps them server-side because browsers do not query the catalog directly. Privileged values such as a service-role key, database password, or direct database URL remain secrets and must never use `NEXT_PUBLIC_` names. No environment file is created by this proposal.

## Catalog-loading boundary decision

### API boundary

Use one server-only boundary:

- `getCatalogProducts()` returns the complete normalized catalog.
- `getCatalogProductBySlug(slug)` resolves from the same normalized result rather than issuing an independent query shape.

The implementation should use request-level memoization so page rendering and metadata generation cannot observe different catalog snapshots in one request. Cache lifetime and cross-request invalidation require a separate implementation decision; no implicit indefinite cache is proposed.

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

The primary architecture requires one runtime PostgreSQL driver because the repository currently has no application dependency capable of issuing direct PostgreSQL queries. The minimum proposed dependency is `postgres` (Postgres.js), added only in the future server-adapter checkpoint after architecture approval.

Reasons for this choice:

- It supports direct PostgreSQL queries and bounded pooled connections from server-only code.
- Its tagged-query API can keep query values parameterized.
- It avoids enabling the Data API for the primary architecture.
- It is separate from the existing `supabase` development dependency, which is CLI tooling and must not be treated as an application query client.

`@supabase/supabase-js` is not preferred for the first phase because it would require Data API exposure and the fallback access configuration. The `pg` package would also provide direct PostgreSQL access but is not needed in addition to `postgres`; only one reviewed driver should be installed. The exact compatible version, pooler mode, connection limit, timeout behavior, and deployment-host support must be verified in the dependency checkpoint before installation.

## Approved access-and-ordering migration scope

Local migration `20260717234135_catalog_ordering_storefront_read_model.sql` is limited to:

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

- Local migration creation is complete.
- Perform full static SQL and privilege review.
- Commit the unexecuted migration.
- Run a linked non-destructive dry run in a separate approved checkpoint.
- Deploy manually in a separate approved checkpoint.
- Verify ordering, read-model output, RLS, grants, private-table isolation, and zero write access.

### Checkpoint B — Server catalog adapter

- Verify hosting and pooler compatibility.
- Add only the approved PostgreSQL dependency.
- Add configuration validation without secret values.
- Implement the database query, normalization, whole-result validation, sanitized warning, memoization, and atomic static fallback.
- Keep application pages on the static source initially.

### Checkpoint C — Page integration

- Convert the homepage.
- Convert `/shop`, `/phones`, and `/tablets`.
- Convert product-detail runtime lookups and related products.
- Convert metadata while retaining static route generation and fallback.

### Checkpoint D — Shared client integration

- Initialize one normalized catalog provider.
- Convert Global Search.
- Convert comparison and remove its independent static source.
- Convert cart, checkout, related client features, filters, sorting, and product cards.
- Regression-test browser persistence and hydration.

### Checkpoint E — Static-source retirement review

- Remove direct consumer imports only after complete parity passes.
- Decide whether the maintained static snapshot remains as an emergency fallback.
- Do not retire placeholder presentation data before the separate media phase.

No implementation checkpoint begins through this document.

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
