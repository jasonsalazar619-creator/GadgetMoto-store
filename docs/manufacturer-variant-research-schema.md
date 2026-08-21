# GadgetMoTo Manufacturer Variant Research Schema

## Status

Migration 20, `20260821214429_product_manufacturer_variant_research.sql`, was
manually deployed and verified. Local and remote migration history match at 20
synchronized migrations. The deployed migration is immutable; any future
schema correction must use a new timestamped migration.

The post-deployment research population added manufacturer evidence only. It
did not create or modify commercial variants, commercial colors, availability
rows, inventory, orders, credentials, or environment values.

## Three separate layers

### Manufacturer research

This layer records what an official manufacturer source confirms exists:
official colors, physical and extended RAM when published, storage capacities,
regional scope, verification status, and explicit color plus memory/storage
combinations. It contains no GadgetMoTo availability flag.

### Commercial product variants

`public.product_variants` and `public.product_color_variants` remain the
GadgetMoTo commercial layer. Commercial variants continue to require their
existing SKU, storage, price, and integrity rules. Migration 20 does not make
those fields nullable or weaken any uniqueness or price constraint.

Research variants and colors have nullable same-product mappings to commercial
records. A missing mapping means **Commercial setup incomplete**; it never
causes a fake SKU, price, SRP, or inventory quantity to be created.

### Variant color availability

Migration 19's `public.product_variant_color_options` remains the only source
of truth for whether GadgetMoTo currently offers an exact commercial variant
and color. Research combinations never create, update, or imply an availability
row, and every future import must default to no GadgetMoTo availability.

## Tables

### `product_manufacturer_sources`

Stores the primary evidence for a product research record: product, source
name, HTTPS URL, region, source type, research timestamp, verification status,
and optional notes. Region is constrained to `ph`, `sea`, `regional`, or
`global`. Verification is constrained to `verified`, `partial`, or
`needs_manual_verification`.

The supported source types follow the approved priority order:

- `manufacturer_product_page`
- `manufacturer_support_page`
- `manufacturer_newsroom`
- `manufacturer_specification_pdf`
- `authorized_retailer`

The same normalized URL cannot be added twice for one product.

### `product_manufacturer_variants`

Stores research-only physical RAM, optional extended RAM, storage, region,
verification status, source, ordering, and an optional commercial
`product_variant_id` mapping. Physical RAM may be null when the manufacturer
does not publish it; `physical_ram_not_published` distinguishes that verified
case from incomplete research.

Numeric storage makes `1TB` and `1024GB` the same capacity. A product cannot
have duplicate normalized memory/storage configurations in the same region.

### `product_manufacturer_colors`

Stores the official trimmed manufacturer color name, a generated lowercase
comparison name, optional strict `#RRGGBB` swatch, region, verification status,
source, ordering, and an optional commercial `product_color_variant_id`
mapping. Manufacturer capitalization is preserved while duplicate names that
differ only by case or outer whitespace are rejected per product and region.

### `product_manufacturer_combinations`

Stores an explicit manufacturer-supported relationship between one research
variant and one research color. Composite foreign keys ensure the source,
variant, and color all belong to the same product and region. The exact
product/variant/color/region relationship is unique, so the schema never
assumes a Cartesian product.

These rows answer only: **Does manufacturer evidence support this exact
combination?** They never answer: **Does GadgetMoTo have this available?**

## Foreign-key safety

- Product deletion cascades only its research-layer rows.
- Source deletion cascades the research rows whose evidence it owns.
- Research variant or color deletion cascades only dependent research
  combinations.
- Research deletion never deletes a commercial record, availability record,
  order, inventory record, or payment.
- Commercial mappings are nullable same-product composite foreign keys.
- Deleting a mapped commercial variant or color clears only the nullable
  mapping and preserves the research record.

## Security

RLS is enabled on all four tables. Table privileges are revoked from `public`,
`anon`, and `authenticated` before minimum administrator grants are restored.
Authenticated users receive table CRUD privileges, but each operation remains
subject to an RLS policy requiring the existing
`public.is_active_administrator()` authorization check.

No `anon`, public-browser, storefront-reader, order-service, or public Data API
access is granted. A future server read model must expose only the sanitized
fields needed by reviewed application code.

Migration 20 creates no new audit system or audit trigger. Future Admin actions
must reuse the existing `audit_logs` application workflow when research data is
modified.

## Index and constraint strategy

- Product plus normalized source URL is unique.
- Product, region, and normalized RAM/storage configuration is unique.
- Product, region, and normalized official color name is unique.
- Product, research variant, research color, and region is unique.
- Partial indexes support mapped commercial variant/color lookups.
- Verification-status indexes support Admin review queues.
- Existing composite product/variant and product/color keys from Migration 19
  enforce same-product commercial mappings.

No backfill or seed is included in the migration. The separately reviewed
research population recorded official sources, colors, memory/storage options,
and only explicitly confirmed exact combinations. Migration 19 availability
remained unchanged and no imported combination was enabled automatically.
