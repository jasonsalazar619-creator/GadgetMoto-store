# GadgetMoTo Product Image Inventory

## Audit summary

- Audit date: 2026-07-28
- Local intake folder: `GADGET-MOTO/`
- Repository image files after build/cache exclusions: 94
- Brand-logo files excluded from product mapping: 2
- Product-looking source and active files reviewed: 92
- Files inspected in the intake folder: 82
- Product-poster files: 81
- Brand-logo files: 1
- Existing catalog products matched: 11 of 12
- Unique incomplete new-product candidates: 68
- Non-transactional preview images published: 68 exact source copies
- Exact binary duplicates among intake sources: 0
- Intentional source-to-public exact-copy pairs: 11
- Ambiguous files: 1
- Product gallery size after this checkpoint: zero additional images; each
  mapped product has one separate primary image
- Storefront presentation: square, centered, `object-contain` media with
  consistent internal padding across customer-facing product surfaces

The 11 published images are approved user-supplied GadgetMoTo project assets.
Each public image is now an exact byte copy of its original source poster. No
crop, resize, compression, conversion, watermark addition, or other edit was
performed. No manufacturer-page image was downloaded for this checkpoint.
POCO C85 remains intentionally unmapped and continues to use the safe generated
placeholder while awaiting an approved local image.

The source posters are retained locally and ignored by Git. The tracked public
copies preserve the complete original canvases and intrinsic aspect ratios so
device edges are not removed by source processing. Embedded poster text remains
part of the original supplied pixels but is not imported as structured catalog
data. Canonical specifications, prices, variants, availability, and policies
remain controlled by the typed transactional catalog and reviewed
documentation. The separate `/coming-soon` page shows all 68 unique candidates
as previews only.

## Existing-product mapping

| Existing product | Source | Confidence | Published primary image | Media role |
| --- | --- | --- | --- | --- |
| Xiaomi 17 Ultra 5G Leica Kit | `GADGET-MOTO/ChatGPT Image Jun 7, 2026, 05_15_10 PM.png` | Probable; manually matched to the exact visible product name | `public/products/xiaomi-17-ultra-5g-leica-kit/original.png` | Primary only |
| Apple iPhone 17 | `GADGET-MOTO/IPHONE 17.PNG` | Exact product name | `public/products/apple-iphone-17/original.png` | Primary only |
| POCO F8 Ultra | `GADGET-MOTO/POCO F8 ULTRA.PNG` | Exact product name | `public/products/poco-f8-ultra/original.png` | Primary only |
| Redmi Note 15 Pro Plus 5G | `GADGET-MOTO/REDMI NOTE15 PRO PLUS.PNG` | Exact product family; visible poster confirms 5G model | `public/products/redmi-note-15-pro-plus-5g/original.png` | Primary only |
| Redmi Turbo 5 | `GADGET-MOTO/REDMI TURBO 5.PNG` | Exact product name | `public/products/redmi-turbo-5/original.png` | Primary only |
| Infinix Note 60 Pro 5G | `GADGET-MOTO/Note60PRO.PNG` | Probable; visible poster confirms the complete model | `public/products/infinix-note-60-pro-5g/original.png` | Primary only |
| TECNO Camon 50 | `GADGET-MOTO/TECNO CAMON 50.PNG` | Exact product name | `public/products/tecno-camon-50/original.png` | Primary only |
| POCO C85 | No suitable file discovered | Unmapped | Existing generated placeholder retained | Placeholder |
| POCO Pad X1 | `GADGET-MOTO/POCO PAD X1.PNG` | Exact product name | `public/products/poco-pad-x1/original.png` | Primary only |
| Xiaomi Pad 8 | `GADGET-MOTO/XIAOMI PAD 8.PNG` | Exact product name | `public/products/xiaomi-pad-8/original.png` | Primary only |
| Redmi Pad 2 Pro 5G | `GADGET-MOTO/REDMIPAD 2 PRO.PNG` | Exact product family; visible poster confirms 5G model | `public/products/redmi-pad-2-pro-5g/original.png` | Primary only |
| TECNO Mega Pad Pro | `GADGET-MOTO/TECNO MEGAPAD PRO.PNG` | Exact product name | `public/products/tecno-mega-pad-pro/original.png` | Primary only |

The mapped products each have only one unique suitable source image, so each is
an explicit primary image and the additional gallery arrays remain empty. No
empty thumbnail controls or duplicate gallery frames are added.

The final storefront audit confirmed that the 11 published image paths remain
unique, each is assigned only to its matching product, and POCO C85 continues
to use the approved generated placeholder. No external image hotlink, Base64
image, fabricated product photo, or cross-product substitution was added.

## Source-file metadata

`Alpha` records whether the safely inspected pixel format contains an alpha
channel. Sizes are in bytes. Candidate identity and readiness are documented in
`docs/new-product-intake.md`.

| Repository-relative source path | Type | Size | Dimensions | Alpha |
| --- | --- | ---: | ---: | --- |
| `GADGET-MOTO/ChatGPT Image Jun 7, 2026, 05_15_10 PM.png` | PNG | 2129680 | 1024×1536 | No |
| `GADGET-MOTO/Gadgetmoto logo.jpg` | JPG | 85310 | 901×900 | No |
| `GADGET-MOTO/HONOR 600.PNG` | PNG | 1984735 | 1024×1536 | Yes |
| `GADGET-MOTO/HONOR WIN RT.PNG` | PNG | 1897295 | 1024×1536 | Yes |
| `GADGET-MOTO/HONOR WIN.PNG` | PNG | 2005750 | 1024×1536 | Yes |
| `GADGET-MOTO/HONOR X9D.PNG` | PNG | 1953298 | 1024×1536 | Yes |
| `GADGET-MOTO/INFINIX GT30 5G.PNG` | PNG | 2090779 | 1024×1536 | Yes |
| `GADGET-MOTO/INFINIX GT30 PRO.PNG` | PNG | 2032413 | 1024×1536 | Yes |
| `GADGET-MOTO/INFINIX HOT 70.PNG` | PNG | 1931773 | 1024×1535 | Yes |
| `GADGET-MOTO/INFINIX NOTE EDGE 5g.PNG` | PNG | 1923318 | 1024×1536 | Yes |
| `GADGET-MOTO/Infinix NOTE60 ULTRA.PNG` | PNG | 2175063 | 1024×1536 | Yes |
| `GADGET-MOTO/Infinix Smart 20.PNG` | PNG | 1970854 | 1024×1536 | Yes |
| `GADGET-MOTO/IPAD A16 11th Gen.PNG` | PNG | 2050041 | 1024×1536 | Yes |
| `GADGET-MOTO/IPHONE 14.PNG` | PNG | 2329959 | 1024×1536 | Yes |
| `GADGET-MOTO/IPHONE 15.PNG` | PNG | 1774121 | 1024×1536 | No |
| `GADGET-MOTO/IPHONE 16.PNG` | PNG | 1971486 | 1024×1536 | Yes |
| `GADGET-MOTO/IPHONE 17.PNG` | PNG | 1946393 | 1024×1536 | Yes |
| `GADGET-MOTO/IQOO 15 ULTRA .PNG` | PNG | 2152673 | 1024×1536 | Yes |
| `GADGET-MOTO/IQOO 15.PNG` | PNG | 2060181 | 1024×1536 | Yes |
| `GADGET-MOTO/IQOO Z10 TURBO PLUS.PNG` | PNG | 2080561 | 1023×1537 | Yes |
| `GADGET-MOTO/IQOO Z10 TURBO PRO.PNG` | PNG | 2083966 | 1024×1536 | Yes |
| `GADGET-MOTO/IQOO Z11 TURBO.PNG` | PNG | 2145899 | 1023×1537 | Yes |
| `GADGET-MOTO/IQOO Z11.PNG` | PNG | 2038410 | 1024×1536 | Yes |
| `GADGET-MOTO/ITEL POWER70.PNG` | PNG | 1812065 | 1024×1536 | Yes |
| `GADGET-MOTO/ITEL S26 ULTRA.PNG` | PNG | 2476301 | 1023×1537 | Yes |
| `GADGET-MOTO/LEGION TAB Y700 GEN5.PNG` | PNG | 2109083 | 1024×1536 | Yes |
| `GADGET-MOTO/LEGION Y70 2026.PNG` | PNG | 2077234 | 1024×1536 | Yes |
| `GADGET-MOTO/LENOVO LEGION TAB Y700.PNG` | PNG | 1857439 | 1024×1536 | Yes |
| `GADGET-MOTO/Lenovo Legion Y70 2026.png` | PNG | 1995478 | 1024×1536 | Yes |
| `GADGET-MOTO/Note60PRO.PNG` | PNG | 1962783 | 1024×1536 | Yes |
| `GADGET-MOTO/Oneplus ace6t.PNG` | PNG | 2022075 | 1024×1536 | Yes |
| `GADGET-MOTO/OPPO A6T.PNG` | PNG | 2077171 | 1024×1536 | Yes |
| `GADGET-MOTO/POCO C71.PNG` | PNG | 2034120 | 1024×1536 | Yes |
| `GADGET-MOTO/POCO C81PRO.PNG` | PNG | 2113224 | 1024×1536 | Yes |
| `GADGET-MOTO/Poco F6.png` | PNG | 2128006 | 1024×1536 | Yes |
| `GADGET-MOTO/POCO F7.PNG` | PNG | 2124266 | 1023×1537 | Yes |
| `GADGET-MOTO/POCO F8 ULTRA.PNG` | PNG | 2170439 | 1023×1537 | Yes |
| `GADGET-MOTO/POCO M8 5G.PNG` | PNG | 2052968 | 1024×1536 | Yes |
| `GADGET-MOTO/POCO M8 PRO 5G.png` | PNG | 1935324 | 1024×1536 | No |
| `GADGET-MOTO/POCO M8s.PNG` | PNG | 2051374 | 1024×1536 | Yes |
| `GADGET-MOTO/POCO PAD M1.PNG` | PNG | 2083654 | 1023×1537 | Yes |
| `GADGET-MOTO/POCO PAD X1.PNG` | PNG | 2018870 | 1024×1536 | Yes |
| `GADGET-MOTO/POCO X7 PRO.PNG` | PNG | 1943600 | 1024×1536 | Yes |
| `GADGET-MOTO/Poco x7pro.png` | PNG | 1939290 | 1024×1536 | No |
| `GADGET-MOTO/POCO X8 PRO MAX.PNG` | PNG | 2191175 | 1023×1537 | Yes |
| `GADGET-MOTO/POCO X8 PRO.PNG` | PNG | 2110342 | 1023×1537 | Yes |
| `GADGET-MOTO/REDMI 15 5G.PNG` | PNG | 2250263 | 1024×1536 | Yes |
| `GADGET-MOTO/REDMI 15c 5G.PNG` | PNG | 2158170 | 1024×1535 | Yes |
| `GADGET-MOTO/REDMI A5.PNG` | PNG | 2128239 | 1024×1536 | Yes |
| `GADGET-MOTO/REDMI A7 PRO.PNG` | PNG | 2301355 | 1024×1535 | Yes |
| `GADGET-MOTO/REDMI K90 MAX.PNG` | PNG | 2235963 | 1023×1537 | Yes |
| `GADGET-MOTO/REDMI K90 PRO MAX.PNG` | PNG | 2158373 | 1024×1536 | Yes |
| `GADGET-MOTO/REDMI K90.PNG` | PNG | 2068583 | 1024×1536 | Yes |
| `GADGET-MOTO/REDMI NOTE 15.PNG` | PNG | 2345100 | 1024×1535 | Yes |
| `GADGET-MOTO/REDMI NOTE15 PRO 5G.PNG` | PNG | 2397149 | 1024×1535 | Yes |
| `GADGET-MOTO/REDMI NOTE15 PRO PLUS.PNG` | PNG | 2580376 | 1024×1536 | Yes |
| `GADGET-MOTO/REDMI PAD 2 4G.PNG` | PNG | 2115978 | 1024×1536 | Yes |
| `GADGET-MOTO/REDMI PAD 2 SE.PNG` | PNG | 2023999 | 1024×1535 | Yes |
| `GADGET-MOTO/REDMI TURBO 4 PRO(1).PNG` | PNG | 2131518 | 1024×1536 | Yes |
| `GADGET-MOTO/REDMI TURBO 4 PRO.PNG` | PNG | 2140742 | 1023×1537 | Yes |
| `GADGET-MOTO/REDMI TURBO 4.png` | PNG | 2063520 | 1024×1536 | Yes |
| `GADGET-MOTO/REDMI TURBO 5 MAX.PNG` | PNG | 2164933 | 1024×1536 | Yes |
| `GADGET-MOTO/REDMI TURBO 5.PNG` | PNG | 2147615 | 1023×1537 | Yes |
| `GADGET-MOTO/REDMIPAD 2 PRO.PNG` | PNG | 2011507 | 1024×1535 | Yes |
| `GADGET-MOTO/SAMSUNG A07 LTE.PNG` | PNG | 1871063 | 1023×1537 | Yes |
| `GADGET-MOTO/TECNO CAMON 50 ULTRA.PNG` | PNG | 2134998 | 1023×1537 | Yes |
| `GADGET-MOTO/TECNO CAMON 50.PNG` | PNG | 2123166 | 1023×1537 | Yes |
| `GADGET-MOTO/TECNO MEGAPAD PRO.PNG` | PNG | 1906954 | 1023×1537 | Yes |
| `GADGET-MOTO/TECNO POVA CURVE 2.PNG` | PNG | 2106730 | 1039×1513 | Yes |
| `GADGET-MOTO/TECNO POVA CURVE.PNG` | PNG | 2140659 | 1022×1538 | Yes |
| `GADGET-MOTO/TECNO POVA7.PNG` | PNG | 1962713 | 1024×1536 | Yes |
| `GADGET-MOTO/TECNO SPARK 50.PNG` | PNG | 2096830 | 1024×1536 | Yes |
| `GADGET-MOTO/TECNO SPARK GO3.PNG` | PNG | 2020137 | 1054×1492 | Yes |
| `GADGET-MOTO/TECNO SPARK SLIM.PNG` | PNG | 2432396 | 1024×1536 | Yes |
| `GADGET-MOTO/VIVO Y05.PNG` | PNG | 1814121 | 1024×1536 | Yes |
| `GADGET-MOTO/VIVO Y11D.PNG` | PNG | 1839763 | 1024×1536 | Yes |
| `GADGET-MOTO/XIAOMI 17 PRO MAX.PNG` | PNG | 2215204 | 1024×1536 | Yes |
| `GADGET-MOTO/XIAOMI 17 PRO.PNG` | PNG | 2229076 | 1024×1536 | Yes |
| `GADGET-MOTO/XIAOMI 17 T.PNG` | PNG | 2108712 | 1024×1536 | Yes |
| `GADGET-MOTO/XIAOMI 17.PNG` | PNG | 2101126 | 1024×1536 | Yes |
| `GADGET-MOTO/XIAOMI PAD 8.PNG` | PNG | 2241856 | 1023×1537 | Yes |
| `GADGET-MOTO/XIAOMI17TPRO.PNG` | PNG | 2152620 | 1024×1535 | Yes |

## Duplicate and ambiguity review

- No two intake-source files share the same SHA-256 digest.
- The 11 published original primary images have 11 unique SHA-256 digests, and
  no published image path is mapped to more than one product.
- Each public image has the same SHA-256 digest as its ignored source file. The
  11 exact-copy pairs are intentional archival/source relationships, not two
  active mappings.
- Manual contact-sheet review found no unnecessary near-duplicate among the
  published primary images and no unrelated store watermark or confidential
  information.
- `GADGET-MOTO/LEGION Y70 2026.PNG` and
  `GADGET-MOTO/Lenovo Legion Y70 2026.png` appear to concern the same likely
  product but are different files.
- `GADGET-MOTO/REDMI TURBO 4 PRO(1).PNG` and
  `GADGET-MOTO/REDMI TURBO 4 PRO.PNG` appear to concern the same likely product
  but are different files.
- `GADGET-MOTO/Poco x7pro.png` is ambiguous: its filename says POCO X7 Pro,
  while its visible poster content identifies an Infinix GT50 Pro. Its exact
  preview copy is published with the neutral label **Product identity to be
  confirmed** and is not mapped to a transactional product.

## Intentional exclusions

- `GADGET-MOTO/Gadgetmoto logo.jpg` is a brand asset, not a product image. It
  is also a different binary rendition from the already tracked
  `public/brand/gadgetmoto-logo-original.jpg`, so the approved logo was not
  replaced.
- Embedded poster text is preserved in the original public assets but is not
  treated as canonical structured product, pricing, warranty, delivery, or
  policy data.
- All 68 unique incomplete candidates are represented once in the
  non-purchasable preview catalog. None is promoted to a product route or
  purchasable catalog entry.
- POCO C85 retains the existing generated placeholder because no exact or
  unambiguous approved local source was found. No online asset or another
  product's image is substituted.
