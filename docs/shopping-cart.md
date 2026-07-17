# GadgetMoTo Shopping Cart

## Provider and persistence architecture

One `CartProvider` is mounted inside the root `ComparisonProvider` and around the global-search boundary. The single drawer is its sibling to search content, and all server-rendered routes share the same cart. Persistence uses `gadgetmoto:cart:v1`; localStorage is read only after mount, and pre-hydration actions are replayed over sanitized stored state before writing begins.

## Variant-aware cart lines

Stored lines contain only `lineId`, product slug, exact confirmed variant, and quantity. The stable line ID combines slug and normalized variant. Names, categories, thumbnails, and current prices are always derived from the canonical 12-product data. Invalid products or variants are removed, duplicate lines merge, and quantities clamp to 1–99.

Decreasing a quantity from one removes that line. The upper limit is a technical interface guard, not an inventory claim.

## Product, drawer, and page behavior

Product-detail actions add the confirmed variant, merge repeat additions, show the current cart quantity, and open the drawer. The header badge represents total quantity. The accessible drawer supports Escape, backdrop, close, and Continue Shopping actions, locks body scrolling, and restores focus and scrolling on close. `/cart` provides editable lines, an empty state, and a separated responsive summary.

## Totals and limitations

The cart calculates only current merchandise subtotal and line totals from canonical prices. VAT is described as calculated separately after its applicable rate is confirmed, while shipping awaits delivery method and location. No final payable total, inventory promise, delivery estimate, or installment computation is presented.

## Accessibility and coexistence

Cart changes use a polite live region; controls have product-specific names; the drawer has modal dialog semantics; and keyboard focus remains visible. Mobile uses a full-height safe-area-aware sheet and stacked cart page. Cart and search coordinate so opening one closes the other. Their state remains independent from comparison, and the cart drawer is above the comparison tray but below an intentionally open search overlay.

## Future work

Local prototype storage is not an order authority. A future Supabase migration should preserve stable variant-aware line identities while validating products, prices, and inventory server-side. Checkout must revalidate availability, pricing, VAT, delivery, and payment details before payment and must never trust client persistence as authoritative.
