# GadgetMoTo Available Product Import Mapping

## Status and authority

This is the required pre-import mapping report for the GadgetMoTo availability
sheet supplied on 2026-08-22. No database row, catalog record, price, color, or
availability flag is changed by this report.

The supplied sheet is authoritative for products currently sold by
GadgetMoTo, their current colors, and SRP. The sheet's Sale Price column is
explicitly excluded. Manufacturer material may clarify model identity,
physical RAM, storage, and official color spelling, but it must not expand
GadgetMoTo availability.

The report compares the sheet with the repository catalog and the public
database-backed storefront. The public storefront currently exposes 14 active
product routes; the remaining matched records are Coming Soon records without
public commerce prices. A protected Admin/database read must still confirm
their internal IDs, inactive prices, SKUs, and current statuses before an
import migration or Admin import is authored.

## Import rules established by the sheet

- Supplied SRP becomes both the active selling price and SRP for launch.
- The supplied Sale Price is never imported.
- Active sale badges or crossed-out historical prices must not remain on a
  supplied launch configuration.
- A product-level color list may populate the product's available color set.
- A color/storage combination is enabled only when the sheet identifies the
  exact relationship. A merged color cell across multiple configurations does
  not prove every cross-product combination.
- Manufacturer-confirmed colors not present in this sheet remain visible only
  as unavailable when the Admin model supports that distinction.
- No product, SKU, RAM value, storage value, or color is invented.

## Mapping report

`Coming Soon / no public price` means the record exists but the public site
does not expose a commercial price. `No existing record` means the supplied
identity must not be silently created during import. Prices below are pesos.

| # | Supplied product | Matched GadgetMoTo record | Supplied configuration SRP | Supplied available colors | Current public price | Mapping and proposed action |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Xiaomi 17 Pro Max 5G | `xiaomi-17-pro-max` | 16GB/1TB ₱78,990; 16GB/512GB ₱72,990; 12GB/512GB ₱68,990 | White, Black, Purple, Green | Coming Soon / no public price | Confident match. Add three commercial configurations after Admin ID/SKU review. Shared color cell does not prove exact storage/color pairs; keep combinations OFF. |
| 2 | Xiaomi 17 Pro 5G | `xiaomi-17-pro` | 16GB/512GB ₱62,990; 12GB/512GB ₱59,990; 12GB/256GB ₱56,990 | White, Black, Purple, Green | Coming Soon / no public price | Confident match. Add configurations after SKU review; shared colors remain OFF per exact combination. |
| 3 | Xiaomi 17 Ultra 5G Leica with Kit | `xiaomi-17-ultra-5g-leica-kit` | 16GB/512GB ₱84,990 | Black | ₱84,990 | Exact active match. Set selling price and SRP to ₱84,990, remove stale sale presentation, and enable Black only for 16GB/512GB. |
| 4 | Redmi K100 Pro Max 5G | No existing record | 12GB/256GB ₱49,990; 12GB/512GB ₱54,990 | White, Black, Blue, Burgundy | — | Unmatched. Do not create automatically. Exact product identity, media, slug, and commercial SKU are required. |
| 5 | Redmi K100 Pro 5G | No existing record | 12GB/256GB ₱42,990 | White, Black, Light Green, Burgundy | — | Unmatched. Do not create automatically. |
| 6 | Redmi K90 5G | `redmi-k90` | 12GB/256GB ₱33,990 | Black, White, Blue, Purple | Coming Soon / no public price | Confident match. Single configuration permits the four supplied colors to be enabled after SKU review. |
| 7 | Redmi K90 Max 5G | `redmi-k90-max` | 12GB/256GB ₱35,990 | Silver, Blue, Black | Coming Soon / no public price | Confident match. Single configuration permits the three supplied colors. |
| 8 | Redmi K90 Pro Max 5G | `redmi-k90-pro-max` | 12GB/256GB ₱45,990 | Black, White, Denim Blue | Coming Soon / no public price | Confident match. Single configuration permits the three supplied colors. |
| 9 | Redmi Turbo 5 Max | `redmi-turbo-5-max` | 12GB/256GB ₱27,990; 12GB/512GB ₱32,990 | Black, White, Blue, Orange | Coming Soon / no public price | Confident match. Shared colors do not prove exact pairings; combinations remain OFF. |
| 10 | Redmi Turbo 4 Pro | `redmi-turbo-4-pro` | 12GB/256GB ₱25,990; 16GB/512GB ₱28,990 | Black, White, Green | Coming Soon / no public price | Confident match. Shared colors do not prove exact pairings; combinations remain OFF. |
| 11 | Redmi Turbo 4 | `redmi-turbo-4` | 12GB/256GB ₱22,990 | Black, White, Blue | Coming Soon / no public price | Confident match. Single configuration permits the supplied colors. |
| 12 | vivo iQOO 15 Ultra 5G | `iqoo-15-ultra` | 16GB/512GB ₱67,990 | Black, Silver | Coming Soon / no public price | Confident match. Single configuration permits Black and Silver after official naming review. |
| 13 | vivo iQOO 15 5G | `iqoo-15` | 12GB/256GB ₱47,990; 16GB/512GB ₱52,990 | Alpha, Legend, Gray, Green, Blue, Apex | Coming Soon / no public price | Confident product match. The sheet mixes possible editions and colors; exact pairings remain OFF pending review. |
| 14 | vivo iQOO Z11 Turbo 5G | `iqoo-z11-turbo` | 12GB/256GB ₱32,990 | White, Black, Blue, Pink | Coming Soon / no public price | Confident match. Single configuration permits supplied colors after official naming review. |
| 15 | vivo iQOO Z11 5G | `iqoo-z11` | 12GB/256GB ₱24,990 | Cosmic Black, Glacier Blue | Coming Soon / no public price | Confident match. Single configuration permits supplied colors. |
| 16 | vivo iQOO Z10 Turbo Pro+ | Ambiguous: `iqoo-z10-turbo-plus` or `iqoo-z10-turbo-pro` | 12GB/256GB ₱26,990; 16GB/512GB ₱29,990 | White, Gray, Gold | Coming Soon / no public price | Do not import. Existing records represent two different identities; model code or exact image confirmation is required. |
| 17 | HONOR WIN 5G | `honor-win` | 12GB/256GB ₱45,990; 12GB/512GB ₱49,990 | Black, White, Blue | Coming Soon / no public price | Confident match to the China-official WIN phone. Shared colors do not prove exact pairings; combinations remain OFF. |
| 18 | HONOR WIN RT | `honor-win-rt` | 12GB/256GB ₱37,990; 12GB/512GB ₱40,990 | Black, White, Blue | Coming Soon / no public price | Confident match to the China-official WIN RT phone. Shared colors do not prove exact pairings. |
| 19 | Lenovo Legion Y70 2026 5G | `lenovo-legion-y70-2026` | 12GB/256GB ₱29,990 | Black, White | Coming Soon / no public price | Confident match to the reviewed Y70 New Generation phone record. Single configuration permits supplied colors. |
| 20 | Lenovo Legion Tab Y700 4th Gen | `lenovo-legion-tab-y700` | 12GB/256GB ₱30,990 | Black, White | Coming Soon / no public price | Confident fourth-generation tablet match. Single configuration permits supplied colors. |
| 21 | OnePlus Ace 6T | `oneplus-ace6t` | 12GB/256GB ₱32,990 | Black, Purple, Green | Coming Soon / no public price | Confident match. Single configuration permits supplied colors after official spelling review. |
| 22 | POCO F8 Ultra 5G | `poco-f8-ultra` | 12GB/256GB ₱59,990; 16GB/512GB ₱60,990 | Black, White, Denim Blue | ₱46,990 | Exact active match. Existing 16GB/512GB price must become ₱60,990; add 12GB/256GB after SKU review. Shared colors remain OFF per exact pair. Remove stale non-SRP pricing. |
| 23 | POCO F8 Pro 5G | No existing record | Sheet shows two 12GB/256GB rows: ₱45,990 and ₱49,990 | Titanium Silver, Blue, Black | — | Unmatched and internally ambiguous. Do not create or import until the duplicate configuration/prices are corrected. |
| 24 | POCO Pad X1 | `poco-pad-x1` | 8GB/512GB ₱32,990 | Gray, Blue | ₱23,990 | Exact active match. Set selling price/SRP to ₱32,990, remove stale sale presentation, and enable Gray and Blue for the sole configuration. |
| 25 | POCO Pad M1 | `poco-pad-m1` | 8GB/256GB ₱24,990 | Gray, Blue | Coming Soon / no public price | Confident match. Single configuration permits the supplied colors. |
| 26 | POCO X8 Pro Max 5G | `poco-x8-pro-max` | 12GB/256GB ₱42,990; 12GB/512GB ₱44,990 | Black, White, Blue | Coming Soon / no public price | Confident match. Shared colors remain OFF per exact combination. |
| 27 | POCO X8 Pro 5G Ironman | Possible edition under `poco-x8-pro` | 12GB/512GB ₱36,990 | Black with Ironman design | Coming Soon / no public price | Do not merge automatically. Confirm whether this is a distinct product or a commercial edition of the existing X8 Pro record. |
| 28 | POCO X8 Pro 5G | `poco-x8-pro` | 12GB/512GB ₱36,990; 8GB/512GB ₱34,990; 8GB/256GB ₱29,990 | Black, White, Mint Green, Yellow | Coming Soon / no public price | Confident match. Shared colors remain OFF per exact combination. |
| 29 | POCO F7 5G | `poco-f7` | 12GB/256GB ₱27,990; 12GB/512GB ₱29,990 | Black, White, Cyber Silver | Coming Soon / no public price | Confident match. Shared colors remain OFF per exact combination. |
| 30 | POCO M8 Pro 5G | `poco-m8-pro-5g` | 8GB/256GB ₱24,990; 12GB/512GB ₱29,990 | Black, Green, Silver | Coming Soon / no public price | Confident match. Shared colors remain OFF per exact combination. |
| 31 | POCO M8 5G | `poco-m8-5g` | 8GB/256GB ₱22,990; 8GB/512GB ₱24,990 | Black, Green, Silver | Coming Soon / no public price | Confident match. Shared colors remain OFF per exact combination. |
| 32 | POCO M8S 5G | `poco-m8s` | 8GB/256GB ₱15,990 | Black, White | Coming Soon / no public price | Confident match; normalize the existing omitted 5G suffix only after identity review. Single configuration permits supplied colors. |
| 33 | POCO C81 Pro | `poco-c81-pro` | 4GB/128GB ₱8,990; 4GB/256GB ₱9,990 | Black, Gold, Green | Coming Soon / no public price | Confident match. Shared colors remain OFF per exact combination. |
| 34 | POCO C71 | `poco-c71` | 3GB/64GB ₱6,990; 4GB/128GB ₱7,990 | Power Black, Cool Blue, Desert Gold | Coming Soon / no public price | Confident match. Shared colors remain OFF per exact combination. |
| 35 | Apple iPhone 14 | `apple-iphone-14` | 128GB ₱39,990 | Midnight, Purple, Starlight, Blue, Red, Yellow | Coming Soon / no public price | Confident match. Apple physical RAM remains null. Single storage permits supplied colors. |
| 36 | Apple iPhone 15 | `apple-iphone-15` | 128GB ₱46,990 | Black, Blue, Green, Yellow, Pink | Coming Soon / no public price | Confident match. Apple physical RAM remains null. Single storage permits supplied colors. |
| 37 | Apple iPhone 16 | `apple-iphone-16` | 128GB ₱50,990 | Black, White, Pink, Teal, Ultramarine | Coming Soon / no public price | Confident match. Normalize `Ultra Marine` to official `Ultramarine` only after source review. Apple RAM remains null. |
| 38 | Apple iPhone 17 | `apple-iphone-17` | 256GB ₱62,990 | Black, White, Mist Blue, Sage, Lavender | ₱57,990 | Exact active match. Set selling price/SRP to ₱62,990, keep Apple RAM null, remove stale launch price, and enable all five colors for 256GB. |
| 39 | Apple iPhone 17 Pro | No existing record | 256GB ₱80,990 | Silver, Cosmic Orange, Deep Blue | — | Unmatched. Do not create automatically. |
| 40 | Apple iPhone 17 Pro Max | No existing record | 256GB ₱89,990 | Silver, Cosmic Orange, Deep Blue | — | Unmatched. Do not create automatically. |
| 41 | Xiaomi 17 5G | `xiaomi-17` | 12GB/512GB ₱64,990 | Black, Venture Green, Alpine Pink, Ice Blue, White | ₱11 | Exact live identity but corrupted/test commerce data. Replace the ₱11 price only through reviewed import, normalize `Alphine` after official spelling verification, and enable the sole exact configuration colors. |
| 42 | Xiaomi 17T Pro 5G | `xiaomi-17t-pro` | 12GB/512GB ₱55,990 | Deep Blue, Deep Violet, `BLAC` (truncated in sheet) | ₱1 | Exact live route but test product data. Do not infer `BLAC` as Black until confirmed. Correct name/configuration/price only through reviewed import. |
| 43 | Xiaomi 17T 5G | `xiaomi-17t` | 12GB/256GB ₱39,990; 12GB/512GB ₱43,990 | Violet, Blue, Opal White, Black | Coming Soon / no public price | Confident match. Shared colors remain OFF per exact combination. |
| 44 | Redmi Note 15 Pro 5G | `redmi-note-15-pro-5g` | 8GB/256GB ₱22,990 | Black, Glacier Blue, Mist Purple, Titanium | Coming Soon / no public price | Confident match. Single configuration permits supplied colors. |
| 45 | Redmi Note 15 4G | Probable `redmi-note-15` | 8GB/256GB ₱16,990 | Black, Glacier Blue, Mist Purple; a nearby Violet/Blue/Opal White/Black line has uncertain row ownership | Coming Soon / no public price | Do not import colors yet. Confirm the 4G identity and the sheet row boundary. |
| 46 | Redmi 15C 5G | `redmi-15c-5g` | 8GB/256GB ₱11,990 | Moonlight Blue, Mint Green, Midnight Gray, Twilight Orange | Coming Soon / no public price | Confident match. Single configuration permits supplied colors. |
| 47 | Redmi A7 Pro | `redmi-a7-pro` | 4GB/128GB ₱9,990 | Black, Mist Blue, Palm Green, Sunset Orange | Coming Soon / no public price | Confident match. Single configuration permits supplied colors. |
| 48 | Xiaomi Pad 8 | `xiaomi-pad-8` | 8GB/128GB ₱29,990; 8GB/256GB ₱34,990 | Black, Blue, Green | ₱19,990 | Exact active match. Update existing 8GB/128GB to ₱29,990 and add 8GB/256GB after SKU review. Shared colors remain OFF per exact pair. Remove stale sale pricing. |
| 49 | Redmi Pad 2 Pro | Possible `redmi-pad-2-pro-5g` | 8GB/256GB ₱24,990 | Graphite Gray, Silver, Lavender Purple | ₱18,990 on the 5G record | Do not import until Wi-Fi/5G identity is confirmed. The sheet omits 5G while the active record includes it. |
| 50 | Redmi Pad SE 8.7 | No exact record | Configuration not supplied; ₱8,990 | Aurora Green, Sky Blue, Graphite Gray | — | `redmi-pad-2-se` is a different named record. Do not merge or create automatically; RAM/storage are also missing. |
| 51 | HONOR X9D | `honor-x9d` | 12GB/256GB ₱20,990 | Reddish Brown, Midnight Black, Sunrise Gold | Coming Soon / no public price | Confident match. Single configuration permits supplied colors. |
| 52 | HONOR 400 5G | No existing record | 12GB/512GB ₱23,990 | Midnight Black, Meteor Silver, Desert Gold, Tidal Blue | — | Unmatched. Do not create automatically. |
| 53 | HONOR 600 5G | Probable `honor-600` | 8GB/256GB ₱29,990 | Golden White, Black, Orange | Coming Soon / no public price | High-confidence family match, but confirm the exact 5G commercial identity before import. |
| 54 | Infinix Note 60 Ultra 5G | Probable `infinix-note-60-ultra` | 12GB/512GB ₱36,990 | Torino Black, Monza Red, Roma Silver, Almafi Blue | Coming Soon / no public price | High-confidence match. Confirm official 5G suffix and `Almafi` spelling before enabling. |
| 55 | Infinix GT 50 Pro 5G | No existing record | 12GB/256GB ₱29,990 | Black Abyss, Red Blaze, Silver Glacier | — | Unmatched. Do not confuse with existing GT30 Pro. |
| 56 | Infinix Note 60 Pro 5G | `infinix-note-60-pro-5g` | Listed as 16GB/256GB; ₱20,990 | Mist Titanium, Deep Ocean Blue, Solar Orange, Mocha Brown, Torino Black, `Forest` | ₱19,990 | Exact active product. Preserve verified 8GB physical + 8GB extended RAM rather than writing 16GB physical RAM. Set selling price/SRP to ₱20,990. Confirm whether `Forest` is truncated before importing that color. |
| 57 | Infinix Note Edge 5G | `infinix-note-edge-5g` | 8GB/256GB ₱16,990 | Lunar Titanium, Silk Green, Stellar Blue, Shadow Black, Orange | Coming Soon / no public price | Confident match. Verify whether `Orange` means official Solar Orange and whether Shadow Black belongs to this exact model before import. |
| 58 | Infinix GT 30 Pro 5G | Probable `infinix-gt30-pro` | 16GB/256GB ₱18,990 | Dark Flare, Blade White, Shadow Ash | Coming Soon / no public price | High-confidence model match; confirm 5G suffix and whether 16GB includes extended RAM. |
| 59 | Infinix GT 30 5G | `infinix-gt30-5g` | 8GB/256GB ₱15,990 | Pulse Green, Cyber Blue, Blade White | Coming Soon / no public price | Confident match. Single configuration permits supplied colors. |
| 60 | Infinix Hot 70 | `infinix-hot-70` | RAM/storage not supplied; ₱10,990 | Night Pulse, Dive Blue, Silver Dancer, Thermo Orange, Green Texture, Quiet Violet | Coming Soon / no public price | Product match is confident, but no commercial configuration can be created without RAM/storage. Keep unavailable. |
| 61 | Infinix Smart 20 | `infinix-smart-20` | 6GB/64GB ₱6,990; 8GB/128GB ₱7,990 | Shadow Black, Cloudline Blue, Polaris Titanium, Sunlike Orange | Coming Soon / no public price | Confident product match. Manufacturer research currently records different physical RAM; reconcile physical versus extended RAM before import. Shared colors remain OFF per exact pair. |
| 62 | Infinix XPad 30E | No existing record | 8GB/256GB ₱13,990 | Dreamy Purple, Forest Green, Deep Blue | — | Unmatched. Do not create automatically. |
| 63 | TECNO Mega Pad 2 Lite | No existing record | 8GB/256GB ₱19,990 | Vitality Green, Starfall Gray, Energetic Orange | — | Unmatched. Do not merge with TECNO Mega Pad Pro. |
| 64 | TECNO Camon 50 Ultra 5G | Probable `tecno-camon-50-ultra` | Listed as 16GB/256GB; ₱20,990 | Moonshadow Black, Cypress Green, Nebula Titanium, Luminous Orange, Misty Purple | Coming Soon / no public price | High-confidence match to the official 5G model. Verify physical versus extended RAM before import. |
| 65 | TECNO Camon 50 | `tecno-camon-50` | Listed as 16GB/256GB; ₱15,990 | Moonlight Black, Malachite Green, Nebula Titanium, Fir Green, Lavender Mist, Mint Cream | ₱13,490 | Exact active match. Preserve verified 8GB physical + 8GB extended RAM. Set selling price/SRP to ₱15,990 and remove stale sale presentation. |
| 66 | TECNO Pova Curve 2 5G | Probable `tecno-pova-curve-2` | Listed as 16GB/256GB; ₱19,990 | Mystic Purple, Melting Silver, Storm Titanium | Coming Soon / no public price | High-confidence match to the official 5G model. Verify physical versus extended RAM before import. |
| 67 | TECNO Spark 50 5G | Probable `tecno-spark-50` | `NEW` 8GB/128GB ₱10,990; 8GB/256GB ₱15,990 | Fantasy Purple, Mint Green, Ink Black, Champagne Gold | Coming Soon / no public price | Do not import until the existing regional Spark 50 record is proven to be the same 5G model and `NEW` is confirmed as merchandising text, not a separate model. |
| 68 | TECNO Spark Go 3 | `tecno-spark-go-3` | 8GB/64GB ₱6,990; 8GB/128GB ₱7,990 | Titanium Grey, Ink Black, Galaxy Blue, Aurora Purple | Coming Soon / no public price | Confident match. Shared colors remain OFF per exact pair. Verify whether listed RAM includes extended RAM. |
| 69 | vivo Y05 | `vivo-y05` | 4GB/128GB ₱8,990 | Voyage Black, Haze Blue, Summit Platinum | Coming Soon / no public price | Confident match. Single configuration permits supplied colors. |
| 70 | OPPO A6C | No existing record | 4GB/128GB ₱8,990 | Stone Brown, Feather Purple, Feather White | — | Unmatched. Do not confuse with existing OPPO A6T. |
| 71 | Samsung A07 | Probable `samsung-galaxy-a07-lte` | 4GB/128GB ₱9,990 | Sheet reads `Gray, Light, Violet, Dark Green` | Coming Soon / no public price | Confirm exact Galaxy A07/LTE identity and color punctuation before import; current official research supports a different configuration/color set. |

## Mapping totals

- Supplied product models: 71
- Supplied configuration rows: 97
- Confident existing-record matches: 49
- Probable existing-record matches requiring identity or suffix confirmation: 9
- Ambiguous existing-record matches: 2
- No existing matching record: 11
- Prices imported in this mapping pass: 0
- Colors imported in this mapping pass: 0
- Exact availability combinations enabled in this mapping pass: 0
- SRPs imported in this mapping pass: 0
- Supplied discounted prices imported: 0

## Blocking review items before import

1. Confirm exact identities for iQOO Z10 Turbo Pro+, POCO X8 Pro Ironman,
   Redmi Note 15 4G, Redmi Pad 2 Pro, HONOR 600 5G, Infinix Note 60 Ultra
   5G, Infinix GT 30 Pro 5G, TECNO Camon 50 Ultra 5G, TECNO Pova Curve 2
   5G, TECNO Spark 50 5G, and Samsung A07.
2. Correct the duplicated POCO F8 Pro 12GB/256GB rows and identify the intended
   second configuration or SRP.
3. Supply RAM/storage for Infinix Hot 70 and Redmi Pad SE 8.7.
4. Clarify truncated or uncertain sheet text: Xiaomi 17T Pro `BLAC`, Infinix
   Note 60 Pro `Forest`, Infinix Note Edge `Orange`, Redmi Note 15 color-row
   ownership, and Samsung A07 color punctuation.
5. Decide whether new product intake is authorized for the 11 supplied models
   with no existing record. The mapping rule forbids silently creating them.
6. Review or create internal SKUs for every new commercial configuration. The
   sheet is not an SKU source.
7. Confirm exact per-storage colors for every multi-configuration product. The
   merged product-level color cells establish available colors but do not prove
   every color/storage combination.

## Existing live-price corrections identified

The report found live records whose storefront price does not match the new
authoritative SRP: POCO F8 Ultra, POCO Pad X1, Apple iPhone 17, Xiaomi 17,
Xiaomi 17T Pro, Xiaomi Pad 8, Infinix Note 60 Pro 5G, and TECNO Camon 50.
Xiaomi 17 and Xiaomi 17T Pro visibly contain test prices (₱11 and ₱1). Redmi
Pad 2 Pro is not included in this correction list until its 5G identity is
confirmed. Xiaomi 17 Ultra already displays ₱84,990, but its stale crossed-out
₱89,990 presentation must be removed because the supplied launch price is SRP
only.

The mapping report itself performs no write. The later approved limited
production import applied only the 7 READY SRP updates, enabled 19 exact
color/variant relationships, and neutralized the two public placeholder-price
records without replacing their identifiers or fabricating SKUs. Read-only
verification found zero duplicate product slugs and zero duplicate
variant/color rows. All unmatched, missing-SKU, ambiguous, and other
manual-review rows remain untouched and unavailable.
