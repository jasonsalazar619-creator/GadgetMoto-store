# GadgetMoTo Product Media Source Matrix

## Media contract

Every normalized product exposes one nullable `primaryImage` and an additional
`images` gallery. The primary image is not repeated in the gallery. A `null`
primary image means the approved generated device placeholder is used.

All active file paths are root-relative, local, and serializable. Product media
uses intrinsic dimensions for layout stability and renders with `object-contain`,
`object-position: center`, full container width and height, and consistent
internal padding. No active image uses an external URL, Base64 data, or an
absolute local path.

## Active primary media

The 11 files below are byte-for-byte copies of the user-supplied project assets.
They were not cropped, compressed, resized, converted, or otherwise edited.
Their full original aspect ratios are retained.

| Product | Active primary image | Original source | Dimensions | Size | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| Xiaomi 17 Ultra 5G Leica Kit | `public/products/xiaomi-17-ultra-5g-leica-kit/original.png` | `GADGET-MOTO/ChatGPT Image Jun 7, 2026, 05_15_10 PM.png` | 1024×1536 | 2,129,680 | `0b4d6e81b3cb02591cf7081181b944632d811ee67ae55e3391542f68b05a6ceb` |
| Apple iPhone 17 | `public/products/apple-iphone-17/original.png` | `GADGET-MOTO/IPHONE 17.PNG` | 1024×1536 | 1,946,393 | `03e3e6f63ef4dba8216477b18f1be4e3258c21f1f2c1d760ab6b265dcfa16e1c` |
| POCO F8 Ultra | `public/products/poco-f8-ultra/original.png` | `GADGET-MOTO/POCO F8 ULTRA.PNG` | 1023×1537 | 2,170,439 | `2669ff2c9e2a610c180dbeb45ce607f0693a4d3470be6fcef94790c3d381806f` |
| Redmi Note 15 Pro Plus 5G | `public/products/redmi-note-15-pro-plus-5g/original.png` | `GADGET-MOTO/REDMI NOTE15 PRO PLUS.PNG` | 1024×1536 | 2,580,376 | `9a7363ba48b4b1f01b26be2fae78359ad31897fbf0dbff2b69093f349795b68e` |
| Redmi Turbo 5 | `public/products/redmi-turbo-5/original.png` | `GADGET-MOTO/REDMI TURBO 5.PNG` | 1023×1537 | 2,147,615 | `968cc49d2c9a21088419094518db6105b4852d433f1f340a011fab4695dfdb6e` |
| Infinix Note 60 Pro 5G | `public/products/infinix-note-60-pro-5g/original.png` | `GADGET-MOTO/Note60PRO.PNG` | 1024×1536 | 1,962,783 | `047d69206e5760f3c2f4e493fe1f1adeed71e3b9aa046aa65681e6aa768b77fe` |
| TECNO Camon 50 | `public/products/tecno-camon-50/original.png` | `GADGET-MOTO/TECNO CAMON 50.PNG` | 1023×1537 | 2,123,166 | `9bb0b63df50cf01b9603dff41a7f7bf61ccc9de424905ae4eab6ab38f689e6f2` |
| POCO Pad X1 | `public/products/poco-pad-x1/original.png` | `GADGET-MOTO/POCO PAD X1.PNG` | 1024×1536 | 2,018,870 | `78251a02fbd2098b0d06325780b1e92d4c85b09ea4b16adcac410f479dccaadc` |
| Xiaomi Pad 8 | `public/products/xiaomi-pad-8/original.png` | `GADGET-MOTO/XIAOMI PAD 8.PNG` | 1023×1537 | 2,241,856 | `3bebb0e62df346d6743c96bcf8d9817fcf31695cdea2980887b1fdd28df93a7c` |
| Redmi Pad 2 Pro 5G | `public/products/redmi-pad-2-pro-5g/original.png` | `GADGET-MOTO/REDMIPAD 2 PRO.PNG` | 1024×1535 | 2,011,507 | `055b99188fd7aaf30f7ca3dbe8933e33fee632daa33c61d9fec8550696670bc7` |
| TECNO Mega Pad Pro | `public/products/tecno-mega-pad-pro/original.png` | `GADGET-MOTO/TECNO MEGAPAD PRO.PNG` | 1023×1537 | 1,906,954 | `0cb9b877cdde6c936846774a55ff41b739515fedceeb3d033820a3764e0d3f27` |
| POCO C85 | Generated device placeholder | No exact approved source discovered | Not applicable | Not applicable | Not applicable |

Every file-based row is a user-supplied project asset. All additional galleries
are empty because no second unique approved source exists.

## Duplicate result

- The 11 active primary-image hashes are unique.
- No active image is assigned to more than one product.
- No primary image is repeated in an active gallery.
- The ignored intake sources and tracked public copies form 11 intentional
  exact-copy pairs; only the public path is active in the storefront.
- No old derivative remains active after the original-file replacement.
- Two distinct possible near-duplicate source pairs and one ambiguous source
  remain inactive and are described in `docs/product-image-inventory.md`.

## Embedded poster content

The source files are original GadgetMoTo promotional posters. Their embedded
text is preserved as supplied because the files were not edited. Canonical
product names, variants, prices, specifications, availability, and policies
remain the structured storefront values documented elsewhere; poster text is
not imported into transactional catalog data.
