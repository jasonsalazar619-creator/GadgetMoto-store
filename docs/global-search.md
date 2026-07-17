# GadgetMoTo Global Search

## Client Component architecture

The server root layout passes the 12 typed prototype products into one `GlobalSearchProvider`. The provider owns the single overlay, dialog state, query state, focus management, and navigation. Shared header instances render small client triggers that open the same application-level search; pages, layouts, product records, and the storefront header remain server-oriented.

## Search behavior and priority

Search is immediate, trimmed, and case-insensitive across confirmed product name, brand, variant, and category fields. Results are ranked deterministically: product-name prefix, brand prefix, product-name containment, brand containment, then variant or category containment. Original curated order breaks equal-score ties, and at most six suggestions are displayed.

## Trending searches

The empty-query view presents curated launch suggestions for Xiaomi, POCO, iPhone, 512GB, phones under ₱10,000, and tablets. The first four populate the field. The price suggestion opens `/shop` without claiming that its filter is preserved, and Tablets opens `/tablets`. These suggestions are editorial, not analytics-derived.

## Keyboard and dialog behavior

The header button and optional Control/Command-K shortcut open the modal and focus its search field. Arrow keys update the active result, Enter navigates, Escape closes, and Tab is contained among dialog controls. Clicking the backdrop or Close button also closes it. The dialog locks body scrolling, restores it during cleanup, and returns focus to the opening control. Result changes are announced politely and the active option uses `aria-activedescendant`, a border, background, and leading indicator.

## Mobile and accessibility

Desktop uses a centered elevated panel; mobile uses a safe-area-aware full-screen sheet with compact stacked results and large touch targets. The overlay uses named dialog semantics, a persistent input label, meaningful result labels, descriptive empty-state actions, and reduced-motion handling. It sits above the comparison tray without creating another comparison provider or changing comparison persistence.

## Data and future migrations

Search uses only the 12 local prototype records and never infers ratings, inventory, specifications, or financing calculations. Catalog-filter URL synchronization remains deferred. A future Supabase implementation can preserve the same normalized fields, ranking contract, result shape, and accessible interaction model while moving querying server-side. Abstract thumbnails should later be replaced only with verified, licensed product imagery and accurate alternative text.
