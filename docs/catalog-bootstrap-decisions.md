# GadgetMoTo Catalog Bootstrap Decision Matrix

## Status

This is a proposed catalog-data decision matrix. It is not executable SQL. No database value has been inserted, and final approval is required before creating the bootstrap migration. Proposed values below are review candidates, not approved operational data.

## Schema facts used

The deployed catalog schema permits product categories `phone` and `tablet`, product statuses `draft`, `active`, and `archived`, conditions `brand_new`, `pre_loved`, `open_box`, and `refurbished`, and badges `new` and `sale`.

`products.short_description` and `products.published_at` are nullable. An `active` product must have a non-null `published_at`. `product_variants.ram_gb` and `srp_centavos` are nullable; SKU, variant name, storage, current price, condition, financing state, active state, and sort order are required.

## Proposed SKU convention

Use internal GadgetMoTo identifiers in this form:

`GMT-<BRANDCODE>-<MODEL-CODE>-R<RAM_GB>-S<STORAGE_GB>`

Omit the RAM segment only when RAM is genuinely unconfirmed. The identifiers use uppercase ASCII letters, numbers, and hyphens; contain no spaces; identify brand/model/storage; include confirmed RAM; and do not depend only on array position. They are internal GadgetMoTo inventory identifiers, not manufacturer-issued SKUs, and every value requires approval.

Proposed brand codes: `XMI` (Xiaomi), `APL` (Apple), `POC` (POCO), `RDM` (Redmi), `INF` (Infinix), and `TEC` (TECNO).

## Twelve-product decision matrix

Common proposals across all rows:

- `short_description`: `null`; no product-specific source copy exists.
- `product.status`: `active`, because each product is already visibly rendered as launch catalog content. This requires approval.
- `product.is_featured`: `false`; the source has no canonical per-product featured field.
- `published_at`: one explicit, reviewed, shared `timestamptz` literal representing the approved bootstrap/launch publication moment. The value is not generated in this checkpoint.
- `variant.is_active`: `true`, because the sole source variant is currently displayed for purchase inquiry. This requires approval.
- `variant.sort_order`: `0`, because each imported product has one variant.
- `condition`: `brand_new`, safely mapped from confirmed source “Brand New.”

| Pos. | Product / brand | Slug / category | Variant facts | Current / SRP | Badge / finance | Proposed internal SKU | Product proposal | Variant proposal | Missing or ambiguous / recommendation reason |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Xiaomi 17 Ultra 5G Leica Kit / Xiaomi | `xiaomi-17-ultra-5g-leica-kit` / `phone` | 16GB RAM, 512GB storage; 16GB/512GB | ₱84,990 / 8,499,000¢; ₱89,990 / 8,999,000¢ | sale / true | `GMT-XMI-17ULT-R16-S512` | active; featured false; approved timestamp pending | active; sort 0 | SKU and publication timestamp need approval; visible source row supports launch-visible intent |
| 2 | Apple iPhone 17 / Apple | `apple-iphone-17` / `phone` | RAM `null`, 256GB storage; 256GB | ₱57,990 / 5,799,000¢; SRP `null` | new / true | `GMT-APL-IP17-S256` | active; featured false; approved timestamp pending | active; sort 0 | RAM and SRP genuinely absent; schema permits null; do not block import or invent values |
| 3 | POCO F8 Ultra / POCO | `poco-f8-ultra` / `phone` | 16GB RAM, 512GB storage; 16GB/512GB | ₱46,990 / 4,699,000¢; SRP `null` | new / true | `GMT-POC-F8ULT-R16-S512` | active; featured false; approved timestamp pending | active; sort 0 | SRP absent; SKU and publication timestamp need approval; preserve null SRP |
| 4 | Redmi Note 15 Pro Plus 5G / Redmi | `redmi-note-15-pro-plus-5g` / `phone` | 12GB RAM, 512GB storage; 12GB/512GB | ₱27,990 / 2,799,000¢; ₱28,990 / 2,899,000¢ | sale / true | `GMT-RDM-N15PP5G-R12-S512` | active; featured false; approved timestamp pending | active; sort 0 | SKU and publication timestamp need approval; visible source row supports launch-visible intent |
| 5 | Redmi Turbo 5 / Redmi | `redmi-turbo-5` / `phone` | 12GB RAM, 256GB storage; 12GB/256GB | ₱20,990 / 2,099,000¢; ₱22,990 / 2,299,000¢ | sale / true | `GMT-RDM-TURBO5-R12-S256` | active; featured false; approved timestamp pending | active; sort 0 | SKU and publication timestamp need approval; visible source row supports launch-visible intent |
| 6 | Infinix Note 60 Pro 5G / Infinix | `infinix-note-60-pro-5g` / `phone` | 16GB RAM, 256GB storage; 16GB/256GB | ₱19,990 / 1,999,000¢; ₱20,990 / 2,099,000¢ | sale / true | `GMT-INF-N60P5G-R16-S256` | active; featured false; approved timestamp pending | active; sort 0 | SKU and publication timestamp need approval; visible source row supports launch-visible intent |
| 7 | TECNO Camon 50 / TECNO | `tecno-camon-50` / `phone` | 16GB RAM, 256GB storage; 16GB/256GB | ₱13,490 / 1,349,000¢; ₱13,990 / 1,399,000¢ | sale / true | `GMT-TEC-CAM50-R16-S256` | active; featured false; approved timestamp pending | active; sort 0 | SKU and publication timestamp need approval; visible source row supports launch-visible intent |
| 8 | POCO C85 / POCO | `poco-c85` / `phone` | 8GB RAM, 256GB storage; 8GB/256GB | ₱7,990 / 799,000¢; ₱8,990 / 899,000¢ | sale / true | `GMT-POC-C85-R8-S256` | active; featured false; approved timestamp pending | active; sort 0 | SKU and publication timestamp need approval; visible source row supports launch-visible intent |
| 9 | POCO Pad X1 / POCO | `poco-pad-x1` / `tablet` | 8GB RAM, 512GB storage; 8GB/512GB | ₱23,990 / 2,399,000¢; ₱24,990 / 2,499,000¢ | sale / true | `GMT-POC-PADX1-R8-S512` | active; featured false; approved timestamp pending | active; sort 0 | Model code identifies tablet; SKU and publication timestamp need approval |
| 10 | Xiaomi Pad 8 / Xiaomi | `xiaomi-pad-8` / `tablet` | 8GB RAM, 128GB storage; 8GB/128GB | ₱19,990 / 1,999,000¢; ₱20,990 / 2,099,000¢ | sale / true | `GMT-XMI-PAD8-R8-S128` | active; featured false; approved timestamp pending | active; sort 0 | Model code identifies tablet; SKU and publication timestamp need approval |
| 11 | Redmi Pad 2 Pro 5G / Redmi | `redmi-pad-2-pro-5g` / `tablet` | 8GB RAM, 256GB storage; 8GB/256GB | ₱18,990 / 1,899,000¢; ₱19,990 / 1,999,000¢ | sale / true | `GMT-RDM-PAD2P5G-R8-S256` | active; featured false; approved timestamp pending | active; sort 0 | Model code identifies tablet; SKU and publication timestamp need approval |
| 12 | TECNO Mega Pad Pro / TECNO | `tecno-mega-pad-pro` / `tablet` | 8GB RAM, 256GB storage; 8GB/256GB | ₱13,990 / 1,399,000¢; ₱14,990 / 1,499,000¢ | sale / true | `GMT-TEC-MEGAPADP-R8-S256` | active; featured false; approved timestamp pending | active; sort 0 | Model code identifies tablet; SKU and publication timestamp need approval |

The matrix contains twelve unique products and twelve unique proposed SKUs. No Apple RAM value appears in its SKU.

## Apple iPhone 17 RAM recommendation

Keep `ram_gb` null because the canonical source does not confirm RAM. Preserve the confirmed 256GB storage value. Do not search for or assume unofficial specifications. The deployed schema explicitly allows null RAM, so unknown RAM alone does not block the bootstrap import.

## Publication and activation recommendation

- Brands represented by visible products: propose `is_active = true`.
- Products: propose enum-valid `status = 'active'` because all twelve are already public static catalog entries.
- Featured state: propose `is_featured = false` for all twelve. The presentation exports do not provide a canonical per-product featured flag.
- Product descriptions: keep `short_description = null`.
- Variants: propose `is_active = true` for the twelve currently displayed variants.
- Financing and badge: preserve each canonical source value.
- Condition: preserve confirmed `Brand New` through enum value `brand_new`.
- Inventory: insert no quantities, availability counts, reorder levels, or movements.

Because the schema requires `published_at` for `active` products, the future bootstrap must use a deterministic, explicitly approved `timestamptz` literal. Use one shared approved bootstrap/launch publication moment for the twelve initial products. Do not use an invented historical date or generate the value now. Approval of both active status and the exact timestamp is required before migration creation.

## Ordering recommendation

Brand sort order follows first appearance in the canonical source because no other business order exists:

| Sort order | Brand |
| ---: | --- |
| 0 | Xiaomi |
| 1 | Apple |
| 2 | POCO |
| 3 | Redmi |
| 4 | Infinix |
| 5 | TECNO |

Every product currently has one imported variant, so each proposed variant sort order is 0. The `products` table has no sort-order column; do not invent one. The canonical array—not duplicated or stale browser render order—is the ordering reference.

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

## Future bootstrap scope and row counts

The reviewed bootstrap migration should insert only:

- `brands`: 6
- `products`: 12
- `product_variants`: 12

Every other application table must remain at zero rows. The import specifically excludes product images, store locations, inventory records, homepage records, staff or commerce records, price-alert subscriptions, and audit logs.

No final UUID has been generated. The approved import plan recommends explicit reviewed UUIDs or another deterministic, reviewable relationship strategy in the future bootstrap migration; routine catalog editing must later move to protected staff/admin workflows rather than permanent migration dependence.

## Approval checklist

Nothing below is approved yet:

- [ ] SKU convention
- [ ] Exact twelve proposed internal SKUs
- [ ] Apple iPhone 17 `ram_gb = null`
- [ ] `active` launch-visible product status
- [ ] `is_featured = false` for all twelve
- [ ] One shared explicit approved `published_at` timestamp and its exact value
- [ ] `variant.is_active = true` for all twelve
- [ ] Brand order: Xiaomi, Apple, POCO, Redmi, Infinix, TECNO
- [ ] Brand sort orders 0–5
- [ ] Variant sort order 0 for every sole variant
- [ ] Null SRPs for Apple iPhone 17 and POCO F8 Ultra
- [ ] Exclusion of product images, locations, inventory, homepage, staff, commerce, alerts, and audit data
