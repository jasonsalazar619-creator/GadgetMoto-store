# GadgetMoTo Homepage Composition

Checkpoint 3A replaces the temporary confirmation page with a polished, static storefront composition. It uses Server Components, the approved design tokens, existing UI primitives, inline SVG, and CSS artwork only.

## Section order and purpose

1. **Announcement and navigation** — communicates payment, delivery, and pickup options while providing anchor navigation, static search/cart controls, and a safe external Messenger link.
2. **Upgrade Orbit hero** — establishes the campaign message and directs visitors to new arrivals or the comparison preview.
3. **New Arrivals** — presents eight verified phone records with known variants, prices, and supplied SRPs only.
4. **Browse by brand** — exposes twelve text-only brand tiles without reproducing trademark logos.
5. **Shop by budget** — presents four static budget entry points.
6. **Featured tablets** — presents four verified tablet records with supplied SRPs.
7. **Compare promo** — previews three comparison slots and clearly marks the tool as coming later.
8. **Payment and financing** — separates payment choices from provider-dependent financing options.
9. **Delivery** — communicates nationwide delivery, conditional same-day delivery, and Cavite City pickup without invented rates or timing.
10. **Why GadgetMoTo** — summarizes four supported trust points.
11. **Price-drop alert** — previews an accessible, disabled signup control without collecting data or showing success feedback.
12. **Footer** — repeats core navigation, location, payment context, Messenger access, current-year copyright, and availability messaging.

## Static interactions included

- Section-anchor navigation and hero calls to action.
- Safe new-tab Facebook Messenger links.
- Visual-only search, cart, wishlist, compare, brand, and budget controls.
- Restrained CSS hover and entrance transitions with a reduced-motion fallback.
- Disabled comparison and price-alert actions with explicit coming-soon messaging.

## Functionality intentionally deferred

- Live search suggestions and search results.
- Cart, wishlist, and comparison state.
- Product detail and catalog routes.
- Brand and budget filtering.
- Customer accounts, authentication, checkout, and order processing.
- Inventory, database, and admin content management.
- Maya or financing-provider integrations.
- Price-alert collection and notifications.
- GSAP or other advanced animation.

## Product data limitations

The homepage uses only the names, brands, category, RAM/storage variants, current prices, and SRPs supplied for this checkpoint. Product artwork is abstract CSS and intentionally replaceable. No ratings, reviews, quantities, colors, additional specifications, installment amounts, tax rates, warranties, or store policies are inferred.

## Future GSAP opportunities

The Upgrade Orbit composition could later support a carefully sequenced device reveal, orbital depth, and scroll-linked transitions. Motion should reinforce hierarchy and product focus, preserve immediate access to calls to action, and honor reduced-motion preferences. Product grids may use restrained staggered reveals only when they do not delay browsing.

## Mobile design considerations

- The header uses a compact horizontal anchor strip instead of a complex interactive menu.
- Hero content stacks above scalable CSS device art.
- Product and information grids collapse progressively from four columns to one or two.
- Controls maintain comfortable touch sizes and visible keyboard focus.
- Fluid type, page gutters, and section spacing avoid cramped or oversized mobile layouts.
- Decorative orbit artwork is hidden from assistive technology and contained to prevent horizontal overflow.

## Checkpoint 3B visual refinement

- Storefront-only containers now use a wider desktop canvas while headings and supporting copy retain constrained reading widths.
- The desktop header has more presence, larger hit areas, stronger lockup scale, and modestly increased navigation spacing; intermediate and mobile layouts retain the compact horizontal navigation treatment.
- The Upgrade Orbit hero uses a taller desktop stage, a larger overlapping phone-and-tablet composition, clearer orbit rings and information cards, stronger action hierarchy, and a two-column tablet layout that avoids excessive vertical height.
- Product grids use three columns at compact desktop widths and four on large screens. Cards have larger art areas, more prominent pricing, roomier content, focus-within feedback, and varied abstract device angles and gradient directions.
- Brand and budget tiles gained larger targets, directional feedback, restrained gradients, and abstract decorative forms without introducing trademark artwork or filtering behavior.
- Comparison slots now resemble abstract devices, while payment, delivery, trust, alert, and footer sections use more deliberate scale, padding, and scan-friendly typography.
- Section spacing was tightened into a varied but consistent storefront rhythm, with shorter mobile spacing and generous desktop breathing room.
