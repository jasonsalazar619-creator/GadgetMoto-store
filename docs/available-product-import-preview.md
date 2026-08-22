# GadgetMoTo Final Available Product Import Preview

## Scope and safety

This is a read-only launch-import preview prepared from the 71 supplied product
rows on 2026-08-22. It does not write to PostgreSQL, Supabase, or the live
storefront. Supplied SRP is the only proposed price. Every Sale Price value in
the supplied sheet is excluded.

The preview uses these conservative rules:

- `READY` means the existing active product has a legitimate commercial SKU,
  and its supplied SRP can be applied without creating a new identity.
- `NEEDS MANUAL REVIEW` includes every Coming Soon record without an SKU, every
  missing record, every ambiguous identity, and every configuration whose
  exact color/storage relationship is not proven.
- `INVALID TEST DATA` identifies an existing live record whose commercial
  fields are placeholders rather than launch data.
- A merged product-level color cell covering multiple RAM/storage rows does
  not authorize the color cross-product. Those combinations stay OFF.
- An exact single-configuration color is only proposed ON when the existing
  active product, legitimate SKU, supplied configuration, and color can be
  reconciled. No SKU is invented.

## Safe manufacturer-name normalization

Only the following supplied text can be normalized confidently:

| Supplied text | Normalized text | Official evidence | Availability effect |
| --- | --- | --- | --- |
| `ALPHINE PINK` | Alpine Pink | [Xiaomi 17 official specifications](https://www.mi.com/sg/product/xiaomi-17/specs/) | None while the product has invalid test commerce data |
| `BLAC` | Black | [Xiaomi 17T Pro official specifications](https://www.mi.com/uk/product/xiaomi-17t-pro/specs/) | None while the product has invalid test commerce data |
| `Ultra Marine` | Ultramarine | [Apple iPhone 16 technical specifications](https://www.apple.com/ph/iphone-16/specs/) | None while its commercial SKU is missing |
| `Almafi Blue` | Amalfi Blue | [Infinix NOTE 60 Ultra official page](https://ph.infinixmobility.com/NOTE-60-Ultra) | None while its commercial SKU is missing |
| `Orange` on Infinix Note Edge | Solar Orange | [Infinix Note Edge official page](https://infinixmobiles.in/products/note-edge) | None while its commercial SKU is missing |

The following text remains unresolved and is not normalized: Infinix Note 60
Pro `Forest`; Infinix Note Edge `Shadow Black`; Samsung A07 `Gray, Light,
Violet, Dark Green`; the nearby color row with unclear ownership under Redmi
Note 15; and every color list merged across multiple configurations.

Xiaomi's official Xiaomi 17 list contains Black, Venture Green, Alpine Pink,
and Ice Blue, but not the sheet's White finish. White therefore remains OFF.
The official Infinix Note Edge list contains Lunar Titanium, Solar Orange,
Stellar Blue, and Silk Green, but not Shadow Black. Shadow Black remains OFF.
Samsung's official Galaxy A07 LTE material supports Black, Light Violet, and
Green, which does not prove the supplied Samsung color phrase; that row remains
manual review.

## Final product-level preview

`—` in the SKU column means the existing Coming Soon record has no commercial
SKU. The configuration/SRP column contains only supplied SRP values. For a
multi-configuration row, `OFF` applies to all supplied color/configuration
cross-products unless a separate exact relationship is documented.

| # | Supplied product | Matched database product | Product ID | Storage / RAM and supplied SRP | Current DB price | New launch price | Available | SKU | Status | Action |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Xiaomi 17 Pro Max 5G | Xiaomi 17 Pro Max | `9b357f56-32b0-43cb-8cb9-8ad7df153041` | 16GB/1TB ₱78,990; 16GB/512GB ₱72,990; 12GB/512GB ₱68,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 2 | Xiaomi 17 Pro 5G | Xiaomi 17 Pro | `adfcd451-6a8e-459d-8728-c9c92005da36` | 16GB/512GB ₱62,990; 12GB/512GB ₱59,990; 12GB/256GB ₱56,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 3 | Xiaomi 17 Ultra 5G Leica with Kit | Xiaomi 17 Ultra 5G Leica Kit | `20000000-0000-4000-8000-000000000001` | 16GB/512GB ₱84,990; Black | ₱84,990 (stale crossed-out SRP exists) | ₱84,990 | ON after normalization | `GMT-XIA-PH-17ULTRA-16-512` | READY | NORMALIZE |
| 4 | Redmi K100 Pro Max 5G | No record | — | 12GB/256GB ₱49,990; 12GB/512GB ₱54,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 5 | Redmi K100 Pro 5G | No record | — | 12GB/256GB ₱42,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 6 | Redmi K90 5G | Redmi K90 | `7ca1a260-fe84-4bb7-877e-448db855c51c` | 12GB/256GB ₱33,990 | — | ₱33,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 7 | Redmi K90 Max 5G | Redmi K90 Max | `52843f51-af9b-4a0e-b638-aa7a40e5c0f9` | 12GB/256GB ₱35,990 | — | ₱35,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 8 | Redmi K90 Pro Max 5G | Redmi K90 Pro Max | `697ef317-e71c-4c7f-ac24-285539de2207` | 12GB/256GB ₱45,990 | — | ₱45,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 9 | Redmi Turbo 5 Max | Redmi Turbo 5 Max | `7ea58eb1-3264-4ef2-bce1-79d8b99e3829` | 12GB/256GB ₱27,990; 12GB/512GB ₱32,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 10 | Redmi Turbo 4 Pro | Redmi Turbo 4 Pro | `4da01ea3-92fd-4f4e-95ab-012defec00d3` | 12GB/256GB ₱25,990; 16GB/512GB ₱28,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 11 | Redmi Turbo 4 | Redmi Turbo 4 | `0a284227-e620-4e4e-a6f4-443799ff6175` | 12GB/256GB ₱22,990 | — | ₱22,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 12 | vivo iQOO 15 Ultra 5G | iQOO 15 Ultra | `1315677c-b420-439f-aa88-cbaec0b157c9` | 16GB/512GB ₱67,990 | — | ₱67,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 13 | vivo iQOO 15 5G | iQOO 15 | `dbc08b59-5bbb-4757-a7f3-4707d02acad9` | 12GB/256GB ₱47,990; 16GB/512GB ₱52,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 14 | vivo iQOO Z11 Turbo 5G | iQOO Z11 Turbo | `a258d701-dfed-4f3a-9300-730bf7dbec6d` | 12GB/256GB ₱32,990 | — | ₱32,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 15 | vivo iQOO Z11 5G | iQOO Z11 | `ae8adeb3-faab-4aa4-90e9-61f3d2fc69b1` | 12GB/256GB ₱24,990 | — | ₱24,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 16 | vivo iQOO Z10 Turbo Pro+ | Ambiguous: iQOO Z10 Turbo Plus / Pro | — | 12GB/256GB ₱26,990; 16GB/512GB ₱29,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 17 | HONOR WIN 5G | HONOR WIN | `7569d9e9-6652-4486-91c9-767d3dcc4964` | 12GB/256GB ₱45,990; 12GB/512GB ₱49,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 18 | HONOR WIN RT | HONOR WIN RT | `454f68fe-06f9-464c-90aa-beea06a056b0` | 12GB/256GB ₱37,990; 12GB/512GB ₱40,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 19 | Lenovo Legion Y70 2026 5G | Lenovo Legion Y70 2026 | `06a71372-47bd-4e92-8686-7f1e11e65263` | 12GB/256GB ₱29,990 | — | ₱29,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 20 | Lenovo Legion Tab Y700 4th Gen | Lenovo Legion Tab Y700 | `87bb46ac-7353-4c43-991f-31578a668187` | 12GB/256GB ₱30,990 | — | ₱30,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 21 | OnePlus Ace 6T | OnePlus Ace 6T | `5b4f58ec-db91-4638-89ca-95172a80e728` | 12GB/256GB ₱32,990 | — | ₱32,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 22 | POCO F8 Ultra 5G | POCO F8 Ultra | `20000000-0000-4000-8000-000000000003` | 12GB/256GB ₱59,990; 16GB/512GB ₱60,990 | ₱46,990 | ₱59,990 / ₱60,990 | OFF: colors are merged across storage | existing 16/512: `GMT-POC-PH-F8ULTRA-16-512`; 12/256 missing | READY for existing variant only | UPDATE |
| 23 | POCO F8 Pro 5G | No record; duplicated supplied 12GB/256GB | — | 12GB/256GB ₱45,990 and ₱49,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 24 | POCO Pad X1 | POCO Pad X1 | `20000000-0000-4000-8000-000000000009` | 8GB/512GB ₱32,990; Gray, Blue | ₱23,990 | ₱32,990 | ON after exact links | `GMT-POC-TB-PADX1-8-512` | READY | UPDATE |
| 25 | POCO Pad M1 | POCO Pad M1 | `b02d6812-8262-43af-9c94-c0ece2e1fa2f` | 8GB/256GB ₱24,990 | — | ₱24,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 26 | POCO X8 Pro Max 5G | POCO X8 Pro Max | `ff33c3ad-ff36-433e-b14d-417c5ba2c5a4` | 12GB/256GB ₱42,990; 12GB/512GB ₱44,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 27 | POCO X8 Pro 5G Ironman | Possible POCO X8 Pro edition | — | 12GB/512GB ₱36,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 28 | POCO X8 Pro 5G | POCO X8 Pro | `9e6c43d4-d674-44c1-add5-e2b217b2f905` | 12GB/512GB ₱36,990; 8GB/512GB ₱34,990; 8GB/256GB ₱29,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 29 | POCO F7 5G | POCO F7 | `4baf3806-4fcb-47b7-a941-afb91eb24b6b` | 12GB/256GB ₱27,990; 12GB/512GB ₱29,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 30 | POCO M8 Pro 5G | POCO M8 Pro 5G | `2fd48055-b110-4f76-8b5c-002a7008edae` | 8GB/256GB ₱24,990; 12GB/512GB ₱29,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 31 | POCO M8 5G | POCO M8 5G | `cb1e1c42-04b1-4937-a8ad-e09b2d9593c6` | 8GB/256GB ₱22,990; 8GB/512GB ₱24,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 32 | POCO M8S 5G | POCO M8S | `abb78674-3c75-4e09-8b43-ea90ce65ce56` | 8GB/256GB ₱15,990 | — | ₱15,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 33 | POCO C81 Pro | POCO C81 Pro | `5f47ea76-8594-4019-b342-3b6fff484eab` | 4GB/128GB ₱8,990; 4GB/256GB ₱9,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 34 | POCO C71 | POCO C71 | `2470d173-f096-4cbc-87a0-b1d9629aa039` | 3GB/64GB ₱6,990; 4GB/128GB ₱7,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 35 | Apple iPhone 14 | Apple iPhone 14 | `cfb24d1a-6373-4252-8e19-7854d2168fdd` | RAM unpublished/128GB ₱39,990 | — | ₱39,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 36 | Apple iPhone 15 | Apple iPhone 15 | `bc579c5d-ca26-486d-8839-7c36d2674d95` | RAM unpublished/128GB ₱46,990 | — | ₱46,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 37 | Apple iPhone 16 | Apple iPhone 16 | `c4ec77b7-fdd6-4fc2-9fe0-115c332a9389` | RAM unpublished/128GB ₱50,990 | — | ₱50,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 38 | Apple iPhone 17 | Apple iPhone 17 | `20000000-0000-4000-8000-000000000002` | RAM unpublished/256GB ₱62,990; Black, White, Mist Blue, Sage, Lavender | ₱57,990 | ₱62,990 | ON for five exact colors | `GMT-APL-PH-IP17-256` | READY | UPDATE |
| 39 | Apple iPhone 17 Pro | No record | — | RAM unpublished/256GB ₱80,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 40 | Apple iPhone 17 Pro Max | No record | — | RAM unpublished/256GB ₱89,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 41 | Xiaomi 17 5G | Xiaomi 17 | `049bbf54-a5d7-4e4d-8a5a-00029707440b` | 12GB/512GB ₱64,990 | ₱11 | ₱64,990 after legitimate SKU | OFF | invalid `1111` | INVALID TEST DATA | SKIP — MANUAL REVIEW |
| 42 | Xiaomi 17T Pro 5G | Xiaomi 17T Pro | `8a929a57-f2c7-4421-a606-906e4609c9b7` | 12GB/512GB ₱55,990 | ₱1 (SRP ₱100) | ₱55,990 after legitimate SKU | OFF | invalid `TEST` | INVALID TEST DATA | SKIP — MANUAL REVIEW |
| 43 | Xiaomi 17T 5G | Xiaomi 17T | `fb5a8888-3790-4403-80a2-8b7075953104` | 12GB/256GB ₱39,990; 12GB/512GB ₱43,990 | — | Supplied SRP per configuration | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 44 | Redmi Note 15 Pro 5G | Redmi Note 15 Pro 5G | `2777266c-9122-4692-8ac5-79a959040658` | 8GB/256GB ₱22,990 | — | ₱22,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 45 | Redmi Note 15 4G | Probable Redmi Note 15 | `a257e073-623d-43ad-a325-0af24f6e2339` | 8GB/256GB ₱16,990 | — | ₱16,990 after SKU and row clarification | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 46 | Redmi 15C 5G | Redmi 15C 5G | `a77db7bb-54d4-41eb-a3d3-6981e5367392` | 8GB/256GB ₱11,990 | — | ₱11,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 47 | Redmi A7 Pro | Redmi A7 Pro | `ce03b312-782e-4fd0-9565-f2fea0f3437a` | 4GB/128GB ₱9,990 | — | ₱9,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 48 | Xiaomi Pad 8 | Xiaomi Pad 8 | `20000000-0000-4000-8000-000000000010` | 8GB/128GB ₱29,990; 8GB/256GB ₱34,990 | ₱19,990 | ₱29,990 / ₱34,990 | OFF: colors are merged across storage | existing 8/128: `GMT-XIA-TB-PAD8-8-128`; 8/256 missing | READY for existing variant only | UPDATE |
| 49 | Redmi Pad 2 Pro | Possible Redmi Pad 2 Pro 5G | `20000000-0000-4000-8000-000000000011` | 8GB/256GB ₱24,990 | ₱18,990 | — until Wi-Fi/5G identity is confirmed | OFF | `GMT-RED-TB-PAD2PRO5G-8-256` | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 50 | Redmi Pad SE 8.7 | No exact record | — | RAM/storage absent; ₱8,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 51 | HONOR X9D | HONOR X9D | `c2334a05-8b3d-4cd3-9ae9-0bb348c1c693` | 12GB/256GB ₱20,990 | — | ₱20,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 52 | HONOR 400 5G | No record | — | 12GB/512GB ₱23,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 53 | HONOR 600 5G | HONOR 600 | `43591fa0-34b3-4c2d-ae0b-aa25a043c5df` | 8GB/256GB ₱29,990 | — | ₱29,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 54 | Infinix Note 60 Ultra 5G | Infinix Note 60 Ultra | `1f09d954-68f3-4de1-b1f8-5a35862dc5ba` | 12GB/512GB ₱36,990 | — | ₱36,990 after SKU and RAM verification | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 55 | Infinix GT 50 Pro 5G | No record | — | 12GB/256GB ₱29,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 56 | Infinix Note 60 Pro 5G | Infinix Note 60 Pro 5G | `20000000-0000-4000-8000-000000000006` | 8GB physical + 8GB extended/256GB ₱20,990 | ₱19,990 | ₱20,990 | ON for five exact supplied colors; `Forest` OFF | `GMT-INF-PH-N60P5G-16-256` | READY | UPDATE |
| 57 | Infinix Note Edge 5G | Infinix Note Edge 5G | `6f074e4d-dd72-4e83-807d-4567c989c489` | 8GB/256GB ₱16,990 | — | ₱16,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 58 | Infinix GT 30 Pro 5G | Infinix GT30 Pro | `0a540e3b-098d-4967-bdf6-548d6677e8c0` | supplied 16GB/256GB ₱18,990; physical/extended split unresolved | — | — until RAM is verified and SKU exists | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 59 | Infinix GT 30 5G | Infinix GT30 5G | `d43119ba-fc1b-40f2-85ee-bb836f73502e` | 8GB/256GB ₱15,990 | — | ₱15,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 60 | Infinix Hot 70 | Infinix Hot 70 | `c349789d-3fd8-4f43-9b50-dd670bf5c817` | RAM/storage absent; ₱10,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 61 | Infinix Smart 20 | Infinix Smart 20 | `846a8c9c-1958-4df5-aeac-db7f82732cb4` | supplied 6GB/64GB and 8GB/128GB; official physical RAM 4GB/64GB and 4GB/128GB | — | — until extended RAM is separated and SKU exists | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 62 | Infinix XPad 30E | No record | — | 8GB/256GB ₱13,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 63 | TECNO Mega Pad 2 Lite | No record | — | 8GB/256GB ₱19,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 64 | TECNO Camon 50 Ultra 5G | TECNO Camon 50 Ultra | `5cb4ca4a-825c-4849-9749-9da93a1c3a4f` | supplied 16GB/256GB ₱20,990; physical/extended split unresolved | — | — until RAM is verified and SKU exists | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 65 | TECNO Camon 50 | TECNO Camon 50 | `20000000-0000-4000-8000-000000000007` | 8GB physical + 8GB extended/256GB ₱15,990 | ₱13,490 | ₱15,990 | ON for six supplied colors after exact links | `GMT-TEC-PH-CAMON50-16-256` | READY | UPDATE |
| 66 | TECNO Pova Curve 2 5G | TECNO Pova Curve 2 | `c5079ee8-7e98-402e-9ef9-4503b02b5dd7` | supplied 16GB/256GB ₱19,990; physical/extended split unresolved | — | — until RAM is verified and SKU exists | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 67 | TECNO Spark 50 5G | Possible regional TECNO Spark 50 | `e663aaba-ab9b-4fd4-bd74-f0865f680b2e` | 8GB/128GB ₱10,990; 8GB/256GB ₱15,990 | — | — until 5G identity and SKUs are confirmed | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 68 | TECNO Spark Go 3 | TECNO Spark Go 3 | `898b35be-5ce4-4030-b532-67dc81ffb439` | supplied 8GB/64GB ₱6,990; 8GB/128GB ₱7,990; physical/extended split unresolved | — | — until RAM is verified and SKUs exist | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 69 | vivo Y05 | vivo Y05 | `1fd0329d-9391-42c5-a874-5c302bc2f77b` | 4GB/128GB ₱8,990 | — | ₱8,990 after SKU | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 70 | OPPO A6C | No record | — | 4GB/128GB ₱8,990 | — | — | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |
| 71 | Samsung A07 | Possible Samsung Galaxy A07 LTE | `5d7140ed-e26b-4751-aa58-5b8e896a72a5` | 4GB/128GB ₱9,990 | — | — until identity/color text is reconciled | OFF | — | NEEDS MANUAL REVIEW | SKIP — MANUAL REVIEW |

## Exact availability preview

The sheet describes 331 color/configuration candidate cells when each listed
configuration is paired with the product-level color list for review. This is
not permission to enable the cross-product.

- 19 exact single-configuration combinations are safe to prepare for enabling
  during a later approved import: Xiaomi 17 Ultra Black (1); Apple iPhone 17
  256GB in five supplied colors (5); POCO Pad X1 8GB/512GB in Gray and Blue
  (2); Infinix Note 60 Pro 5G 8GB physical + 8GB extended/256GB in the five
  exact supplied colors other than unresolved `Forest` (5); and TECNO Camon 50
  8GB physical + 8GB extended/256GB in six supplied colors (6).
- 312 candidate cells remain OFF. This includes all 174 candidate cells built
  from merged multi-configuration color lists, every Coming Soon or unmatched
  product, every missing/invalid SKU, and every unresolved color.
- Migration 19's existing Apple iPhone 17 Black/256GB choice is preserved. No
  unrelated Admin availability selection is reset.

## Test-data diagnosis and proposed correction

### Xiaomi 17

The public ₱11 value comes from the active commercial variant itself, not from
display order or currency conversion. Product `049bbf54-a5d7-4e4d-8a5a-00029707440b`
has variant `b9ac94fe-eb2c-408e-8922-91a24900001d`, placeholder SKU `1111`,
variant name `Red, Black, Blue`, 11GB RAM, 11GB extended RAM, 11GB storage,
selling price ₱11, and SRP ₱11. Its active red color is also placeholder data.
The safe correction is an in-place normalization of this product ID: replace
the placeholder commercial variant with the supplied 12GB/512GB configuration,
set both selling price and SRP to ₱64,990, remove sale presentation, reconcile
only manufacturer-supported supplied colors, and keep availability OFF until a
legitimate internal SKU replaces `1111`.

### Xiaomi 17T Pro

The public ₱1 value also comes from an active placeholder commercial variant.
Product `8a929a57-f2c7-4421-a606-906e4609c9b7` has variant
`609f0d7e-65b1-437f-9784-c73e6295c37e`, name `test`, SKU `TEST`, 100GB
extended RAM, 100GB storage, selling price ₱1, and SRP ₱100. It is marked as a
sale and has no valid exact color relationship. The safe correction is an
in-place normalization of the same product ID: replace the placeholder variant
with 12GB/512GB, set both selling price and SRP to ₱55,990, remove the sale
state, normalize `BLAC` to official Black, and keep every combination OFF until
a legitimate internal SKU replaces `TEST`.

Neither record is duplicated, and neither should be deleted blindly.

## Final counts

- Mapping rows reviewed: 71
- Supplied configuration rows reviewed: 97
- `READY` rows: 7
- Rows with safe text normalization documented: 5
- `NEEDS MANUAL REVIEW` rows: 62
- `INVALID TEST DATA` rows: 2
- Existing matched product records missing commercial SKU: 50
- Additional unmatched supplied products without any record/SKU: 11
- Placeholder SKUs that must be replaced: 2 (`1111`, `TEST`)
- Exact combinations ready for a later approved enable step: 19
- Candidate combinations remaining OFF: 312
- Supplied discounted prices used: 0
- Duplicate products created: 0

## Exact unresolved items

### Product identity or edition

- Redmi K100 Pro Max 5G; Redmi K100 Pro 5G; POCO F8 Pro 5G; Apple iPhone
  17 Pro; Apple iPhone 17 Pro Max; Redmi Pad SE 8.7; HONOR 400 5G; Infinix
  GT 50 Pro 5G; Infinix XPad 30E; TECNO Mega Pad 2 Lite; and OPPO A6C have no
  existing product record.
- iQOO's official catalog confirms that Z10 Turbo+ and Z10 Turbo Pro are
  separate models, so the supplied hybrid name `Z10 Turbo Pro+` cannot be
  assigned to either record safely.
- POCO X8 Pro Ironman is not proven to be a separate database product or a
  color/edition of the existing X8 Pro.
- Redmi Pad 2 Pro does not establish whether the supplied unit is the existing
  5G record.
- TECNO Spark 50 5G is not proven to be the same regional model as the current
  TECNO Spark 50 record.
- Samsung A07 does not establish LTE/5G identity, and the supplied color phrase
  conflicts with official LTE colors.

### Color

- Infinix Note 60 Pro `Forest`
- Infinix Note Edge `Shadow Black`
- Xiaomi 17 `White` (not in the audited official color list)
- Redmi Note 15's nearby Violet/Blue/Opal White/Black row ownership
- Samsung A07 `Gray, Light, Violet, Dark Green`
- All color lists merged across more than one RAM/storage configuration

### RAM/storage

- Infinix Hot 70 and Redmi Pad SE 8.7 have no supplied RAM/storage.
- Infinix GT 30 Pro, TECNO Camon 50 Ultra, TECNO Pova Curve 2, TECNO Spark Go
  3, and Infinix Smart 20 require physical RAM to be separated from extended
  RAM before commercial variants are created.
- Every multi-configuration product needs explicit per-configuration color
  ownership before any of its merged colors can be enabled.

## Production import result

The reviewed limited import was executed on 2026-08-22 after a forced-rollback
dry run reproduced the approved write set. It updated only the 7 READY price
rows, enabled the 19 exact approved color/variant relationships, and made the
two placeholder-SKU test products non-public while retaining their product,
variant, and placeholder SKU identifiers for later manual correction.

Post-import read-only verification confirmed 19 expected relationships, 19
enabled relationships, 19 active expected colors, 7 matching non-discounted
prices, 2 neutralized test records, zero duplicate product slugs, zero
duplicate variant/color rows, 66 unchanged Coming Soon products, and 21
synchronized migration versions. The other 312 candidate combinations remain
outside the approved enable set. The 62 manual-review rows, including 50
matched Coming Soon records without commercial SKUs and 11 unmatched products,
remain unavailable and were not imported. No supplied discounted price was
used.
