# GadgetMoTo Initial Catalog Data Import Plan

## Status and scope

This document records the reviewed data-import plan and deployment result. The approved migration `20260717205111_catalog_bootstrap_data.sql` is deployed. Post-deployment counts are 6 brands, 12 products, and 12 product variants; every other application table remains at zero rows. Product and variant records passed manual parity checks.

No product images, store locations, inventory, homepage, staff, commerce, alert, or audit data was inserted. The application still renders from static source data. Database-backed application integration remains a separate future phase, and the static catalog must not be removed until database query integration and storefront parity tests pass.

This checkpoint changes no frontend behavior, runs no database command, and creates no inventory, homepage, commerce, alert, or audit data.

## Canonical application source

The canonical product type and product array are in `src/data/prototype-products.ts` lines 1–43. The twelve entries are on lines 22–33. `getAllProducts()`, `getPhones()`, `getTablets()`, and `getProductBySlug()` all derive from that one array, so the array—not documentation summaries—is the current storefront catalog source.

Related rendering sources:

- `src/components/storefront/product-card.tsx` lines 21–43 renders brand, category, name, variant, current price, optional source `srp`, badge, financing copy, and a shared placeholder.
- `src/app/products/[slug]/page.tsx` lines 16–66 generates the twelve static routes and renders generic metadata, placeholder artwork, condition, sales-team availability wording, pricing, payment, delivery, and pickup copy.
- `src/components/storefront/device-placeholder.tsx` lines 1–20 and `src/app/globals.css` render generated CSS/device artwork rather than product image files.
- `src/components/storefront/storefront-footer.tsx` lines 14–32 and `src/components/storefront/delivery-options.tsx` lines 4–24 contain confirmed city, delivery, pickup, and brand-contact presentation.

The source contains exactly twelve products: eight phones and four tablets. All twelve slugs are unique. No product or tablet is duplicated.

## Verified product and variant inventory

Every current product has exactly one source variant. Prices below are copied from the source and converted by multiplying whole pesos by 100. The optional `srp` field is explicitly named in source, so values present in that field are confirmed as source-labeled SRP; a crossed-out presentation alone would not be sufficient.

| Source line | App ID / slug | Product | Brand | Category | Variant | RAM | Storage | Current price | Current centavos | Source SRP | SRP centavos | Badge | Financing |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 22 | `xiaomi-17-ultra` / `xiaomi-17-ultra-5g-leica-kit` | Xiaomi 17 Ultra 5G Leica Kit | Xiaomi | Phone | 16GB/512GB | 16GB | 512GB | ₱84,990 | 8,499,000 | ₱89,990 | 8,999,000 | sale | Available |
| 23 | `iphone-17` / `apple-iphone-17` | Apple iPhone 17 | Apple | Phone | 256GB | Missing | 256GB | ₱57,990 | 5,799,000 | Missing | `null` | new | Available |
| 24 | `poco-f8-ultra` / `poco-f8-ultra` | POCO F8 Ultra | POCO | Phone | 16GB/512GB | 16GB | 512GB | ₱46,990 | 4,699,000 | Missing | `null` | new | Available |
| 25 | `redmi-note-15-pro-plus` / `redmi-note-15-pro-plus-5g` | Redmi Note 15 Pro Plus 5G | Redmi | Phone | 12GB/512GB | 12GB | 512GB | ₱27,990 | 2,799,000 | ₱28,990 | 2,899,000 | sale | Available |
| 26 | `redmi-turbo-5` / `redmi-turbo-5` | Redmi Turbo 5 | Redmi | Phone | 12GB/256GB | 12GB | 256GB | ₱20,990 | 2,099,000 | ₱22,990 | 2,299,000 | sale | Available |
| 27 | `infinix-note-60-pro` / `infinix-note-60-pro-5g` | Infinix Note 60 Pro 5G | Infinix | Phone | 16GB/256GB | 16GB | 256GB | ₱19,990 | 1,999,000 | ₱20,990 | 2,099,000 | sale | Available |
| 28 | `tecno-camon-50` / `tecno-camon-50` | TECNO Camon 50 | TECNO | Phone | 16GB/256GB | 16GB | 256GB | ₱13,490 | 1,349,000 | ₱13,990 | 1,399,000 | sale | Available |
| 29 | `poco-c85` / `poco-c85` | POCO C85 | POCO | Phone | 8GB/256GB | 8GB | 256GB | ₱7,990 | 799,000 | ₱8,990 | 899,000 | sale | Available |
| 30 | `poco-pad-x1` / `poco-pad-x1` | POCO Pad X1 | POCO | Tablet | 8GB/512GB | 8GB | 512GB | ₱23,990 | 2,399,000 | ₱24,990 | 2,499,000 | sale | Available |
| 31 | `xiaomi-pad-8` / `xiaomi-pad-8` | Xiaomi Pad 8 | Xiaomi | Tablet | 8GB/128GB | 8GB | 128GB | ₱19,990 | 1,999,000 | ₱20,990 | 2,099,000 | sale | Available |
| 32 | `redmi-pad-2-pro` / `redmi-pad-2-pro-5g` | Redmi Pad 2 Pro 5G | Redmi | Tablet | 8GB/256GB | 8GB | 256GB | ₱18,990 | 1,899,000 | ₱19,990 | 1,999,000 | sale | Available |
| 33 | `tecno-mega-pad-pro` / `tecno-mega-pad-pro` | TECNO Mega Pad Pro | TECNO | Tablet | 8GB/256GB | 8GB | 256GB | ₱13,990 | 1,399,000 | ₱14,990 | 1,499,000 | sale | Available |

All entries explicitly use `condition: "Brand New"`, `financingAvailable: true`, and the display message “Financing options available.” The current source does not contain SKU values.

## Source-of-truth transition

### Before application integration

- Application source remains the active storefront source.
- Database catalog records are deployed and manually verified.
- No frontend behavior changes.

### Current validation state

- The approved timestamped bootstrap migration is deployed.
- The application continues rendering static data.
- Database records passed manual field-by-field comparison against the static source.
- No public Data API access will be enabled.

### After integration

- PostgreSQL becomes authoritative for catalog records.
- Static product data may be removed only after parity and route tests pass.
- Operational changes should eventually use a protected staff/admin workflow rather than repeated source-code edits.

## Database mapping

### `public.brands`

The source contains six unique brands with consistent capitalization:

| Name | Safely derived slug | Products | Source lines | Remaining fields |
| --- | --- | ---: | --- | --- |
| Xiaomi | `xiaomi` | 2 | 22, 31 | Description remains null; active; sort order 0 |
| Apple | `apple` | 1 | 23 | Description remains null; active; sort order 1 |
| POCO | `poco` | 3 | 24, 29, 30 | Description remains null; active; sort order 2 |
| Redmi | `redmi` | 3 | 25, 26, 32 | Description remains null; active; sort order 3 |
| Infinix | `infinix` | 1 | 27 | Description remains null; active; sort order 4 |
| TECNO | `tecno` | 2 | 28, 33 | Description remains null; active; sort order 5 |

Brand slugs are safe lowercase derivations of confirmed names. No real brand descriptions exist in source. The approved brand sort order follows first appearance in the canonical array. One record per unique brand is required.

### `public.products`

- `brand_id`: link to the unique brand record; relationship is confirmed by each source row.
- `name` and `slug`: confirmed directly in source.
- `category`: safely map `Phone -> phone` and `Tablet -> tablet` to the existing enum.
- `short_description`: missing. The product route creates generic metadata from name and variant; this is not stored product-specific description data.
- `status`: missing. The generic “Confirm with our sales team” availability text is not a database product status.
- `is_featured`: ambiguous/missing. Homepage arrays group phones as new arrivals and tablets as featured tablets, but this does not safely prove every database product should be featured.
- `published_at`: missing. No publication timestamp may be invented.

The source `id` is an application identifier and has no direct database column. It should be retained in review notes only; database IDs require the separate deterministic-reference decision.

### `public.product_variants`

- `product_id`: link to the product identified by its confirmed slug.
- `sku`: absent from the original application source; the twelve approved unique GadgetMoTo internal SKUs are recorded in `docs/catalog-bootstrap-decisions.md` and the local migration.
- `variant_name`: confirmed from source `variant`.
- `ram_gb`: confirmed for eleven entries; Apple iPhone 17 remains `null` because RAM is absent.
- `storage_gb`: confirmed for all entries.
- `condition`: safely map source `Brand New -> brand_new`.
- `current_price_centavos`: safely derived and mechanically verified in the product table above.
- `srp_centavos`: confirmed where the source explicitly contains `srp`; `null` for Apple iPhone 17 and POCO F8 Ultra.
- `badge`: confirmed source values `new` or `sale`.
- `financing_available`: confirmed `true` for all twelve.
- `is_active`: approved as `true` for all twelve launch-visible variants.
- `sort_order`: approved as `0` because there is one imported variant per product. `public.products` has no product sort-order column, so none is invented.

The expected initial variant count is twelve, one per product.

### `public.product_images`

No product uses a real local product image, remote product URL, or stable public product asset path. `DevicePlaceholder` generates shared markup styled by CSS. `artSeed` values exist in the product source, but they only contribute a detail-page CSS class; they are not media records or Storage paths. The product page explicitly labels the gallery as abstract placeholder artwork.

`product_images` must remain empty during the first data import. Existing placeholder rendering remains temporarily. Supabase Storage paths and alt text must not be invented.

### `public.store_locations`

Confirmed storefront facts:

- City: Cavite City.
- Brand/storefront name: GadgetMoTo is the public brand, but no official branch-specific location name is supplied.
- Pickup wording: “Store Pickup in Cavite City”; exact location and schedule are confirmed later by the sales team.
- Delivery wording: nationwide delivery is available; same-day delivery is available where confirmed by the sales team.

No street address, official location/branch name, province field for the record, pickup schedule, directions, or branch-specific contact details are confirmed. The global Facebook Messenger contact is not a substitute for missing location fields. Because `store_locations.name`, `city`, and `province` are required, store-location insertion should be deferred until official details are approved.

## Field-level data-quality review

The classifications below apply to every row without silently resolving business data.

| Product | Confirmed | Derived safely | Missing / ambiguous / placeholder |
| --- | --- | --- | --- |
| Xiaomi 17 Ultra 5G Leica Kit | ID, slug, name, brand, Phone, 16GB/512GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |
| Apple iPhone 17 | ID, slug, name, brand, Phone, 256GB storage, current price, new, financing, brand-new condition | Phone enum; centavos; nullable RAM/SRP | SKU, RAM, SRP, description, status, featured, publication, active/sort; placeholder art |
| POCO F8 Ultra | ID, slug, name, brand, Phone, 16GB/512GB, current price, new, financing, brand-new condition | Enum casing; centavos; nullable SRP | SKU, SRP, description, status, featured, publication, active/sort; placeholder art |
| Redmi Note 15 Pro Plus 5G | ID, slug, name, brand, Phone, 12GB/512GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |
| Redmi Turbo 5 | ID, slug, name, brand, Phone, 12GB/256GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |
| Infinix Note 60 Pro 5G | ID, slug, name, brand, Phone, 16GB/256GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |
| TECNO Camon 50 | ID, slug, name, brand, Phone, 16GB/256GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |
| POCO C85 | ID, slug, name, brand, Phone, 8GB/256GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |
| POCO Pad X1 | ID, slug, name, brand, Tablet, 8GB/512GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |
| Xiaomi Pad 8 | ID, slug, name, brand, Tablet, 8GB/128GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |
| Redmi Pad 2 Pro 5G | ID, slug, name, brand, Tablet, 8GB/256GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |
| TECNO Mega Pad Pro | ID, slug, name, brand, Tablet, 8GB/256GB, prices/SRP, sale, financing, brand-new condition | Enum casing; centavos | SKU, description, status, featured, publication, active/sort; placeholder art |

No duplicate product, inconsistent brand capitalization, inconsistent source price formatting, unsupported category, or ambiguous storage value was found. The source categories map to existing supported enum values. Product status, featured status, shared publication timestamp, variant active state, and sort order are approved in `docs/catalog-bootstrap-decisions.md`.

## Data exclusions

### Inventory

The initial catalog import must create no `inventory_levels` or `inventory_movements` rows, stock quantities, reorder levels, or fake availability numbers. Inventory remains unknown until staff provide verified quantities. The storefront may keep only its approved non-quantity “Confirm with our sales team” availability wording until inventory integration is reviewed.

### Homepage

The initial import must create no `homepage_sections` or `homepage_section_products` rows. Homepage composition remains in application source until supported section keys, JSON structures, and publishing workflows are approved.

### Complete first-import exclusion list

The first bootstrap is limited to approved `brands`, `products`, and `product_variants`. It must exclude:

- `product_images`
- `store_locations`
- `inventory_levels`
- `inventory_movements`
- `homepage_sections`
- `homepage_section_products`
- `staff_profiles`
- `orders`
- `order_addresses`
- `order_items`
- `order_fulfillments`
- `payments`
- `payment_events`
- `price_alert_subscriptions`
- `audit_logs`

It must insert no fake stock or availability quantity, store address, media path, homepage data, commerce record, or other operational record.

## Import mechanism comparison

### Option A — development seed file

A seed file is useful for disposable, repeatable local development data. It must not automatically become the production catalog workflow, and no `supabase/seed.sql` is created here.

### Option B — versioned bootstrap data migration

A new timestamped migration containing only reviewed deterministic catalog inserts is reviewable in Git, reproducible, applied once through migration history, appropriate for the fixed initial catalog, and preserves deployed schema migrations. Its risks are that incorrect data needs a new corrective migration and ongoing catalog changes should not become permanent migrations forever.

### Option C — protected administrative importer

A trusted server-side or staff-only importer is better for ongoing catalog operations and can validate records and report errors. It currently lacks the required authentication, authorization, application integration, and auditing.

### Recommendation

The reviewed versioned bootstrap data migration established the initial confirmed catalog. Future operational updates should use protected staff/admin workflows or a new timestamped corrective migration; the deployed migration must not be edited in place.

## Deterministic reference strategy

Options considered:

1. Explicit reviewed UUIDs stored in the bootstrap migration.
2. Brand/product inserts linked through unique slugs using SQL CTEs and returned IDs.
3. Explicit product UUIDs combined with slug lookups.

The migration uses explicit, pre-reviewed UUIDs for brands, products, and variants, with human-readable slugs and SKUs adjacent in the reviewed data. This makes every relationship explicit, avoids a missing lookup silently producing no child insert, and lets foreign keys fail clearly. The final mapping is recorded in `docs/catalog-bootstrap-decisions.md`.

The eventual import must reject duplicate brand names/slugs, product slugs, and case-insensitive SKUs; preserve every product-to-brand and variant-to-product relationship; and fail rather than attach a child to an incorrect record.

## Future import validation checklist

- Expected brand count is six.
- Exactly twelve unique products and twelve variants exist.
- No duplicate brand slugs, product slugs, or SKUs exist.
- Every product references the correct brand.
- Every variant references the correct product.
- Database prices and explicit SRPs exactly match the approved static values.
- Every peso-to-centavo conversion matches the table above.
- No product image rows exist until stable assets are approved.
- No store location row exists until required official details are confirmed.
- No inventory, homepage, commerce, alert, or audit rows exist.
- No public API access exists.
- The existing storefront renders unchanged from static data during validation.
- Lint and production build pass.

## Decisions deferred beyond the bootstrap

- Official store-location name, province, address, instructions, and schedule if a location will be included later.
- Stable product media and alt text if images will be imported later.

## Decision-matrix status

Bootstrap decisions are approved and documented in `docs/catalog-bootstrap-decisions.md`. Migration `20260717205111_catalog_bootstrap_data.sql` is deployed with verified counts of 6 brands, 12 products, and 12 variants; every other application table remains empty. Product and variant records passed manual parity checks. Static application data remains the live storefront source until database query integration and storefront parity tests pass.
