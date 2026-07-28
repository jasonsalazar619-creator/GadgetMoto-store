# GadgetMoTo Catalog Database Integration Plan

## Status and boundaries

This document remains the architecture plan for database-backed catalog loading. The ordering and secure storefront read model are deployed, and the minimum server-only database dependency, client, query, validation, normalization, and fallback code are implemented. Controlled local connectivity and adapter verification are complete, and storefront integration covers the homepage catalog sections, `/shop`, `/phones`, `/tablets`, all 12 product-detail routes, global search, comparison, cart, and the review-only checkout summary. No environment file, policy, production configuration, or deployment configuration has been added.

Final implementation decisions are approved and documented in `docs/catalog-integration-decisions.md`. Migration `20260717234135_catalog_ordering_storefront_read_model.sql` is deployed. Post-deployment checks confirmed the approved product order, view structure, 12 view rows, catalog parity, and restricted reader-role properties. Postgres.js `3.4.9` and the isolated server adapter are implemented. Controlled static and database source-mode tests passed, including hosted-view querying, complete validation, normalization, and ordering parity. Server routes resolve the normalized catalog through the request-memoized boundary, while one root server payload initializes the read-only client catalog provider used by search, comparison, and cart. Static catalog data remains the active source and full fallback.

The server-only `gadgetmoto_storefront_app` login role authenticated successfully during controlled local verification. It inherits only the dedicated `gadgetmoto_storefront_reader` permission bundle, and manual verification confirmed its effective schema `USAGE` and storefront-view `SELECT` access while direct access to the tested base and private tables remains unavailable. Querying, complete-result validation, normalization, sanitized errors, and atomic fallback behavior are verified. Product routes, global search, comparison, cart, and checkout are integrated; checkout consumes resolved cart state and remains contact-first while online submission is disabled. Production database configuration and controlled live-order activation remain pending.

The server catalog adapter is the application read boundary. Under the current default configuration it returns the canonical static data from `src/data/prototype-products.ts`; PostgreSQL contains a manually verified parity copy of 6 brands, 12 products, and 12 product variants for a later production rollout. The static snapshot remains the complete fallback, build-safe route-slug source, and placeholder-presentation source.

Current security constraints remain unchanged:

- Row Level Security is enabled.
- No RLS policy exists.
- Data API access is disabled.
- No public read or write path exists.
- No privileged credential may enter a browser bundle.
- Commerce, staff, subscriber, audit, and other operational tables must remain inaccessible to catalog clients.

## Current static catalog model

The exact source is `src/data/prototype-products.ts`. It exports:

- `ProductCategory`: `"Phone" | "Tablet"`.
- `PrototypeProduct`: the current application-facing product shape.
- `getAllProducts()`: all 12 products in canonical storefront order.
- `getPhones()`: the eight phones, preserving source order.
- `getTablets()`: the four tablets, preserving source order.
- `getProductBySlug()`: a synchronous slug lookup.
- `formatProductTitle()`: product metadata title formatting.
- `newArrivalProducts`: currently every phone.
- `featuredTablets`: currently every tablet.

`PrototypeProduct` is a flattened one-product/one-variant model:

| Field | Current meaning |
| --- | --- |
| `id` | Legacy application identifier used as a React key; not persisted by cart or comparison |
| `slug` | Stable route and browser-state product identifier |
| `brand`, `name`, `category` | Display and filtering values |
| `variant` | The single current variant label |
| `currentPrice`, optional `srp` | Whole-peso numbers used by display, filters, cart totals, comparison, and checkout |
| optional `ramGb`, `storageGb` | Confirmed memory/storage values |
| `condition` | Fixed current label `Brand New` |
| optional `badge` | `new` or `sale` |
| `financingMessage`, `financingAvailable` | Confirmed storefront financing presentation |
| `artSeed` | Static placeholder-art selector; not a media record |

The database model is normalized and may later support multiple variants. The application model is not changed in this checkpoint.

## Consumer inventory and data flow

### Direct consumers

| Consumer | Classification | Current use and integration risk |
| --- | --- | --- |
| `src/app/layout.tsx` | Server, runtime/build render boundary | Calls request-memoized `getCatalogProducts()` once and serializes the normalized array into the shared `CatalogProvider`. Static default mode and atomic fallback protect builds and routes. |
| `src/app/page.tsx` | Server, build/runtime render | Calls `getCatalogProducts()` once and preserves the existing all-phones New Arrivals and all-tablets Featured Tablets grouping; it is not driven by `products.is_featured`. |
| `src/app/shop/page.tsx` | Server feeding a client feature | Passes all products to `CatalogPage`/`CatalogExplorer`. |
| `src/app/phones/page.tsx` | Server feeding a client feature | Assumes and describes exactly eight phones. |
| `src/app/tablets/page.tsx` | Server feeding a client feature | Assumes and describes exactly four tablets. |
| `src/app/products/[slug]/page.tsx` | Build-time and server runtime | Retains static slugs in `generateStaticParams`, resolves metadata and page products through the exact-slug server boundary, preserves `notFound()` for misses, and uses the complete request-memoized catalog for up to four ordered related products. |
| `src/components/storefront/catalog-page.tsx` | Shared server-to-client boundary | Accepts a serializable product array and passes it into the client explorer. |
| `src/components/storefront/catalog-explorer.tsx` | Client-only runtime | Searches, filters, counts, and sorts the supplied array. “Featured” sort means original array order via `products.indexOf()`. |
| `src/components/storefront/product-card.tsx` | Shared | Used by Server Components and imported into the client explorer. Reads most display fields and passes slugs to comparison controls. |
| `src/components/search/global-search.tsx` | Client-only runtime | Consumes the shared catalog provider, scores name/brand/variant/category, preserves input order for equal scores, and limits visible suggestions to six. |
| `src/components/search/search-result-item.tsx` | Client-only runtime | Renders product name, variant, badge, route, placeholder, and current price. |
| `src/components/comparison/comparison-provider.tsx` | Client-only and persistent browser state | Resolves valid and selected slugs through the shared catalog provider and stores only up to three slugs under `gadgetmoto:compare:v1`. |
| Comparison page, tray, buttons, and header count | Client-only runtime | Consume resolved comparison products. The header badge counts selections, not catalog products. |
| `src/components/cart/cart-provider.tsx` | Client-only and persistent browser state | Resolves products through the shared catalog provider. It stores only product slug, exact variant label, and quantity under `gadgetmoto:cart:v1`; names and prices come from the current normalized payload. |
| Cart drawer, cart page, and cart line | Client-only runtime | Render current normalized product names/prices and derive line totals and subtotal. They do not persist copied names or prices. |
| `src/components/checkout/checkout-form.tsx` | Client-only runtime | Uses catalog-resolved cart items, current line totals, and current subtotal. Checkout review copies values only into rendered session state; it does not persist or submit customer details, an order, or a payment. |
| `src/components/storefront/device-placeholder.tsx` | Shared | Uses only category and CSS; database media is not required. |

### Indirect and adjacent assumptions

- `/shop`, `/phones`, `/tablets`, product metadata copy, and `docs/catalog-foundation.md` explicitly describe 12, eight, and four products.
- `generateStaticParams()` currently guarantees 12 product routes without network access.
- Related products rely on canonical array order before `slice(0, 4)`.
- Catalog default sorting and search tie-breaking depend on input order.
- React keys currently use the legacy application `id`; browser persistence uses product slugs instead.
- Cart line identity combines product slug with the exact variant label. It does not yet use variant UUID or SKU.
- Comparison persistence stores slugs only and sanitizes them against a static module-level set.
- `BrandGrid` is a separate hard-coded presentation list of 12 brand names, including brands outside the six-product catalog brands. It is not a database consumer and must not silently be replaced during catalog integration.
- No application test files currently cover catalog loading or fallback.

## Database-to-application mapping

The first adapter should return a serializable normalized catalog product compatible with current consumers while retaining database identifiers for future work.

| Database source | Application field or treatment |
| --- | --- |
| `products.id` | Retain as `productId` UUID. It may become the React key, but must not replace public slugs in persisted state without a migration plan. |
| `products.slug` | `slug`; remains the stable route and comparison identifier. |
| `products.name` | `name` unchanged. |
| `products.category` | Map `phone -> Phone`, `tablet -> Tablet`; reject unsupported values. |
| `products.short_description` | Retain as nullable metadata for future use; current product display does not require it. |
| `products.status` | Retain and require `active` for storefront inclusion. |
| `products.is_featured` | Retain as `isFeatured`; do not use it to reproduce current homepage tablet grouping because all bootstrap products are false. |
| `products.published_at` | Parse as a valid timestamp; require non-null and not in the future. |
| `products.brand_id` + `brands.id` | Validate the relationship and retain `brandId`. |
| `brands.name` | `brand` unchanged. |
| `brands.slug` | Retain as `brandSlug` for future filters/routes. |
| `brands.is_active` | Require true for storefront inclusion. |
| `product_variants.id` | Retain as `variantId` UUID. |
| `product_variants.sku` | Retain as the approved internal `sku`; unique and nonblank. |
| `product_variants.variant_name` | `variant` unchanged. |
| `product_variants.ram_gb` | `ramGb`; map SQL null to absent/undefined at the current compatibility edge. Do not invent Apple RAM. |
| `product_variants.storage_gb` | `storageGb`; required and positive. |
| `product_variants.condition` | Map `brand_new -> Brand New`; reject unsupported launch values instead of inventing labels. |
| `current_price_centavos` | Validate as a nonnegative safe integer, then divide by 100 only at the compatibility boundary for current peso-based UI. A future model should prefer centavos internally. |
| `srp_centavos` | Validate null or a nonnegative safe integer; map null to absent/undefined and otherwise divide by 100 at the compatibility boundary. |
| `badge` | Map `new` and `sale` directly; null becomes absent. Reject unsupported values. |
| `financing_available` | `financingAvailable`; derive the existing fixed financing message only when true. Do not invent provider terms. |
| `product_variants.is_active` | Require true for storefront inclusion. |
| `product_variants.sort_order` | Variant-local ordering only; it cannot order products globally. |

The current bootstrap has one active variant per product. The first adapter may flatten that reviewed variant, but it must fail validation if a product has zero active variants or an ambiguous set that the current single-variant UI cannot represent.

The legacy source `id` and `artSeed` do not exist in PostgreSQL. During parity integration, resolve both from a static slug-indexed presentation map. Database UUIDs remain available separately. This preserves existing visuals without pretending CSS seeds are database data.

## Product-ordering gap

`public.products` has no global catalog-order field. Brand `sort_order` orders brands, and variant `sort_order` orders variants within one product. PostgreSQL row order is undefined without `ORDER BY`, and deterministic bootstrap UUID sequence must not become permanent merchandising behavior.

| Option | Result |
| --- | --- |
| Add nonnegative `products.sort_order` in a new migration | Reproduces and later manages global catalog order explicitly. Requires reviewed backfill, constraint/index decisions, and a new immutable migration. |
| Temporarily preserve a static slug-order list | Safest parity bridge because current behavior remains exact, but it duplicates ordering and is not suitable as the permanent source. |
| Use curated placement tables | Appropriate for homepage sections, but does not define the full `/shop` default order unless expanded beyond its intended purpose. |
| Sort alphabetically or by price | Deterministic but breaks approved storefront parity and related-product ordering. |

Recommendation: approve a new nonnegative `products.sort_order` column as the long-term global catalog order, backfilled 0 through 11 in approved source order and queried with a stable slug tie-breaker. During the parity phase, use the static slug-order list and reject/fallback when database slugs do not match the reviewed set. Homepage curation can later use `homepage_section_products` independently.

No ordering migration is created in this checkpoint.

## Database-access architecture comparison

### Option A — Data API with narrow public read policies

- Security boundary: anonymous access would depend on exact SELECT grants and RLS policies for active brands, active/published products, and active variants.
- Simplicity: easy Supabase client queries, including browser use, after configuration.
- Risk: enabling an exposed schema that also contains commerce, staff, subscriber, and audit tables increases review surface. RLS mistakes or excess column grants could disclose unintended data.
- Compatibility: works for server and client features, but direct browser access is unnecessary because one server-loaded payload can feed current clients.
- Writes must remain unavailable, and a service-role credential must never appear in browser code.

### Option B — Safe storefront view or dedicated exposed schema

- Security boundary: expose a narrow read model containing only reviewed public catalog columns, not operational tables or internal-only columns.
- Advantages: smallest Data API surface and a stable join/normalization contract.
- Complexity: requires a new migration for the view/schema and grants, correct invoker/security behavior, reviewed RLS interaction, and Data API exposed-schema configuration.
- Compatibility: works with Supabase clients and can be queried server-side or by a low-privilege browser client, though this plan still recommends server-side loading.

### Option C — Server-only direct PostgreSQL access

- Security boundary: query from server-only modules through a dedicated read-only database role limited to the approved catalog read model. Do not use an owner, postgres, or broadly privileged role.
- Advantages: Data API can remain disabled; browser clients never access the database; only normalized serializable fields cross the Server/Client boundary.
- Requirements: a server-only PostgreSQL dependency, pooled hosting-compatible connection configuration, query timeouts, and deployment/runtime secret management.
- Serverless considerations: use the supported pooler and bounded connections; do not open unbounded per-request connections.
- Client features: search, comparison, cart, and checkout receive the normalized payload from a Server Component and need no database credential.

### Option D — Server-only trusted Data API access

- Security boundary: credentials remain server-only, but Data API schema exposure is still required.
- Risk: a broad service-role credential bypasses RLS and is excessive for catalog reads. If selected, use a dedicated low-privilege credential/read model and never forward raw responses or errors.
- Runtime: avoids direct PostgreSQL pooling but introduces HTTP availability, Data API configuration, and explicit caching/error handling.

### Recommendation

Primary architecture: Option C, server-only direct PostgreSQL access through a dedicated least-privilege read-only role and pooled connection. It preserves the currently disabled Data API, creates no public write path, and prevents application clients from accessing private tables.

Architectural fallback: Option B, a dedicated storefront read model in a narrowly exposed schema, queried server-side with a low-privilege Data API client if direct PostgreSQL pooling is unsuitable for the selected host. It must not expose the full `public` schema or use service-role credentials for ordinary reads.

The operational fallback for either architecture is the verified static catalog.

## Catalog loading boundary and fallback

The server-only boundary is implemented at `src/lib/catalog/server/catalog.ts` with `getCatalogProducts()` and `getCatalogProductBySlug(slug)`. Product lookup resolves from the complete catalog and never issues a slug-specific query. `getCatalogProducts()` uses React's request-scoped cache so metadata, page rendering, and related-product selection share one normalized catalog snapshot within a request. No result, fallback, source-mode decision, or raw error is persisted across requests or deployments.

Defined source modes:

- `static`: always return the current static catalog.
- `database`: require valid database configuration and valid database results; fail visibly in controlled development/operations contexts.
- `database-with-static-fallback`: prefer validated database data and return the static catalog on any integration failure.

Expected `database-with-static-fallback` behavior:

1. Load only approved public catalog fields on the server.
2. Validate the complete relational result before returning any product.
3. Preserve stable slugs and keep database product/variant identifiers alongside them.
4. Fall back when integration is disabled, required configuration is absent, the query fails or times out, data is malformed, relationships are missing, single-variant assumptions fail, or reviewed parity/order constraints fail.
5. Emit a sanitized server-side warning with a reason code and source mode. Never log credentials, raw connection details, or sensitive database errors.
6. Never expose raw errors or fallback diagnostics to users.
7. Preserve the exact current storefront behavior, ordering, routes, and placeholder art during fallback.

Approved environment-variable names, without values:

- `CATALOG_SOURCE`
- `STOREFRONT_DATABASE_URL`

These are server-only names. `CATALOG_SOURCE` defaults to `static`, and database configuration is not required in that mode. `STOREFRONT_DATABASE_URL` is required only when database access is requested. Secrets must not use a `NEXT_PUBLIC_` prefix. No environment value or environment file exists.

Next.js 16 considerations from the installed documentation:

- Pages and layouts are Server Components by default and may query near the data source.
- Data passed into Client Components must be serializable.
- Database credentials and query modules must stay outside the client module graph.
- Uncached requests are not cached by default and can block rendering; cache lifetime and invalidation require an explicit future decision.
- `generateStaticParams()` runs during `next build`, before product pages render, so it must not depend solely on a live database during parity rollout.

## Validation policy

Validate the entire database result before it becomes application data:

- Referenced brand exists and is active.
- Product is active, published, and `published_at` is a valid timestamp not in the future.
- At least one supported active variant exists; the first compatibility phase requires exactly one unambiguous active variant per product.
- Product slug and SKU are nonblank, correctly shaped, and unique in the complete result.
- Current price is a nonnegative safe integer in centavos.
- SRP is null or a nonnegative safe integer and is not below current price.
- RAM is null or an integer greater than zero; storage is an integer greater than zero.
- Category is `phone` or `tablet`.
- Condition is a supported launch condition; the current UI supports `brand_new` only.
- Badge is null, `new`, or `sale`.
- Product-to-brand and variant-to-product relationships are valid and unique.
- No duplicate product slug, SKU, product UUID, or variant UUID exists.
- Current parity mode receives the expected 12 slugs and can apply the approved order.
- Centavo values are safely convertible for the current peso-based compatibility model.

Recommended deterministic policy: treat the catalog as one atomic read model. Any invalid record, duplicate, broken relationship, unsupported multi-variant result, or parity mismatch invalidates the entire database result. In `database-with-static-fallback`, log a sanitized server warning and use all static products; never mix database and static rows. In strict `database` mode, surface a controlled server error. Development may include richer non-secret diagnostics, but production users receive neither raw database errors nor partial catalogs.

## Route generation and product pages

Transitional strategy:

1. Keep the 12 static slugs in `generateStaticParams()` during parity integration. Builds remain independent of database credentials and uptime.
2. Load product details by slug through `getCatalogProductBySlug()` during page and metadata rendering.
3. Prefer the validated database product when enabled; fall back to the matching static product.
4. Call `notFound()` only when neither validated database data nor static fallback contains the slug.
5. Keep related-product selection on the normalized catalog with approved stable order.
6. Do not remove an existing static route merely because the database is temporarily unavailable.
7. Do not introduce database-only product slugs until dynamic route behavior, cache invalidation, sitemap/metadata behavior, and deployment expectations are separately approved.

The installed Next.js 16 API confirms that `generateStaticParams()` runs at build time and is not rerun during ISR. The current promised `params` pattern remains valid. No route behavior changes now.

## Client feature compatibility

Recommended phased data flow:

1. A Server Component obtains one validated normalized catalog through `getCatalogProducts()`.
2. A read-only `CatalogProvider` or provider-composition boundary receives that serializable payload once.
3. Search, comparison, and cart resolve products from the same payload. Comparison must stop importing the static module independently.
4. Server-rendered pages use the same adapter boundary rather than maintaining a second database query shape.
5. Checkout continues consuming resolved cart items; it never trusts names or prices copied from localStorage.

Persisted-state compatibility:

- Keep product slugs stable so `gadgetmoto:compare:v1` remains valid.
- Keep current slug-plus-variant cart lines valid while there is one reviewed variant per product.
- Sanitize persisted selections against the normalized payload after hydration, exactly once.
- Do not persist product names or prices. Resolve them from the current validated catalog so price changes cannot leave stale client copies.
- A later multi-variant phase should version cart storage and migrate line identity to variant UUID or approved SKU; do not overload the current variant label silently.
- When database mode falls back to static, the same slugs and variant labels preserve cart and comparison state.

Approach comparison:

- Passing products independently to every provider is simple but risks divergent payloads.
- One read-only `CatalogProvider` initialized by the server gives every client feature one source and is the recommended target.
- Keeping separate static imports is acceptable only during a short, explicitly tracked migration phase.
- A public catalog endpoint adds another cache/security surface and is unnecessary for the initial server-loaded payload; consider it only for later client refresh requirements.

## Imagery strategy

`public.product_images` remains empty. Keep `DevicePlaceholder` and the current generated CSS artwork. During parity integration, resolve the existing `artSeed` from a static slug-indexed presentation map, with a category-based placeholder as a safe default. Do not create fake storage paths, do not block catalog loading on images, and do not treat `artSeed` as database content.

Product media should be a later independent import and application checkpoint with verified assets, storage paths, alt text, ordering, optimization, and fallback behavior. Keeping placeholders now prevents visual regressions while the data source changes.

## Proposed implementation phases

### Phase 1 — Access and ordering readiness

- Approve the primary/fallback access architecture and hosting constraints.
- Resolve global product ordering through a new reviewed migration or explicitly approve the temporary slug-order bridge.
- Create only the minimum read role/view/schema and SELECT privileges needed by the chosen architecture.
- Keep all writes, private tables, and public browser access unavailable.

### Phase 2 — Server catalog adapter

- Add only the dependency required by the approved architecture.
- Add server-only configuration validation and source modes.
- Query, normalize, validate, memoize, and sanitize errors.
- Preserve atomic static fallback.

### Phase 3 — Catalog-page integration

- Homepage, `/shop`, `/phones`, `/tablets`, metadata, product-detail lookups, and related products now use the server catalog boundary.
- The 12 canonical static slugs remain the source of `generateStaticParams()` for build safety.
- Static-mode builds preserve data, order, routes, metadata, related products, and visuals.

### Phase 4 — Shared client features

- The root Server Component initializes one read-only catalog payload for search, comparison, and cart.
- Comparison's independent static product source is removed.
- Existing persisted-state hydration, search ranking, selection limits, quantities, current-price resolution, and totals are preserved.

### Phase 5 — Static-source retirement

- Remove static product records only after every parity criterion passes in production-like validation.
- Retain a controlled emergency fallback only if separately approved and operationally maintained.
- Keep placeholder-presentation data until the independent media phase is complete.

Phases 1 through 4 are implemented and validated in static default mode. Phase 5 remains deferred until production-like rollout verification and an explicit fallback-retirement decision.

## Parity acceptance criteria

- Exactly 12 visible products and the same six catalog brands.
- Exact approved global product order.
- Same eight-phone/four-tablet categorization.
- Same names, slugs, RAM, storage, current prices, SRPs, savings, badges, and financing messaging.
- Same 12 product routes, metadata behavior, not-found behavior, and related-product results.
- Same homepage groups, catalog filters, price sorting, global-search results, and six-result limit.
- Same comparison selections, three-product limit, persistence, tray, and header count.
- Same cart line identity, quantities, current prices, subtotal, drawer, persistence, and checkout summary.
- Same placeholder visuals and no invented product-image data.
- Static fallback works when integration configuration is absent.
- Static fallback works when database reads fail, time out, or return invalid relationships.
- No browser credential exposure and no raw database error exposure.
- No public write capability.
- No catalog client access to commerce, staff, subscriber, audit, inventory-quantity, or payment tables.
- Lint and production build pass.

## Remaining decisions

- Cache lifetime, invalidation trigger, timeout, retry, and observability policy.
- Production source mode, secure environment configuration, and rollout verification.
- Whether the future canonical application model keeps centavos internally or initially uses the compatibility peso fields.
- Timeline for versioning cart persistence from variant label to variant UUID/SKU.
- Handling of future database-only product slugs and dynamic route generation.
- Whether the independent hard-coded homepage brand grid remains editorial or later becomes catalog-driven.
- Criteria and ownership for retiring or maintaining the emergency static fallback.

## Final integration result

The homepage, `/shop`, `/phones`, `/tablets`, all 12 build-safe product routes, metadata, related products, global search, comparison, cart, and checkout summary now consume the server catalog boundary or its single typed client payload. Existing ordering, filters, search ranking, persistence keys, comparison limits, cart quantities and totals, empty states, placeholder artwork, and checkout validation remain intact.

The direct static-import audit found only approved uses: server fallback and parity validation, canonical `generateStaticParams()` slugs, metadata title formatting, and type-only application-model imports. No Client Component imports a server-only module, no browser code receives database configuration or diagnostics, and no public catalog API route exists.
