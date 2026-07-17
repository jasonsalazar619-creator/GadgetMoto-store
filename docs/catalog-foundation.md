# GadgetMoTo Catalog Foundation

## Route structure

- `/shop` presents all 12 prototype products.
- `/phones` presents the eight verified phones.
- `/tablets` presents the four verified tablets.
- `/products/[slug]` presents one statically generated product detail page.

## Product data model

`src/data/prototype-products.ts` is the single typed source of truth. Each product contains an ID, exact slug, brand, name, phone-or-tablet category, variant, current price, optional verified SRP, Brand New condition, optional static badge, financing message, and placeholder-art seed. Helper functions return all products, category subsets, or one product by slug.

## Static generation

The product route uses `generateStaticParams` to prebuild all 12 confirmed slugs. Route parameters follow the Next.js 16 promised-params convention. Unknown slugs call `notFound()` and render the product-specific not-found experience.

## Product-card navigation

Product names are meaningful links to `/products/[slug]`. Wishlist and comparison controls remain disabled previews, avoiding nested active controls while preserving clear focus treatment and equal-height cards.

## Product detail structure

Each detail page includes accessible breadcrumbs, abstract gallery artwork, confirmed product facts and pricing, clearly bounded preview actions, Messenger contact, payment and delivery summaries, and up to four non-personalized related products from the same category.

## Known data limitations

No colors, hardware specifications, ratings, reviews, stock quantities, warranties, installment amounts, delivery estimates, tax rates, or compatibility claims are stored or shown. Availability and delivery details require sales-team confirmation, and VAT is calculated separately without assuming a rate.

## Intentionally deferred

Catalog search, filtering, sorting, and local result states are implemented in Checkpoint 6A and documented in `docs/catalog-interactions.md`. URL synchronization, global search, cart and comparison state, checkout, accounts, authentication, inventory, reviews, payment integrations, database storage, and admin tools remain deferred.

## Future database migration

The typed array can later be replaced by a server-side repository using the same product shape. Slugs should remain unique, prices should use an integer minor-unit strategy appropriate to the selected database, and verified merchandising fields should be migrated without creating unsupported defaults.

## Future product-image workflow

Abstract CSS artwork is intentionally replaceable. Verified, licensed product imagery should later be uploaded through staff tooling, assigned accessible alt text based on what the image actually shows, optimized through the approved image pipeline, and associated with product variants without altering the original brand asset.
