# GadgetMoTo Catalog Interactions

## Client Component boundary

The `/shop`, `/phones`, and `/tablets` pages remain Server Components. They pass serializable local product records to the focused `CatalogExplorer` Client Component, which owns only transient search, filter, sort, mobile-panel, and result state. Shared navigation, page structure, metadata, and product-detail routes remain server-rendered.

## Search behavior

Search updates immediately and performs a trimmed, case-insensitive match against confirmed product name, brand, variant, and category text. It has an accessible label and a contextual clear control. No loading state or remote request is used for the 12 local records.

## Supported filters

- Category on `/shop` only: all, phones, or tablets
- Brand options generated from the supplied route data, with accurate source counts
- Current-price ranges: under ₱10,000; ₱10,000–₱19,999; ₱20,000–₱39,999; and ₱40,000 and above
- Confirmed RAM values only
- Confirmed storage values only
- Existing Sale and New badges
- The explicit `financingAvailable` field

The 4G/5G filter remains a disabled planning placeholder because network information is not consistently verified for all prototype products. Product names containing network terms are not treated as structured network specifications.

## Sorting behavior

Sorting runs after search and filtering. Featured preserves the original curated route order; the alternatives sort by ascending price, descending price, product name, or brand without mutating the source array.

## Active-filter feedback

The polite live region announces the changing result count. Non-default search and filters appear as removable chips with descriptive controls. Clear all and reset interactions restore the full route-specific catalog and Featured order.

## Mobile-filter behavior

Search and sorting remain visible. At tablet/mobile widths, the remaining filters collapse behind a keyboard-accessible Filters button with `aria-expanded` and `aria-controls`. The panel does not trap focus or lock body scrolling.

## Accessibility decisions

Every input and select has an associated label. Native controls preserve keyboard behavior, filter-removal buttons have descriptive names, result updates use a polite live region, disabled network planning is explicit, and the empty state provides clear recovery and Messenger actions.

## Local-data limitations

Interactions use only the 12 confirmed local prototype records. The iPhone record has confirmed storage but no RAM value and is therefore excluded when a RAM filter is active. No network, color, hardware specification, inventory, review, warranty, installment, or delivery data is inferred.

## Deferred URL synchronization

Filter and sort state is intentionally not written to query parameters. A full reload or route change resets the explorer. Shareable searches and browser-history persistence within a route remain future work.

## Future Supabase migration

A future server-side product repository can return the same serializable model to the explorer. Database filters, pagination, verified structured specifications, and URL state should be introduced together once product volume requires server querying, while maintaining the current accessible control and result contracts.
