# GadgetMoTo Product Comparison

## Provider architecture

`ComparisonProvider` is the single focused Client Component state boundary inside the server root layout. It exposes selected slugs/products, count, limit state, selection helpers, clear behavior, and accessible limit feedback. Route pages, shared shells, metadata, and product data remain server-oriented.

## Persistence and hydration

Selections use the versioned `gadgetmoto:compare:v1` localStorage key. The deterministic server and initial client render contain no selections. Storage is read only after mount, entries are validated against current product slugs, duplicates and invalid values are removed, and the result is capped at three. Persistence begins only after restoration completes, preventing valid stored data from being overwritten. Session comparison continues if storage is unavailable.

## Three-product limit

Up to three unique slug identifiers may be selected. A fourth selection leaves the existing set unchanged and produces the accessible message: “You can compare up to three products. Remove one before adding another.”

## Card and detail integration

Product cards use an independent pressed-state compare button outside the product link. Wishlist remains disabled. Product-detail pages use the same comparison control beside the existing preview cart and active Messenger actions.

## Comparison tray

The persistent tray appears only when selections exist. Desktop shows selected product summaries, individual removal, Compare Now, Clear All, and count. Mobile uses a compact bar with an accessible expandable product list and safe-area-aware bottom spacing.

## Comparison page criteria

`/compare` displays selected products as columns and confirmed criteria as rows: brand, category, variant, RAM, storage, current price, verified SRP, calculated savings, condition, promotion, financing, store payment methods, and store delivery options. Each product provides View Product, Message Us, and Remove controls.

## Missing data and limitations

Missing iPhone RAM is shown as “Not confirmed.” Missing SRP is “Not provided,” and savings without SRP is “Not available.” Store payment and delivery rows are explicitly store-level information. Camera, processor, battery, display, charging, warranty, ratings, stock, colors, and network are deferred because they are not consistently verified.

## Accessibility and mobile behavior

Compare controls have descriptive labels and `aria-pressed`; count changes use a polite live region; limit feedback uses an alert; remove controls name products; table headings are semantic; and the mobile tray discloses `aria-expanded` and `aria-controls`. Horizontal scrolling is isolated to the comparison table, preventing page-level overflow.

## Future Supabase migration

The slug-based selection contract can remain local while selected records are resolved from a future server repository. Database-backed product details must preserve missing-data semantics and must not add unverified comparison rows or trust client persistence for inventory or pricing authority.
