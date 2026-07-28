# GadgetMoTo Catalog Bootstrap Decision Matrix

## Status

The user approved all catalog-bootstrap decisions. Migration version `20260717205111` deployed successfully, local and remote migration histories match, and the catalog bootstrap was manually verified. This document records the approved deployed values; it is not executable SQL.

Approved decisions include the exact twelve internal SKUs, null iPhone RAM, null SRPs for Apple iPhone 17 and POCO F8 Ultra, active brands/products/variants, non-featured products, variant sort order 0, first-appearance brand ordering, one shared migration-derived UTC publication timestamp, and exclusion of every non-catalog-bootstrap table.

The matrix below remains the immutable historical record of the deployed
bootstrap. A later approved correction treats the two `16` SKU segments for
Infinix Note 60 Pro 5G and TECNO Camon 50 as opaque identifier text, not
physical-RAM values. Forward-only migration
`20260726175847_correct_product_physical_ram.sql` changed those two rows to
8GB physical RAM and the variant label
`8GB RAM + 8GB Extended / 256GB`; it is deployed and synchronized.

## Explicit UUID mapping

| Brand | Brand UUID | Sort order |
| --- | --- | ---: |
| Xiaomi | `10000000-0000-4000-8000-000000000001` | 0 |
| Apple | `10000000-0000-4000-8000-000000000002` | 1 |
| POCO | `10000000-0000-4000-8000-000000000003` | 2 |
| Redmi | `10000000-0000-4000-8000-000000000004` | 3 |
| Infinix | `10000000-0000-4000-8000-000000000005` | 4 |
| TECNO | `10000000-0000-4000-8000-000000000006` | 5 |

| Source position | Product | Product UUID | Variant UUID |
| ---: | --- | --- | --- |
| 1 | Xiaomi 17 Ultra 5G Leica Kit | `20000000-0000-4000-8000-000000000001` | `30000000-0000-4000-8000-000000000001` |
| 2 | Apple iPhone 17 | `20000000-0000-4000-8000-000000000002` | `30000000-0000-4000-8000-000000000002` |
| 3 | POCO F8 Ultra | `20000000-0000-4000-8000-000000000003` | `30000000-0000-4000-8000-000000000003` |
| 4 | Redmi Note 15 Pro Plus 5G | `20000000-0000-4000-8000-000000000004` | `30000000-0000-4000-8000-000000000004` |
| 5 | Redmi Turbo 5 | `20000000-0000-4000-8000-000000000005` | `30000000-0000-4000-8000-000000000005` |
| 6 | Infinix Note 60 Pro 5G | `20000000-0000-4000-8000-000000000006` | `30000000-0000-4000-8000-000000000006` |
| 7 | TECNO Camon 50 | `20000000-0000-4000-8000-000000000007` | `30000000-0000-4000-8000-000000000007` |
| 8 | POCO C85 | `20000000-0000-4000-8000-000000000008` | `30000000-0000-4000-8000-000000000008` |
| 9 | POCO Pad X1 | `20000000-0000-4000-8000-000000000009` | `30000000-0000-4000-8000-000000000009` |
| 10 | Xiaomi Pad 8 | `20000000-0000-4000-8000-000000000010` | `30000000-0000-4000-8000-000000000010` |
| 11 | Redmi Pad 2 Pro 5G | `20000000-0000-4000-8000-000000000011` | `30000000-0000-4000-8000-000000000011` |
| 12 | TECNO Mega Pad Pro | `20000000-0000-4000-8000-000000000012` | `30000000-0000-4000-8000-000000000012` |

## Schema facts used

The deployed catalog schema permits product categories `phone` and `tablet`, product statuses `draft`, `active`, and `archived`, conditions `brand_new`, `pre_loved`, `open_box`, and `refurbished`, and badges `new` and `sale`.

`products.short_description` and `products.published_at` are nullable. An `active` product must have a non-null `published_at`. `product_variants.ram_gb` and `srp_centavos` are nullable; SKU, variant name, storage, current price, condition, financing state, active state, and sort order are required.

## Approved SKU convention

Use internal GadgetMoTo identifiers in this form:

`GMT-<BRANDCODE>-<PH|TB>-<MODEL-CODE>-<RAM_GB>-<STORAGE_GB>`

Omit the RAM segment only when RAM is genuinely unconfirmed. The identifiers use uppercase ASCII letters, numbers, and hyphens; contain no spaces; identify brand, device category, model, and storage; include confirmed RAM; and do not depend only on array position. They are approved internal GadgetMoTo inventory identifiers, not manufacturer-issued SKUs.

Approved brand codes: `XIA` (Xiaomi), `APL` (Apple), `POC` (POCO), `RED` (Redmi), `INF` (Infinix), and `TEC` (TECNO).

## Twelve-product decision matrix

Approved values across all rows:

- `short_description`: `null`; no product-specific source copy exists.
- `product.status`: `active`, because each product is already visibly rendered as launch catalog content.
- `product.is_featured`: `false`; the source has no canonical per-product featured field.
- `published_at`: `2026-07-17 20:51:11+00`, derived from migration filename `20260717205111_catalog_bootstrap_data.sql` and shared by all twelve products.
- `variant.is_active`: `true`, because the sole source variant is currently displayed for purchase inquiry.
- `variant.sort_order`: `0`, because each imported product has one variant.
- `condition`: `brand_new`, safely mapped from confirmed source “Brand New.”

| Pos. | Product / brand | Slug / category | Variant facts | Current / SRP | Badge / finance | Approved internal SKU | Approved product values | Approved variant values | Null or deferred fields / reason |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Xiaomi 17 Ultra 5G Leica Kit / Xiaomi | `xiaomi-17-ultra-5g-leica-kit` / `phone` | 16GB RAM, 512GB storage; 16GB/512GB | ₱84,990 / 8,499,000¢; ₱89,990 / 8,999,000¢ | sale / true | `GMT-XIA-PH-17ULTRA-16-512` | active; featured false; shared timestamp | active; sort 0 | Description remains null; visible source row supports launch-visible status |
| 2 | Apple iPhone 17 / Apple | `apple-iphone-17` / `phone` | RAM `null`, 256GB storage; 256GB | ₱57,990 / 5,799,000¢; SRP `null` | new / true | `GMT-APL-PH-IP17-256` | active; featured false; shared timestamp | active; sort 0 | RAM, SRP, and description remain null as approved |
| 3 | POCO F8 Ultra / POCO | `poco-f8-ultra` / `phone` | 16GB RAM, 512GB storage; 16GB/512GB | ₱46,990 / 4,699,000¢; SRP `null` | new / true | `GMT-POC-PH-F8ULTRA-16-512` | active; featured false; shared timestamp | active; sort 0 | SRP and description remain null as approved |
| 4 | Redmi Note 15 Pro Plus 5G / Redmi | `redmi-note-15-pro-plus-5g` / `phone` | 12GB RAM, 512GB storage; 12GB/512GB | ₱27,990 / 2,799,000¢; ₱28,990 / 2,899,000¢ | sale / true | `GMT-RED-PH-N15PP5G-12-512` | active; featured false; shared timestamp | active; sort 0 | Description remains null as approved |
| 5 | Redmi Turbo 5 / Redmi | `redmi-turbo-5` / `phone` | 12GB RAM, 256GB storage; 12GB/256GB | ₱20,990 / 2,099,000¢; ₱22,990 / 2,299,000¢ | sale / true | `GMT-RED-PH-TURBO5-12-256` | active; featured false; shared timestamp | active; sort 0 | Description remains null as approved |
| 6 | Infinix Note 60 Pro 5G / Infinix | `infinix-note-60-pro-5g` / `phone` | 16GB RAM, 256GB storage; 16GB/256GB | ₱19,990 / 1,999,000¢; ₱20,990 / 2,099,000¢ | sale / true | `GMT-INF-PH-N60P5G-16-256` | active; featured false; shared timestamp | active; sort 0 | Description remains null as approved |
| 7 | TECNO Camon 50 / TECNO | `tecno-camon-50` / `phone` | 16GB RAM, 256GB storage; 16GB/256GB | ₱13,490 / 1,349,000¢; ₱13,990 / 1,399,000¢ | sale / true | `GMT-TEC-PH-CAMON50-16-256` | active; featured false; shared timestamp | active; sort 0 | Description remains null as approved |
| 8 | POCO C85 / POCO | `poco-c85` / `phone` | 8GB RAM, 256GB storage; 8GB/256GB | ₱7,990 / 799,000¢; ₱8,990 / 899,000¢ | sale / true | `GMT-POC-PH-C85-8-256` | active; featured false; shared timestamp | active; sort 0 | Description remains null as approved |
| 9 | POCO Pad X1 / POCO | `poco-pad-x1` / `tablet` | 8GB RAM, 512GB storage; 8GB/512GB | ₱23,990 / 2,399,000¢; ₱24,990 / 2,499,000¢ | sale / true | `GMT-POC-TB-PADX1-8-512` | active; featured false; shared timestamp | active; sort 0 | Description remains null as approved |
| 10 | Xiaomi Pad 8 / Xiaomi | `xiaomi-pad-8` / `tablet` | 8GB RAM, 128GB storage; 8GB/128GB | ₱19,990 / 1,999,000¢; ₱20,990 / 2,099,000¢ | sale / true | `GMT-XIA-TB-PAD8-8-128` | active; featured false; shared timestamp | active; sort 0 | Description remains null as approved |
| 11 | Redmi Pad 2 Pro 5G / Redmi | `redmi-pad-2-pro-5g` / `tablet` | 8GB RAM, 256GB storage; 8GB/256GB | ₱18,990 / 1,899,000¢; ₱19,990 / 1,999,000¢ | sale / true | `GMT-RED-TB-PAD2PRO5G-8-256` | active; featured false; shared timestamp | active; sort 0 | Description remains null as approved |
| 12 | TECNO Mega Pad Pro / TECNO | `tecno-mega-pad-pro` / `tablet` | 8GB RAM, 256GB storage; 8GB/256GB | ₱13,990 / 1,399,000¢; ₱14,990 / 1,499,000¢ | sale / true | `GMT-TEC-TB-MEGAPADPRO-8-256` | active; featured false; shared timestamp | active; sort 0 | Description remains null as approved |

The matrix contains twelve unique products and twelve unique approved internal SKUs. No Apple RAM value appears in its SKU.

## Apple iPhone 17 RAM recommendation

Keep `ram_gb` null because the canonical source does not confirm RAM. Preserve the confirmed 256GB storage value. Do not search for or assume unofficial specifications. The deployed schema explicitly allows null RAM, so unknown RAM alone does not block the bootstrap import.

## Approved publication and activation values

- Brands represented by visible products: `is_active = true`.
- Products: use enum-valid `status = 'active'` because all twelve are already public static catalog entries.
- Featured state: `is_featured = false` for all twelve. The presentation exports do not provide a canonical per-product featured flag.
- Product descriptions: keep `short_description = null`.
- Variants: use `is_active = true` for the twelve currently displayed variants.
- Financing and badge: preserve each canonical source value.
- Condition: preserve confirmed `Brand New` through enum value `brand_new`.
- Inventory: insert no quantities, availability counts, reorder levels, or movements.

Because the schema requires `published_at` for `active` products, the bootstrap uses the approved deterministic timestamp `2026-07-17 20:51:11+00`, derived from migration filename `20260717205111_catalog_bootstrap_data.sql`, for all twelve products. It does not use `now()` or an unsupported historical date.

## Approved ordering

Brand sort order follows first appearance in the canonical source because no other business order exists:

| Sort order | Brand |
| ---: | --- |
| 0 | Xiaomi |
| 1 | Apple |
| 2 | POCO |
| 3 | Redmi |
| 4 | Infinix |
| 5 | TECNO |

Every product currently has one imported variant, so each approved variant sort order is 0. The `products` table has no sort-order column, so none is invented. The canonical array—not duplicated or stale browser render order—is the ordering reference.

## SRP conversion check

Ten products have explicit source-backed SRPs. Apple iPhone 17 and POCO F8 Ultra have no confirmed SRP; their `srp_centavos` values remain null. Current prices must never be copied into SRP to avoid null.

| Product | Current pesos | Current centavos | Source SRP pesos | SRP centavos |
| --- | ---: | ---: | ---: | ---: |
| Xiaomi 17 Ultra 5G Leica Kit | ₱84,990 | 8,499,000 | ₱89,990 | 8,999,000 |
| Apple iPhone 17 | ₱57,990 | 5,799,000 | `null` | `null` |
| POCO F8 Ultra | ₱46,990 | 4,699,000 | `null` | `null` |
| Redmi Note 15 Pro Plus 5G | ₱27,990 | 2,799,000 | ₱28,990 | 2,899,000 |
| Redmi Turbo 5 | ₱20,990 | 2,099,000 | ₱22,990 | 2,299,000 |
| Infinix Note 60 Pro 5G | ₱19,990 | 1,999,000 | ₱20,990 | 2,099,000 |
| TECNO Camon 50 | ₱13,490 | 1,349,000 | ₱13,990 | 1,399,000 |
| POCO C85 | ₱7,990 | 799,000 | ₱8,990 | 899,000 |
| POCO Pad X1 | ₱23,990 | 2,399,000 | ₱24,990 | 2,499,000 |
| Xiaomi Pad 8 | ₱19,990 | 1,999,000 | ₱20,990 | 2,099,000 |
| Redmi Pad 2 Pro 5G | ₱18,990 | 1,899,000 | ₱19,990 | 1,999,000 |
| TECNO Mega Pad Pro | ₱13,990 | 1,399,000 | ₱14,990 | 1,499,000 |

All conversions multiply the confirmed whole-peso value by 100 exactly.

## Bootstrap scope and row counts

The reviewed bootstrap migration inserted only:

- `brands`: 6
- `products`: 12
- `product_variants`: 12

Every other application table must remain at zero rows. The import specifically excludes product images, store locations, inventory records, homepage records, staff or commerce records, price-alert subscriptions, and audit logs.

The bootstrap uses the explicit approved UUID mapping above; no random UUID or insertion-order dependency is used. Routine catalog editing must later move to protected staff/admin workflows rather than permanent migration dependence.

## Deployment and parity status

The approved `20260717205111_catalog_bootstrap_data.sql` migration deployed successfully. Six brands, twelve products, and twelve variants now exist remotely, with the deterministic UUID relationships preserved. Product and variant values were manually compared through the Supabase Table Editor, including all twelve approved unique SKUs.

Apple iPhone 17 keeps `ram_gb` and `srp_centavos` null, and POCO F8 Ultra keeps `srp_centavos` null. All products are active and not featured, all variants are active with `sort_order = 0`, and every product uses the fixed shared publication timestamp `2026-07-17 20:51:11+00`. All excluded tables remain empty.

Verified post-deployment row counts are:

- `brands`: 6
- `products`: 12
- `product_variants`: 12
- Every other application table: 0

Static application catalog data remains the live storefront source until application/database query integration and storefront parity verification are completed.

## Approval record

- [x] SKU convention
- [x] Exact twelve internal SKUs
- [x] Apple iPhone 17 `ram_gb = null`
- [x] `active` launch-visible product status
- [x] `is_featured = false` for all twelve
- [x] Shared `published_at = 2026-07-17 20:51:11+00`
- [x] `variant.is_active = true` for all twelve
- [x] Brand order: Xiaomi, Apple, POCO, Redmi, Infinix, TECNO
- [x] Brand sort orders 0–5
- [x] Variant sort order 0 for every sole variant
- [x] Null SRPs for Apple iPhone 17 and POCO F8 Ultra
- [x] Exclusion of product images, locations, inventory, homepage, staff, commerce, alerts, and audit data
